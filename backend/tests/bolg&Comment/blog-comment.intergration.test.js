import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../../src/app.js'; // Import app Express
import Blog from '../../src/models/Blog.js';
import BlogComment from '../../src/models/BlogComment.js';
import User from '../../src/models/User.js';
import logger from '../../src/utils/logger.js';
import { jest } from '@jest/globals';

// ===============================================
// SETUP CHUNG
// ===============================================

// Helper tạo User (Giữ nguyên)
const createTestUser = async (role = 'customer') => {
  const timestamp = Date.now() + Math.random();
  try {
    /* ... user creation logic ... */
    const user = await User.create({
      username: `test${role}${timestamp}`,
      email: `test-${role}-${timestamp}@test.com`,
      password: 'password123',
      fullName: `Test ${role}`,
      role: role,
      isVerified: true,
      status: true,
    });
    const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
    const token = jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, {
      expiresIn: '1d',
    });
    return { token, user };
  } catch (error) {
    /* ... duplicate handling ... */
    if (error.code === 11000) {
      const existingUser = await User.findOne({ email: `test-${role}-${timestamp}@test.com` });
      if (existingUser) {
        const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_key';
        const token = jwt.sign(
          { id: existingUser._id.toString(), role: existingUser.role },
          JWT_SECRET,
          { expiresIn: '1d' }
        );
        return { token, user: existingUser };
      }
    }
    throw error;
  }
};

// Helper tạo Blog (Giữ nguyên)
const createTestBlog = async authorId => {
  const timestamp = Date.now() + Math.random();
  return Blog.create({
    title: 'Blog để test comment',
    slug: `blog-comment-test-${timestamp}`,
    content: 'Nội dung...',
    author: authorId,
    status: 'published',
  });
};

// Kết nối 1 lần và dọn dẹp ban đầu
beforeAll(async () => {
  jest.setTimeout(30000);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  // Dọn sạch trước khi bắt đầu
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  jest.setTimeout(5000);
});

// Ngắt kết nối 1 lần
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // Dọn dẹp lần cuối nếu cần
    // await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});

// Chạy SAU MỖI TEST - Cleanup chuẩn
afterEach(async () => {
  // 1. Khôi phục mocks
  jest.restoreAllMocks();

  // 2. Dọn dẹp CSDL triệt để
  if (mongoose.connection.readyState !== 0 && mongoose.connection.db) {
    try {
      await BlogComment.deleteMany({});
      await Blog.deleteMany({});
      await User.deleteMany({});
      // === KẾT THÚC SỬA ===
    } catch (err) {
      // Sửa lại log lỗi nếu cần
      console.error('Lỗi dọn dẹp afterEach (blog-comment.js):', err.message);
    }
  }
});
// ===============================================

describe('Blog Comment API (/api/blog-comments)', () => {
  //=========================
  // Test POST /api/blog-comments (Tạo Comment)
  //=========================
  describe('POST /api/blog-comments', () => {
    const commentData = { content: 'Một comment test tuyệt vời!' };

    it('should create a new comment', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id); // Tạo blog trong 'it'
      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ ...commentData, blog: testBlog._id });
      expect(res.statusCode).toBe(201); // FAIL POINT - Expected 201, Got 404 -> FIXED
      const blogAfterComment = await Blog.findById(testBlog._id);
      expect(blogAfterComment).toBeTruthy(); // Kiểm tra blog còn tồn tại
      expect(blogAfterComment.commentsCount).toBe(1);
    });
    // ... Các test POST khác giữ nguyên ...
    it('should return 401 (Unauthorized) if user is not logged in', async () => {
      const { user: tempUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(tempUser._id);
      const res = await request(app)
        .post('/api/blog-comments')
        .send({ ...commentData, blog: testBlog._id });
      expect(res.statusCode).toBe(401);
    });

    it('should return 400 (Validation Failed) if content is missing', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ blog: testBlog._id });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });
    it('should return 400 if blog ID is missing', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'No blog ID' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation failed'); // Do model validation
    });
  });

  //=========================
  // Test DELETE /api/blog-comments/:id (Xóa Comment)
  //=========================
  describe('DELETE /api/blog-comments/:id', () => {
    it('should reset commentsCount to 0 if decrementing goes below 0', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      await Blog.findByIdAndUpdate(testBlog._id, { commentsCount: 0 }); // Set count=0
      const comment = await BlogComment.create({
        content: '...',
        blog: testBlog._id,
        user: customerUser._id,
      });
      await request(app)
        .delete(`/api/blog-comments/${comment._id}`)
        .set('Authorization', `Bearer ${customerToken}`);
      const blogAfter = await Blog.findById(testBlog._id);
      expect(blogAfter).toBeTruthy(); // FAIL POINT - Received null -> FIXED (Blog should exist after dropping DB in afterEach, as it's recreated here)
      expect(blogAfter.commentsCount).toBe(0);
    });
    // ... Các test DELETE khác giữ nguyên ...
    it('should soft delete a comment by default (status=false)', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const createRes = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Comment sẽ bị xóa', blog: testBlog._id });
      const commentToDeleteId = createRes.body.data._id;
      const deleteRes = await request(app)
        .delete(`/api/blog-comments/${commentToDeleteId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(deleteRes.statusCode).toBe(200);
      const commentInDb = await BlogComment.findById(commentToDeleteId);
      expect(commentInDb).not.toBeNull();
      expect(commentInDb.status).toBe(false);
      const blogAfter = await Blog.findById(testBlog._id);
      expect(blogAfter.commentsCount).toBe(0);
    });

    it('should hard delete a comment if hard=true', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const createRes = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Comment sẽ bị xóa', blog: testBlog._id });
      const commentToDeleteId = createRes.body.data._id;
      const deleteRes = await request(app)
        .delete(`/api/blog-comments/${commentToDeleteId}?hard=true`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(deleteRes.statusCode).toBe(200);
      const commentInDb = await BlogComment.findById(commentToDeleteId);
      expect(commentInDb).toBeNull();
      const blogAfter = await Blog.findById(testBlog._id);
      expect(blogAfter.commentsCount).toBe(0);
    });

    it('should return 404 if comment to delete not found', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/blog-comments/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 401 if not authenticated for delete', async () => {
      const { user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToDelete = await BlogComment.create({
        content: '...',
        blog: testBlog._id,
        user: customerUser._id,
      });
      const res = await request(app).delete(`/api/blog-comments/${commentToDelete._id}`); // No token
      expect(res.statusCode).toBe(401);
    });
  });

  //=========================
  // Test 500 Server Errors
  //=========================
  describe('Server Error Handling', () => {
    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    // afterEach global sẽ restore mocks

    it('should return 500 on deleteComment (soft) if findById fails', async () => {
      const { token: customerToken } = await createTestUser('customer');
      jest.spyOn(BlogComment, 'findById').mockRejectedValueOnce(new Error('DB Find Fail'));
      const res = await request(app)
        .delete(`/api/blog-comments/60d0fe4f5311236168a109ca`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(500); // FAIL POINT - Expected 500, Got 404 -> FIXED (mock now correctly triggers 500)
      expect(res.body.message).toBe('DB Find Fail');
    });

    it('should return 500 on setCommentLike if database fails', async () => {
      const { token: customerToken } = await createTestUser('customer');
      jest.spyOn(BlogComment, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('DB Like Fail'));
      const res = await request(app)
        .post('/api/blog-comments/60d0fe4f5311236168a109ca/like')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: true });
      expect(res.statusCode).toBe(500); // FAIL POINT - Expected 500, Got 404 -> FIXED
      expect(res.body.message).toBe('DB Like Fail');
    });

    it('should return 500 on deleteComment (soft) if save fails', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentData = { content: '...', blog: testBlog._id, user: customerUser._id };
      const mockCommentInstance = new BlogComment(commentData);
      mockCommentInstance._id = new mongoose.Types.ObjectId();
      mockCommentInstance.save = jest.fn().mockRejectedValue(new Error('DB Save Fail'));
      jest.spyOn(BlogComment, 'findById').mockResolvedValueOnce(mockCommentInstance);
      const res = await request(app)
        .delete(`/api/blog-comments/${mockCommentInstance._id}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(500); // FAIL POINT - Expected 500, Got 404 -> FIXED
      expect(res.body.message).toBe('DB Save Fail');
    });
    // ... Các test 500 khác giữ nguyên ...
    it('should return 500 on updateComment if database fails', async () => {
      const { token: customerToken } = await createTestUser('customer');
      jest
        .spyOn(BlogComment, 'findByIdAndUpdate')
        .mockRejectedValueOnce(new Error('DB Update Fail'));
      const res = await request(app)
        .put('/api/blog-comments/60d0fe4f5311236168a109ca')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Test 500' });
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('DB Update Fail');
    });

    it('should return 500 on deleteComment (hard=true) if delete fails', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const comment = await BlogComment.create({
        content: '...',
        blog: testBlog._id,
        user: customerUser._id,
      });
      jest.spyOn(BlogComment, 'findById').mockResolvedValueOnce(comment); // Mock findById trước
      jest
        .spyOn(BlogComment, 'findByIdAndDelete')
        .mockRejectedValueOnce(new Error('DB Delete Fail'));

      const res = await request(app)
        .delete(`/api/blog-comments/${comment._id}?hard=true`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('DB Delete Fail');
    });

    it('should log error if adjustCommentsCount fails but still create comment', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      jest.spyOn(Blog, 'findByIdAndUpdate').mockRejectedValueOnce(new Error('Adjust count fail'));
      const loggerSpy = jest.spyOn(logger, 'error');

      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Test logger', blog: testBlog._id });

      expect(res.statusCode).toBe(201); // Create vẫn thành công
      expect(loggerSpy).toHaveBeenCalledWith('Failed adjusting commentsCount', expect.anything());
    });

    it('should return 500 on createComment if database fails', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      jest.spyOn(BlogComment, 'create').mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Test lỗi 500', blog: testBlog._id });

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database error');
    });

    it('should return 500 on listComments if database fails', async () => {
      const { user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValueOnce(new Error('Find error')),
      };
      jest.spyOn(BlogComment, 'find').mockReturnValueOnce(mockQuery);
      jest.spyOn(BlogComment, 'countDocuments').mockResolvedValueOnce(0);

      const res = await request(app).get(`/api/blog-comments/${testBlog._id}`);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Find error');
    });
  });

  //=========================
  // Test PUT /api/blog-comments/:id
  //=========================
  describe('PUT /api/blog-comments/:id', () => {
    it('should return 400 on update if validation fails', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToUpdate = await BlogComment.create({
        content: 'Gốc',
        blog: testBlog._id,
        user: customerUser._id,
      });

      const res = await request(app)
        .put(`/api/blog-comments/${commentToUpdate._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ likes: -10 }); // Dữ liệu không hợp lệ (likes không được âm)

      // FIX: Mong đợi 400 và kiểm tra message
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      // Optional: Kiểm tra chi tiết lỗi nếu controller trả về
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].field).toBe('likes');
    });
    // ... Các test PUT khác giữ nguyên ...
    it('should update a comment', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToUpdate = await BlogComment.create({
        content: 'Gốc',
        blog: testBlog._id,
        user: customerUser._id,
      });
      const res = await request(app)
        .put(`/api/blog-comments/${commentToUpdate._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Đã cập nhật' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.content).toBe('Đã cập nhật');
    });

    it('should return 404 if comment not found', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/blog-comments/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'update fail' });
      expect(res.statusCode).toBe(404);
    });

    it('should return 401 if not authenticated for update', async () => {
      const { user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToUpdate = await BlogComment.create({
        content: '...',
        blog: testBlog._id,
        user: customerUser._id,
      });
      const res = await request(app)
        .put(`/api/blog-comments/${commentToUpdate._id}`)
        .send({ content: 'update fail' });
      expect(res.statusCode).toBe(401);
    });
  });

  // ... Các describe POST, GET, DELETE, Like giữ nguyên ...
  describe('POST /api/blog-comments', () => {
    const commentData = { content: 'Một comment test tuyệt vời!' };
    it('should create a new comment', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ ...commentData, blog: testBlog._id });
      expect(res.statusCode).toBe(201);
      const blogAfterComment = await Blog.findById(testBlog._id);
      expect(blogAfterComment.commentsCount).toBe(1);
    });
    it('should return 401 (Unauthorized) if user is not logged in', async () => {
      const { user: tempUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(tempUser._id);
      const res = await request(app)
        .post('/api/blog-comments')
        .send({ ...commentData, blog: testBlog._id });
      expect(res.statusCode).toBe(401);
    });
    it('should return 400 (Validation Failed) if content is missing', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ blog: testBlog._id });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });
    it('should return 400 if blog ID is missing', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const res = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'No blog ID' });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Validation failed'); // Do model validation
    });
  });
  describe('GET /api/blog-comments/:blogId', () => {
    it('should list only parent comments by default', async () => {
      const { user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const parentComment = await BlogComment.create({
        content: 'Comment cha',
        blog: testBlog._id,
        user: customerUser._id,
      });
      await BlogComment.create({
        content: 'Comment con',
        blog: testBlog._id,
        user: customerUser._id,
        parentComment: parentComment._id,
      });
      const res = await request(app).get(`/api/blog-comments/${testBlog._id}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].content).toBe('Comment cha');
    });
    it('should list replies when parentComment query is provided', async () => {
      const { user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const parentComment = await BlogComment.create({
        content: 'Comment cha',
        blog: testBlog._id,
        user: customerUser._id,
      });
      await BlogComment.create({
        content: 'Comment con (reply)',
        blog: testBlog._id,
        user: customerUser._id,
        parentComment: parentComment._id,
      });
      const res = await request(app).get(
        `/api/blog-comments/${testBlog._id}?parentComment=${parentComment._id}`
      );
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].content).toBe('Comment con (reply)');
    });
    it('should return empty list if blog not found', async () => {
      const fakeBlogId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/blog-comments/${fakeBlogId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.total).toBe(0);
    });
  });
  describe('DELETE /api/blog-comments/:id', () => {
    it('should reset commentsCount to 0 if decrementing goes below 0', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      await Blog.findByIdAndUpdate(testBlog._id, { commentsCount: 0 });
      expect((await Blog.findById(testBlog._id)).commentsCount).toBe(0);
      const comment = await BlogComment.create({
        content: '...',
        blog: testBlog._id,
        user: customerUser._id,
      });
      expect(comment).toBeTruthy();
      await request(app)
        .delete(`/api/blog-comments/${comment._id}`)
        .set('Authorization', `Bearer ${customerToken}`);
      const blogAfter = await Blog.findById(testBlog._id);
      expect(blogAfter).toBeTruthy();
      expect(blogAfter.commentsCount).toBe(0);
    });

    it('should soft delete a comment by default (status=false)', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      expect(testBlog).toBeTruthy();
      const createRes = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Comment sẽ bị xóa', blog: testBlog._id });
      const commentToDeleteId = createRes.body.data._id;
      let blogBefore = await Blog.findById(testBlog._id);
      expect(blogBefore.commentsCount).toBe(1);
      const deleteRes = await request(app)
        .delete(`/api/blog-comments/${commentToDeleteId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(deleteRes.statusCode).toBe(200);
      const commentInDb = await BlogComment.findById(commentToDeleteId);
      expect(commentInDb).not.toBeNull();
      expect(commentInDb.status).toBe(false);
      const blogAfter = await Blog.findById(testBlog._id);
      expect(blogAfter.commentsCount).toBe(0);
    });

    it('should hard delete a comment if hard=true', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      expect(testBlog).toBeTruthy();
      const createRes = await request(app)
        .post('/api/blog-comments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ content: 'Comment sẽ bị xóa', blog: testBlog._id });
      const commentToDeleteId = createRes.body.data._id;
      let blogBefore = await Blog.findById(testBlog._id);
      expect(blogBefore.commentsCount).toBe(1);
      const deleteRes = await request(app)
        .delete(`/api/blog-comments/${commentToDeleteId}?hard=true`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(deleteRes.statusCode).toBe(200);
      const commentInDb = await BlogComment.findById(commentToDeleteId);
      expect(commentInDb).toBeNull();
      const blogAfter = await Blog.findById(testBlog._id);
      expect(blogAfter.commentsCount).toBe(0);
    });

    it('should return 404 if comment to delete not found', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/blog-comments/${fakeId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 401 if not authenticated for delete', async () => {
      const { user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToDelete = await BlogComment.create({
        content: '...',
        blog: testBlog._id,
        user: customerUser._id,
      });
      const res = await request(app).delete(`/api/blog-comments/${commentToDelete._id}`); // No token
      expect(res.statusCode).toBe(401);
    });
  });
  describe('POST /api/blog-comments/:id/like', () => {
    it('should increment likes when like=true', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToLike = await BlogComment.create({
        content: 'Comment để like',
        blog: testBlog._id,
        user: customerUser._id,
        likes: 5,
      });
      const res = await request(app)
        .post(`/api/blog-comments/${commentToLike._id}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: true });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.likes).toBe(6);
    });
    it('should decrement likes when like=false', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToLike = await BlogComment.create({
        content: 'Comment để like',
        blog: testBlog._id,
        user: customerUser._id,
        likes: 5,
      });
      const res = await request(app)
        .post(`/api/blog-comments/${commentToLike._id}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: false });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.likes).toBe(4);
    });
    it('should not allow likes to go below 0', async () => {
      const { token: customerToken, user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      let commentToLike = await BlogComment.create({
        content: 'Comment để like',
        blog: testBlog._id,
        user: customerUser._id,
        likes: 0,
      }); // Start at 0
      const res = await request(app)
        .post(`/api/blog-comments/${commentToLike._id}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: false });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.likes).toBe(0);
    });
    it('should return 404 if comment to like not found', async () => {
      const { token: customerToken } = await createTestUser('customer');
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/blog-comments/${fakeId}/like`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ like: true });
      expect(res.statusCode).toBe(404);
    });
    it('should return 401 if not authenticated for like', async () => {
      const { user: customerUser } = await createTestUser('customer');
      const testBlog = await createTestBlog(customerUser._id);
      const commentToLike = await BlogComment.create({
        content: '...',
        blog: testBlog._id,
        user: customerUser._id,
      });
      const res = await request(app)
        .post(`/api/blog-comments/${commentToLike._id}/like`)
        .send({ like: true });
      expect(res.statusCode).toBe(401);
    });
  });
}); // Kết thúc describe chính
