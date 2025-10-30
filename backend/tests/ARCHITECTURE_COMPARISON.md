# 🏗️ So Sánh Kiến Trúc: Categories vs AI & Try-on

## 📊 Tổng Quan

| Aspect             | Categories                                       | AI & Try-on                      |
| ------------------ | ------------------------------------------------ | -------------------------------- |
| **Kiến trúc**      | 4 layers (Routes → Controller → Service → Model) | 2 layers (Routes → External API) |
| **Service layer**  | ✅ Có (`category.service.js`)                    | ❌ Không có                      |
| **Logic phức tạp** | ✅ Cao (CRUD, filtering, validation)             | ❌ Thấp (validate → call API)    |
| **Test strategy**  | Unit Test (Service) + Integration                | Integration Test only            |
| **Coverage files** | 4 files (model, service, controller, routes)     | 1 file (routes)                  |
| **Test files**     | 5 files                                          | 2 files                          |

---

## 🗂️ Cấu Trúc Files

### Categories - Full Stack Architecture

```
src/
├── models/
│   └── Category.js                    ✅ Database schema & validation
├── services/
│   └── category.service.js            ✅ Business logic layer
├── controllers/
│   ├── categoryController.js          ✅ HTTP request handling
│   └── dashboardController.js         ✅ Admin operations
└── routes/
    └── categoryRoutes.js              ✅ Route definitions

tests/
└── categories/
    ├── category-model.test.js         → Test Mongoose schema
    ├── category-service.test.js       → Test business logic (UNIT)
    ├── category-controller.test.js    → Test HTTP handlers (UNIT)
    ├── dashboard-controller.test.js   → Test admin operations (UNIT)
    └── category-integration.test.js   → Test full flow (INTEGRATION)
```

---

### AI & Try-on - Simplified Architecture

```
src/
└── routes/
    └── tryonRoutes.js                 ✅ Routes + Logic + API calls

tests/
└── ai-try-on/
    ├── tryon-integration.test.js      → Test full flow (INTEGRATION)
    ├── _helpers/
    │   └── testUtils.js               → Test utilities
    └── mocks/
        └── gemini.mock.js             → Mock external API

❌ KHÔNG CÓ:
  - models/ (không có database)
  - services/ (logic đơn giản)
  - controllers/ (logic trong routes)
```

---

## 💻 Code So Sánh

### Categories - Logic Trong Service

#### File: `src/services/category.service.js`

```javascript
export class CategoryService {
  // ✅ Method 1: Get all categories với filtering
  static async getCategories(productType = null) {
    let query = {};

    // Business logic phức tạp
    if (productType && productType !== 'all') {
      const categoryMap = {
        shoes: ['Sneaker', 'Basketball', 'Running', 'Training', 'Casual'],
        clothing: ['Tops', 'Bottoms', 'T-Shirts', 'Pants', 'Hoodies'],
        accessory: ['Backpacks', 'Beanies', 'Socks', 'Sunglasses'],
      };

      const categories = categoryMap[productType] || [];
      query = categories.length > 0 ? { name: { $in: categories } } : {};
    }

    const results = await Category.find(query).sort({ name: 1 });
    return results;
  }

  // ✅ Method 2: Get single category
  static async getCategoryById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid category ID');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  // ✅ Method 3: Create category
  static async createCategory(data) {
    // Validation
    if (!data.name || !data.productType) {
      throw new Error('Missing required fields');
    }

    // Check duplicate
    const existing = await Category.findOne({ name: data.name });
    if (existing) {
      throw new Error('Category already exists');
    }

    // Create
    const category = new Category(data);
    await category.save();
    return category;
  }

  // ✅ Method 4: Update category
  static async updateCategory(id, data) {
    const category = await this.getCategoryById(id);

    // Check duplicate name
    if (data.name && data.name !== category.name) {
      const existing = await Category.findOne({ name: data.name });
      if (existing) {
        throw new Error('Category name already exists');
      }
    }

    Object.assign(category, data);
    await category.save();
    return category;
  }

  // ✅ Method 5: Delete category
  static async deleteCategory(id) {
    const category = await this.getCategoryById(id);

    // Check if category is in use
    const productsUsingCategory = await Product.countDocuments({ category: id });
    if (productsUsingCategory > 0) {
      throw new Error('Cannot delete category with existing products');
    }

    await category.deleteOne();
    return { message: 'Category deleted successfully' };
  }
}
```

**Đếm logic:**

- ✅ 5 public methods
- ✅ 10+ validation rules
- ✅ 5+ error cases
- ✅ Database operations: find, findById, findOne, save, deleteOne
- ✅ Business rules: duplicate check, in-use check, filtering

**→ Phức tạp → CẦN service layer riêng**

---

### AI & Try-on - Logic Trong Routes

#### File: `src/routes/tryonRoutes.js`

```javascript
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ✅ CHỈ 1 endpoint - Logic đơn giản
router.post(
  '/',
  upload.fields([
    { name: 'userImage', maxCount: 1 },
    { name: 'clothingImage', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Step 1: Validate files (2 lines)
      const userImageFile = req.files?.userImage?.[0];
      const clothingImageFile = req.files?.clothingImage?.[0];

      if (!userImageFile || !clothingImageFile) {
        return res
          .status(400)
          .json({ error: 'Both userImage and clothingImage files are required' });
      }

      // Step 2: Convert to base64 (2 lines)
      const userImageBase64 = Buffer.from(userImageFile.buffer).toString('base64');
      const clothingImageBase64 = Buffer.from(clothingImageFile.buffer).toString('base64');

      // Step 3: Build prompt (1 line - prompt text được định nghĩa sẵn)
      const prompt = `ROLE: You are a world-class AI digital artist...`;

      // Step 4: Call Gemini API (1 line)
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash-exp-image-generation',
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: userImageFile.mimetype, data: userImageBase64 } },
              { inlineData: { mimeType: clothingImageFile.mimetype, data: clothingImageBase64 } },
            ],
          },
        ],
      });

      // Step 5: Extract response (4 lines)
      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(part => part.inlineData);
      const textPart = candidate?.content?.parts?.find(part => part.text);

      // Step 6: Return response (1 line)
      return res.json({
        image: imagePart
          ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
          : null,
        description: textPart?.text || 'AI description not available.',
      });
    } catch (error) {
      console.error('Try-on error:', error);
      return res.status(500).json({ error: 'AI generation failed' });
    }
  }
);

export default router;
```

**Đếm logic:**

- ✅ 1 endpoint
- ✅ 2 validation rules (files required)
- ✅ 2 error cases (missing files, API error)
- ✅ Không có database operations
- ✅ Không có business rules phức tạp

**→ Đơn giản → KHÔNG CẦN service layer**

---

## 🧪 Test Strategy So Sánh

### Categories - 5 Test Files (Unit + Integration)

#### 1. Unit Test - Service Layer

```javascript
// tests/categories/category-service.test.js
describe('Category Service', () => {
  test('should get all categories', async () => {
    // Mock Model
    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([...mockCategories])
    });

    // Test Service
    const result = await CategoryService.getCategories();

    // Assert
    expect(result).toEqual([...mockCategories]);
    expect(Category.find).toHaveBeenCalledWith({});
  });

  test('should filter by productType', async () => {
    Category.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([...mockShoes])
    });

    const result = await CategoryService.getCategories('shoes');

    expect(Category.find).toHaveBeenCalledWith({
      name: { $in: ['Sneaker', 'Basketball', ...] }
    });
  });

  // ... 10+ more unit tests
});
```

#### 2. Integration Test - Full Flow

```javascript
// tests/categories/category-integration.test.js
describe('Category Integration', () => {
  test('should get categories via API', async () => {
    const response = await request(app).get('/api/categories').expect(200);

    expect(response.body).toHaveProperty('categories');
    expect(Array.isArray(response.body.categories)).toBe(true);
  });
});
```

**Total:** 40+ test cases across 5 files

---

### AI & Try-on - 1 Test File (Integration Only)

#### Integration Test - Routes

```javascript
// tests/ai-try-on/tryon-integration.test.js
describe('AI & Try-on — Integration Tests', () => {
  test('should successfully generate try-on image', async () => {
    // Mock Gemini API
    mockGenerateContent.mockResolvedValue(
      createMockGeminiResponse('image_data', 'image/png', 'description')
    );

    // Test full flow
    const res = await request(app)
      .post('/api/tryon')
      .attach('userImage', createMockImageBuffer('jpeg'), 'user.jpg')
      .attach('clothingImage', createMockImageBuffer('png'), 'clothing.png');

    // Assert
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('image');
    expect(res.body).toHaveProperty('description');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  test('should return 400 if userImage is missing', async () => {
    const res = await request(app)
      .post('/api/tryon')
      .attach('clothingImage', createMockImageBuffer('png'), 'clothing.png');

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Both userImage and clothingImage files are required');
  });

  // ... 10+ more integration tests
});
```

**Total:** 12 test cases in 1 file

**Tại sao không cần Unit Test?**

- ❌ Không có Service layer để test riêng
- ❌ Logic quá đơn giản để tách ra
- ✅ Integration test đủ để cover toàn bộ flow

---

## 📈 Coverage Report So Sánh

### Categories Coverage

```bash
npm test tests/categories -- --coverage
```

**Output:**

```
------------------------------|---------|----------|---------|---------|
File                          | % Stmts | % Branch | % Funcs | % Lines |
------------------------------|---------|----------|---------|---------|
src/models/Category.js        |   95.00 |    90.00 |   100.0 |   95.00 |
src/services/category.service.js |   90.00 |    85.00 |   100.0 |   90.00 |
src/controllers/categoryController.js |   88.00 |    80.00 |   100.0 |   88.00 |
src/controllers/dashboardController.js |   85.00 |    78.00 |   100.0 |   85.00 |
------------------------------|---------|----------|---------|---------|
Overall                       |   89.50 |    83.25 |   100.0 |   89.50 |
```

**4 files được test!**

---

### AI & Try-on Coverage

```bash
npm test tests/ai-try-on -- --coverage
```

**Output:**

```
------------------------------|---------|----------|---------|---------|
File                          | % Stmts | % Branch | % Funcs | % Lines |
------------------------------|---------|----------|---------|---------|
src/routes/tryonRoutes.js     |   85.71 |    75.00 |   100.0 |   85.71 |
------------------------------|---------|----------|---------|---------|
Overall                       |   85.71 |    75.00 |   100.0 |   85.71 |
```

**1 file được test!**

**Tại sao chỉ 1 file?**

- ✅ Vì chỉ có 1 file logic (`tryonRoutes.js`)
- ✅ Không có model (không dùng database)
- ✅ Không có service (logic đơn giản)
- ✅ Không có controller riêng (logic trong routes)

---

## 🎯 Khi Nào Cần Service Layer?

### ✅ CẦN Service Layer (như Categories)

Khi có:

- ✅ Business logic phức tạp (>5 methods)
- ✅ Nhiều validation rules (>5 rules)
- ✅ CRUD operations với database
- ✅ Logic cần reuse ở nhiều nơi
- ✅ Nhiều error cases cần handle
- ✅ Transaction logic (rollback, commit)
- ✅ Data transformation phức tạp

**Ví dụ:**

- Categories (CRUD + filtering)
- Products (inventory, variants, pricing)
- Orders (payment, shipping, status)
- Users (authentication, authorization, profile)

---

### ❌ KHÔNG CẦN Service Layer (như AI & Try-on)

Khi có:

- ✅ Logic đơn giản (<3 steps)
- ✅ Chỉ gọi external API
- ✅ Không có database operations
- ✅ Không có business rules phức tạp
- ✅ Logic không reuse
- ✅ Ít error cases

**Ví dụ:**

- AI Try-on (call Gemini API)
- Image upload (call Cloudinary API)
- Email verification (call SendGrid API)
- SMS notification (call Twilio API)

---

## 📊 Decision Tree

```
┌─────────────────────────────────┐
│ Cần tạo Service layer?          │
└────────────┬────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Logic có phức tạp? │
    │ (>5 methods/rules) │
    └────┬──────────┬────┘
         │          │
        YES        NO
         │          │
         ▼          ▼
    ┌────────┐  ┌──────────────┐
    │ CẦN    │  │ Logic ở đâu? │
    │ Service│  └──┬───────┬───┘
    └────────┘     │       │
                Routes   External
                   │       API
                   ▼       │
            ┌──────────┐   │
            │ KHÔNG    │   │
            │ cần      │◄──┘
            │ Service  │
            └──────────┘

Categories → YES → CẦN Service
AI Try-on  → NO → Routes → KHÔNG cần Service
```

---

## 🎓 Best Practices

### Khi Có Service Layer (Categories)

```javascript
// ✅ Tách logic ra service
// routes/categoryRoutes.js
router.get('/', async (req, res) => {
  const result = await CategoryService.getCategories(req.query.type);
  res.json(result);
});

// ✅ Test service riêng
// tests/category-service.test.js
test('should filter by type', async () => {
  const result = await CategoryService.getCategories('shoes');
  expect(result).toEqual([...shoeCategories]);
});
```

---

### Khi Không Có Service Layer (AI Try-on)

```javascript
// ✅ Logic trực tiếp trong routes
// routes/tryonRoutes.js
router.post('/', upload.fields([...]), async (req, res) => {
  // Validate → Call API → Return
  const response = await ai.generateContent({...});
  res.json(response);
});

// ✅ Test integration
// tests/tryon-integration.test.js
test('should generate image', async () => {
  const res = await request(app).post('/api/tryon').attach(...);
  expect(res.status).toBe(200);
});
```

---

## 💡 Key Takeaways

1. **Kiến trúc phụ thuộc vào độ phức tạp**

   - Phức tạp → Nhiều layers (Routes → Controller → Service → Model)
   - Đơn giản → Ít layers (Routes → External API)

2. **Test strategy phụ thuộc vào kiến trúc**

   - Có Service → Unit Test Service + Integration Test
   - Không Service → Integration Test only

3. **Coverage report phản ánh kiến trúc**

   - Categories: 4 files (model, service, controller, routes)
   - Try-on: 1 file (routes)

4. **Không phải lúc nào cũng cần Service layer**
   - Over-engineering = Complexity không cần thiết
   - Keep it simple khi logic đơn giản

---

## 📚 Tham Khảo

- [Service Layer Pattern](https://www.martinfowler.com/eaaCatalog/serviceLayer.html)
- [Testing Strategies](https://kentcdodds.com/blog/write-tests)
- [Avoid Over-Engineering](https://www.joelonsoftware.com/2001/04/21/dont-let-architecture-astronauts-scare-you/)

---

**TL;DR:**

```
Categories = CRUD phức tạp → Service layer → Unit Test + Integration Test
AI Try-on = Call API đơn giản → No service → Integration Test only

Cả hai đều ĐÚNG - tùy theo độ phức tạp! ✅
```
