import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../src/app.js';
import Blog from '../../src/models/Blog.js';
import BlogComment from '../../src/models/BlogComment.js'; // Needed for cleanup
import User from '../../src/models/User.js';
import logger from '../../src/utils/logger.js';

// ===============================================
// SETUP CHUNG
// ===============================================

// Helper tạo User (Giữ nguyên)
const createTestUser = async (role = 'customer') => {
  const timestamp = Date.now() + Math.random();
  const userData = {
    /* ... user data ... */ username: `test${role}${timestamp}`,
    email: `test-${role}-${timestamp}@test.com`,
    password: 'password123',
    fullName: `Test ${role}`,
    role: role,
    isVerified: true,
    status: true,
  };
  try {
    const user = await User.findOneAndUpdate(
      { email: userData.email },
      { $setOnInsert: userData },
      { new: true, upsert: true, runValidators: true }
    );
    const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user };
  } catch (error) {
    /* ... duplicate handling ... */
    if (error.code === 11000) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
        const token = jwt.sign({ id: existingUser._id.toString() }, JWT_SECRET, {
          expiresIn: '1d',
        });
        return { token, user: existingUser };
      }
    }
    console.error('Critical error creating test user:', error);
    throw error;
  }
};

// Kết nối 1 lần và dọn dẹp ban đầu
beforeAll(async () => {
  jest.setTimeout(30000);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Đợi models được khởi tạo
  await Promise.all([Blog.init(), User.init(), BlogComment.init()]);

  // Dọn sạch CSDL *trước khi* chạy bất kỳ test nào trong file này
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }

  jest.setTimeout(10000); // Tăng timeout mặc định cho các test case
});

// Ngắt kết nối 1 lần
// Chạy SAU MỖI TEST - Cleanup chuẩn bằng deleteMany
afterEach(async () => {
  // 1. Khôi phục mocks
  jest.restoreAllMocks();

  // 2. Dọn dẹp CSDL liên quan
  if (mongoose.connection.readyState !== 0) {
    try {
      // Xóa tất cả dữ liệu có thể bị ảnh hưởng bởi test
      await BlogComment.deleteMany({});
      await Blog.deleteMany({});
      await User.deleteMany({});
      // Đợi một chút để đảm bảo các operation hoàn thành
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (err) {
      console.error('Error cleaning database in afterEach:', err);
    }
  }
});

// ===============================================
// BẮT ĐẦU TEST
// ===============================================

describe('Blog API (/api/blogs)', () => {
  //=========================
  // Test POST /api/blogs (Tạo Blog)
  //=========================
  describe('POST /api/blogs', () => {
    const blogData = {
      title: 'Blog Test Title',
      content: '<p>Blog content.</p>',
      category: 'Test',
    };

    it('should create a new blog as admin (status=draft by default)', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...blogData, title: 'Admin Blog Title POST Unique 1' }); // Tên duy nhất
      // CHECKPOINT: User should exist now
      const userExists = await User.findById(adminUser._id);
      expect(userExists).toBeTruthy(); // Debug: Check if user exists before request returns

      expect(res.statusCode).toBe(201); // <<< LỖI Ở ĐÂY
      expect(res.body.data.slug).toBe('admin-blog-title-post-unique-1');
      expect(res.body.data.author.toString()).toBe(adminUser._id.toString());
    });

    it('should sanitize inputs on create', async () => {
      // === BẮT ĐẦU SỬA: Thêm lại code request ===
      const { token: adminToken } = await createTestUser('admin');
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Create <script>alert(1)</script>',
          slug: 'create-sanitize',
          content:
            '<p>Good</p><a href="javascript:alert(1)">Bad Link</a><iframe src="bad.com"></iframe>',
          summary: 'Summary with <b>html</b>',
          category: 'Category <script>!</script>',
          tags: ['Tag1<script>', 'Tag2'],
        });
      // === KẾT THÚC SỬA ===

      expect(res.statusCode).toBe(201);

      // Text fields phải bị lột hết HTML
      // (Giữ nguyên các expect đã sửa từ lần trước)
      expect(res.body.data.title).toBe('Create scriptalert(1)/script');
      expect(res.body.data.summary).toBe('Summary with bhtml/b');
      expect(res.body.data.category).toBe('Category script!/script');
      expect(res.body.data.tags).toEqual(['Tag1script', 'Tag2']);
      expect(res.body.data.content).toBe('<p>Good</p><a>Bad Link</a>');
    });

    it('should create a unique slug with suffix if title is duplicated', async () => {
      const { token: adminToken } = await createTestUser('admin');
      await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test Trùng Lặp POST Dup Unique 1', content: '...', category: 'Test' });
      // Small delay crucial for write consistency before the next create
      await new Promise(resolve => setTimeout(resolve, 150)); // Tăng delay
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test Trùng Lặp POST Dup Unique 1', content: '...', category: 'Test' });
      expect(res.statusCode).toBe(201); // <<< LỖI Ở ĐÂY
      expect(res.body.data.slug).toBe('test-trung-lap-post-dup-unique-1-1');
    });

    it('should return 400 if slug is duplicate', async () => {
      const { token: adminToken } = await createTestUser('admin');
      await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...blogData,
          title: 'Unique Slug POST Dup Test Final',
          slug: 'unique-slug-post-dup-test-final',
        });
      await new Promise(resolve => setTimeout(resolve, 150)); // Tăng delay
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...blogData,
          title: 'Duplicate Slug POST Dup Test Final',
          slug: 'unique-slug-post-dup-test-final',
        });
      expect(res.statusCode).toBe(400); // <<< LỖI Ở ĐÂY
      // Kiểm tra message lỗi cụ thể hơn
      expect(res.body.message).toMatch(/Duplicate value|Validation failed/i); // Chấp nhận 1 trong 2 lỗi
    });

    it('should return 403 (Forbidden) if user is customer', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(blogData);
      expect(res.statusCode).toBe(403); // <<< LỖI Ở ĐÂY
    });
    // ... Các test POST khác (random slug, publishedAt, 400 title missing) giữ nguyên ...
    it('should create a random slug if title slugifies to empty string', async () => {
      const { token: adminToken } = await createTestUser('admin');
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '!!! ??? ...', content: '...', category: 'Test' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.slug).toBeDefined();
      expect(res.body.data.slug.length).toBeGreaterThan(0);
    });

    it('should create a blog as admin and set publishedAt if status=published', async () => {
      const { token: adminToken } = await createTestUser('admin');
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...blogData, title: 'Admin Published Blog', status: 'published' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.status).toBe('published');
      expect(res.body.data.publishedAt).toBeDefined();
    });

    it('should return 400 if title is missing (auto-slug fails)', async () => {
      const { token: adminToken } = await createTestUser('admin');
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'No title' });
      expect(res.statusCode).toBe(400); // <<< LỖI Ở ĐÂY
      expect(res.body.message).toContain('Validation failed');
    });
  });

  //=========================
  // Test GET /api/blogs (List)
  //=========================
  describe('GET /api/blogs (List)', () => {
    let adminUserId, shopUserId;

    beforeEach(async () => {
      const admin = await createTestUser('admin');
      adminUserId = admin.user._id;
      const shop = await createTestUser('shop');
      shopUserId = shop.user._id;
      const ts = Date.now() + Math.floor(Math.random() * 1000);
      await Blog.create([
        {
          title: 'Blog Tech GET List',
          slug: `blog-tech-get-list-${ts}`,
          content: 'Tech content js',
          category: 'Tech',
          status: 'published',
          author: adminUserId,
          tags: ['js', 'node'],
          isFeatured: true,
        },
        {
          title: 'Blog News GET List',
          slug: `blog-news-get-list-${ts}`,
          content: 'News content react',
          category: 'News',
          status: 'draft',
          author: shopUserId,
          tags: ['react'],
        },
        {
          title: 'Blog Search GET List',
          slug: `blog-search-get-list-${ts}`,
          content: 'abc search content',
          category: 'Search',
          status: 'published',
          author: adminUserId,
          tags: ['search'],
        },
      ]);
      await new Promise(resolve => setTimeout(resolve, 300)); // Tăng delay cho index
    });

    it('should filter by tags as an array', async () => {
      const res = await request(app).get('/api/blogs?tags[]=js&tags[]=react');
      expect(res.body.data).toBeDefined(); // Kiểm tra data tồn tại
      expect(res.body.data.length).toBe(2); // <<< LỖI Ở ĐÂY
    });

    it('should sort by title ascending', async () => {
      // beforeEach đã tạo: 'Blog Tech...', 'Blog News...', 'Blog Search...'
      // Chỉ 2 cái 'published'
      const res = await request(app).get('/api/blogs?status=published&sortBy=title&order=asc');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(2); // Chỉ 2 blog published
      // Sắp xếp theo ABC
      expect(res.body.data[0].title).toBe('Blog Search GET List');
      expect(res.body.data[1].title).toBe('Blog Tech GET List');
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/api/blogs?category=News');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1); // <<< LỖI Ở ĐÂY
      expect(res.body.data[0].title).toBe('Blog News GET List');
    });

    it('should filter by author', async () => {
      const res = await request(app).get(`/api/blogs?author=${shopUserId}`);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1); // <<< LỖI Ở ĐÂY
      expect(res.body.data[0].title).toBe('Blog News GET List');
    });

    it('should filter by isFeatured', async () => {
      const res = await request(app).get('/api/blogs?isFeatured=true');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1); // <<< LỖI Ở ĐÂY
      expect(res.body.data[0].title).toBe('Blog Tech GET List');
    });

    it('should filter by tags (single tag)', async () => {
      const res = await request(app).get('/api/blogs?tags=react');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1); // <<< LỖI Ở ĐÂY
    });

    it('should filter by tags (multiple tags as string)', async () => {
      const res = await request(app).get('/api/blogs?tags=js,search');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(2); // <<< LỖI Ở ĐÂY
    });

    it('should search by text query (q)', async () => {
      const res = await request(app).get('/api/blogs?q=search');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(1); // <<< LỖI Ở ĐÂY
      expect(res.body.data[0].title).toContain('Search');
    });
  });

  //=========================
  // Test GET /api/blogs/:idOrSlug (Get Single)
  //=========================
  describe('GET /api/blogs/:idOrSlug', () => {
    let testBlog;
    let adminUserId;

    beforeEach(async () => {
      // Dùng beforeEach để đảm bảo data sạch cho mỗi test
      const { user } = await createTestUser('admin');
      adminUserId = user._id;
      testBlog = await Blog.create({
        title: 'Get Me Blog',
        slug: 'get-me-slug',
        content: '...',
        author: adminUserId,
      });
    });

    it('should get a blog by its ID', async () => {
      const res = await request(app).get(`/api/blogs/${testBlog._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Get Me Blog');
    });

    it('should get a blog by its SLUG', async () => {
      // Test nhánh logic còn lại của hàm getBlog
      const res = await request(app).get(`/api/blogs/${testBlog.slug}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Get Me Blog');
    });

    it('should return 404 if blog not found by ID', async () => {
      // Test nhánh 404 của getBlog
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/blogs/${fakeId}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 404 if blog not found by slug', async () => {
      // Test nhánh 404 của getBlog
      const res = await request(app).get('/api/blogs/non-existent-slug');
      expect(res.statusCode).toBe(404);
    });
  });

  //=========================
  // Test PUT /api/blogs/:id (Cập nhật Blog)
  //=========================
  describe('PUT /api/blogs/:id', () => {
    it('should update a blog', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const blogToUpdate = await Blog.create({
        title: 'Original Title PUT OK',
        slug: 'original-slug-put-ok',
        content: '...',
        status: 'draft',
        author: adminUser._id,
      });
      const res = await request(app)
        .put(`/api/blogs/${blogToUpdate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title PUT OK', status: 'published' });
      expect(res.statusCode).toBe(200); // <<< LỖI Ở ĐÂY
      expect(res.body.data.title).toBe('Updated Title PUT OK');
      expect(res.body.data.slug).toBe('updated-title-put-ok');
    });

    it('should update and create random slug if title slugifies to empty', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const blog = await Blog.create({
        title: 'Original',
        slug: 'original',
        content: '...',
        author: adminUser._id,
      });

      const res = await request(app)
        .put(`/api/blogs/${blog._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '!!! ??? %%%' }); // Title này sẽ slugify thành rỗng

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('!!! ??? %%%');
      expect(res.body.data.slug).not.toBe('original'); // Phải tạo slug mới
      expect(res.body.data.slug.length).toBeGreaterThan(0); // Phải là slug ngẫu nhiên
    });

    it('should sanitize inputs on update', async () => {
      // === BẮT ĐẦU SỬA: Thêm lại code request ===
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const blog = await Blog.create({
        title: 'Original',
        slug: 'original',
        content: '...',
        author: adminUser._id,
      });
      const res = await request(app)
        .put(`/api/blogs/${blog._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Title <script>alert(1)</script>',
          content: '<p>Good</p><iframe src="bad.com"></iframe><img src="x" onerror="alert(1)">',
          summary: 'Summary with <b>html</b>',
        });
      // === KẾT THÚC SỬA ===

      expect(res.statusCode).toBe(200);

      // Text fields
      // (Giữ nguyên các expect đã sửa từ lần trước)
      expect(res.body.data.title).toBe('Title scriptalert(1)/script');
      expect(res.body.data.summary).toBe('Summary with bhtml/b');
      // Content (iframe bị xóa, onerror bị xóa)
      expect(res.body.data.content).toBe('<p>Good</p><img src="x">');
    });

    it('should create a unique slug on update if title conflicts', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      await Blog.create({
        title: 'Blog 1 PUT Conflict OK',
        slug: 'blog-1-put-conflict-ok',
        content: '...',
        author: adminUser._id,
      });
      const blogToUpdate = await Blog.create({
        title: 'Blog 2 PUT Conflict OK',
        slug: 'blog-2-put-conflict-ok',
        content: '...',
        author: adminUser._id,
      });
      const res = await request(app)
        .put(`/api/blogs/${blogToUpdate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Blog 1 PUT Conflict OK' });
      expect(res.statusCode).toBe(200); // <<< LỖI Ở ĐÂY
      expect(res.body.data.slug).toBe('blog-1-put-conflict-ok-1');
    });

    it('should return 400 (Duplicate Key) on update if slug conflicts', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      await Blog.create({
        title: 'Blog 1 PUT Dup Slug Final OK',
        slug: 'blog-1-put-dup-slug-final-ok',
        content: '...',
        author: adminUser._id,
      });
      await new Promise(resolve => setTimeout(resolve, 150)); // Delay
      const blogToUpdate = await Blog.create({
        title: 'Blog 2 PUT Dup Slug Final OK',
        slug: 'blog-2-put-dup-slug-final-ok',
        content: '...',
        author: adminUser._id,
      });
      const res = await request(app)
        .put(`/api/blogs/${blogToUpdate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slug: 'blog-1-put-dup-slug-final-ok' }); // Gửi slug trùng
      expect(res.statusCode).toBe(400); // <<< LỖI Ở ĐÂY
      expect(res.body.message).toMatch(/Duplicate value|Validation failed/i);
    });

    it('should return 400 (ValidationError) on update if validation fails', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const blogToUpdate = await Blog.create({
        title: 'Test Val PUT OK',
        slug: 'test-val-put-ok',
        content: '...',
        author: adminUser._id,
      });
      const res = await request(app)
        .put(`/api/blogs/${blogToUpdate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ views: -100 });
      expect(res.statusCode).toBe(400); // <<< LỖI Ở ĐÂY
      expect(res.body.message).toBe('Validation failed');
    });
    // ... test 404 giữ nguyên ...
    it('should return 404 if blog not found', async () => {
      const { token: adminToken } = await createTestUser('admin');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/blogs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title PUT 404' });
      expect(res.statusCode).toBe(404);
    });
  });

  //=========================
  // Test Toggles (Publish, Feature)
  //=========================
  describe('POST /:id/publish and /:id/feature', () => {
    it('should unpublish a blog (setPublishStatus)', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const testBlog = await Blog.create({
        title: 'Toggle Blog UNPUB OK',
        slug: 'toggle-blog-unpub-ok',
        content: '...',
        author: adminUser._id,
        status: 'published',
      });
      const res = await request(app)
        .post(`/api/blogs/${testBlog._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ publish: false });
      expect(res.statusCode).toBe(200); // <<< LỖI Ở ĐÂY
      expect(res.body.data.status).toBe('draft');
    });

    it('should toggle featured status (toggleFeatured)', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const testBlog = await Blog.create({
        title: 'Toggle Blog FEAT OK',
        slug: 'toggle-blog-feat-ok',
        content: '...',
        author: adminUser._id,
        isFeatured: false,
      });
      const res = await request(app)
        .post(`/api/blogs/${testBlog._id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200); // <<< LỖI Ở ĐÂY
      expect(res.body.data.isFeatured).toBe(true);
      const res2 = await request(app)
        .post(`/api/blogs/${testBlog._id}/feature`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.isFeatured).toBe(false);
    });
    // ... Các test Toggle khác giữ nguyên ...
    it('should publish a blog (setPublishStatus)', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const testBlog = await Blog.create({
        title: 'Toggle Blog PUB OK',
        slug: 'toggle-blog-pub-ok',
        content: '...',
        author: adminUser._id,
        status: 'draft',
      });
      const res = await request(app)
        .post(`/api/blogs/${testBlog._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ publish: true });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('published');
    });

    it('should return 404 if blog to publish is not found', async () => {
      const { token: adminToken } = await createTestUser('admin');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ publish: true });
      expect(res.statusCode).toBe(404);
    });
    it('should return 404 if blog to feature is not found', async () => {
      const { token: adminToken } = await createTestUser('admin');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/feature`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  //=========================
  // Test Public Actions (Views, Likes)
  //=========================
  describe('POST /:id/views and /:id/like', () => {
    it('should increment likes (setLike)', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const { user: adminUser } = await createTestUser('admin');
      const testBlog = await Blog.create({
        title: 'Public Blog Like OK',
        slug: 'public-blog-like-ok',
        content: '...',
        author: adminUser._id,
        likes: 5,
      });
      const res = await request(app)
        .post(`/api/blogs/${testBlog._id}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: true });
      expect(res.statusCode).toBe(200); // <<< LỖI Ở ĐÂY
      expect(res.body.data.likes).toBe(6);
    });

    it('should decrement likes (setLike)', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const { user: adminUser } = await createTestUser('admin');
      const testBlog = await Blog.create({
        title: 'Public Blog Unlike OK',
        slug: 'public-blog-unlike-ok',
        content: '...',
        author: adminUser._id,
        likes: 5,
      });
      const res = await request(app)
        .post(`/api/blogs/${testBlog._id}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: false });
      expect(res.statusCode).toBe(200); // <<< LỖI Ở ĐÂY
      expect(res.body.data.likes).toBe(4);
    });

    it('should not allow likes to go below 0', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const { user: adminUser } = await createTestUser('admin');
      const testBlog = await Blog.create({
        title: 'Public Blog Zero OK',
        slug: 'public-blog-zero-ok',
        content: '...',
        author: adminUser._id,
        likes: 0,
      });
      const res = await request(app)
        .post(`/api/blogs/${testBlog._id}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: false });
      expect(res.statusCode).toBe(200); // <<< LỖI Ở ĐÂY
      expect(res.body.data.likes).toBe(0);
    });
    // ... Các test Views/Like khác giữ nguyên ...
    it('should increment views (incrementViews)', async () => {
      const { user: adminUser } = await createTestUser('admin');
      const testBlog = await Blog.create({
        title: 'Public Blog Views OK',
        slug: 'public-blog-views-ok',
        content: '...',
        author: adminUser._id,
        views: 10,
      });
      const res = await request(app).post(`/api/blogs/${testBlog._id}/views`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.views).toBe(11);
    });
    it('should return 404 if blog for views is not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).post(`/api/blogs/${fakeId}/views`);
      expect(res.statusCode).toBe(404);
    });
    it('should return 404 if blog for like is not found', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: true });
      expect(res.statusCode).toBe(404);
    });
  });

  // ... Test DELETE giữ nguyên ...
  describe('DELETE /api/blogs/:id', () => {
    it('should delete a blog', async () => {
      const { token: adminToken, user: adminUser } = await createTestUser('admin');
      const blogToDelete = await Blog.create({
        title: 'To Delete DEL OK',
        slug: 'to-delete-del-ok',
        content: '...',
        author: adminUser._id,
      });
      const res = await request(app)
        .delete(`/api/blogs/${blogToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      const inDb = await Blog.findById(blogToDelete._id);
      expect(inDb).toBeNull();
    });
    it('should return 404 if blog to delete is not found', async () => {
      const { token: adminToken } = await createTestUser('admin');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/blogs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  //=========================
  // Test 500 Server Errors
  //=========================
  describe('500 Server Error Handling', () => {
    let adminToken;
    const fakeId = '60d0fe4f5311236168a109ca'; // Một ID hợp lệ để vượt qua validation
    const errorLog = new Error('Database Failure');

    beforeEach(async () => {
      const { token } = await createTestUser('admin');
      adminToken = token;
    });

    // Tắt logger.error và console.error khi chạy các test 500
    beforeEach(() => {
      jest.spyOn(logger, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    // afterEach global sẽ tự động restoreMocks

    it('should return 500 on createBlog if Blog.create fails', async () => {
      jest.spyOn(Blog, 'create').mockRejectedValueOnce(errorLog);
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test 500', content: '...', category: 'Test' });
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on getBlog if Blog.findOne fails', async () => {
      jest.spyOn(Blog, 'findOne').mockImplementation(() => ({
        populate: jest.fn().mockRejectedValueOnce(errorLog),
      }));
      const res = await request(app).get(`/api/blogs/${fakeId}`);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on listBlogs if Blog.find fails', async () => {
      jest.spyOn(Blog, 'find').mockImplementation(() => ({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValueOnce(errorLog),
      }));
      jest.spyOn(Blog, 'countDocuments').mockResolvedValueOnce(0); // Vì Promise.all

      const res = await request(app).get('/api/blogs');
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on updateBlog if findByIdAndUpdate fails', async () => {
      jest.spyOn(Blog, 'findByIdAndUpdate').mockRejectedValueOnce(errorLog);
      const res = await request(app)
        .put(`/api/blogs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test 500 Update' });
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on deleteBlog if findByIdAndDelete fails', async () => {
      jest.spyOn(Blog, 'findByIdAndDelete').mockRejectedValueOnce(errorLog);
      const res = await request(app)
        .delete(`/api/blogs/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on setPublishStatus if findByIdAndUpdate fails', async () => {
      jest.spyOn(Blog, 'findByIdAndUpdate').mockRejectedValueOnce(errorLog);
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ publish: true });
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on toggleFeatured if findById fails', async () => {
      jest.spyOn(Blog, 'findById').mockRejectedValueOnce(errorLog);
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/feature`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on toggleFeatured if blog.save fails', async () => {
      const mockBlog = {
        _id: fakeId,
        isFeatured: false,
        save: jest.fn().mockRejectedValueOnce(errorLog),
      };
      jest.spyOn(Blog, 'findById').mockResolvedValueOnce(mockBlog);
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/feature`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on incrementViews if findByIdAndUpdate fails', async () => {
      jest.spyOn(Blog, 'findByIdAndUpdate').mockRejectedValueOnce(errorLog);
      const res = await request(app).post(`/api/blogs/${fakeId}/views`);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on setLike if findByIdAndUpdate fails', async () => {
      jest.spyOn(Blog, 'findByIdAndUpdate').mockRejectedValueOnce(errorLog);
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/like`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ like: true });
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });

    it('should return 500 on setLike if blog.save (for < 0 check) fails', async () => {
      // Test nhánh if (blog.likes < 0) { ... await blog.save(); }
      const mockBlog = { _id: fakeId, likes: -1, save: jest.fn().mockRejectedValueOnce(errorLog) };
      jest.spyOn(Blog, 'findByIdAndUpdate').mockResolvedValueOnce(mockBlog);
      const res = await request(app)
        .post(`/api/blogs/${fakeId}/like`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ like: false }); // Gửi unlike để kích hoạt check < 0
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database Failure');
    });
  });
}); // Kết thúc describe chính
