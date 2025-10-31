import request from 'supertest';
import express from 'express';
import { validationResult } from 'express-validator';
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateFlashSale,
  validateFlashSaleStatus,
  validateFlashSaleQuery,
  validateFlashSaleId,
  validateProductId,
} from '../src/utils/validation.js';

//==================================================
// PART 1: TEST CÁC HÀM VALIDATION THUẦN TÚY
//==================================================

describe('Pure Validation Functions', () => {
  //--- Test validateEmail ---
  describe('validateEmail', () => {
    it('should return true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  //--- Test validatePhone ---
  describe('validatePhone', () => {
    it('should return true for valid phone numbers (10 or 11 digits)', () => {
      expect(validatePhone('0987654321')).toBe(true);
      expect(validatePhone('01234567890')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(validatePhone('098765432')).toBe(false); // 9 digits
      expect(validatePhone('012345678901')).toBe(false); // 12 digits
      expect(validatePhone('098a654321')).toBe(false); // contains letters
      expect(validatePhone('098 654 321')).toBe(false); // contains spaces
    });
  });

  //--- Test validatePassword ---
  describe('validatePassword', () => {
    it('should return true for a valid password', () => {
      expect(validatePassword('Abcdef1@')).toBe(true);
      expect(validatePassword('StrongPass!2025')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(validatePassword('abcdef1@')).toBe(false); // no uppercase
      expect(validatePassword('ABCDEF1@')).toBe(false); // no lowercase
      expect(validatePassword('Abcdefg@')).toBe(false); // no number
      expect(validatePassword('Abcdefg1')).toBe(false); // no special char
      expect(validatePassword('Abc1@')).toBe(false); // too short
    });
  });
});

//==================================================
// PART 2: TEST CÁC MIDDLEWARE VALIDATOR
//==================================================

// Tạo một app Express giả để test
const app = express();
app.use(express.json());

// Middleware "catcher" để bắt lỗi validation và gửi về
const validationCatcher = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  res.status(200).send('OK');
};

// Định nghĩa các route test
app.post('/validateFlashSale', validateFlashSale, validationCatcher);
app.post('/validateFlashSaleStatus', validateFlashSaleStatus, validationCatcher);
app.get('/validateFlashSaleQuery', validateFlashSaleQuery, validationCatcher);
app.get('/validateFlashSaleId/:id', validateFlashSaleId, validationCatcher);
app.get('/validateProductId/:productId', validateProductId, validationCatcher);

describe('Express Validator Chains', () => {
  //--- Test validateFlashSale ---
  describe('validateFlashSale (POST /validateFlashSale)', () => {
    const validFlashSale = {
      title: 'Mega Sale',
      description: 'Super mega sale',
      startDate: '2025-12-01T10:00:00Z',
      endDate: '2025-12-02T10:00:00Z',
      products: [
        {
          productId: '60d0fe4f5311236168a109ca',
          discountPercent: 50,
        },
        {
          productId: '60d0fe4f5311236168a109cb',
          flashPrice: 99.99,
        },
      ],
      status: 'upcoming',
    };

    it('should return 200 for valid flash sale data', async () => {
      const res = await request(app).post('/validateFlashSale').send(validFlashSale);
      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('OK');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/validateFlashSale')
        .send({ ...validFlashSale, title: '' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Flash sale title is required');
    });

    it('should return 400 if endDate is before startDate', async () => {
      const res = await request(app)
        .post('/validateFlashSale')
        .send({
          ...validFlashSale,
          startDate: '2025-12-02T10:00:00Z',
          endDate: '2025-12-01T10:00:00Z',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('End date must be after start date');
    });

    it('should return 400 if products array is empty', async () => {
      const res = await request(app)
        .post('/validateFlashSale')
        .send({ ...validFlashSale, products: [] });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Must have at least 1 product in flash sale');
    });

    it('should return 400 for invalid productId in products', async () => {
      const invalidData = { ...validFlashSale, products: [{ productId: '123' }] };
      const res = await request(app).post('/validateFlashSale').send(invalidData);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Invalid product ID');
    });

    it('should return 400 for invalid discountPercent', async () => {
      const invalidData = {
        ...validFlashSale,
        products: [{ ...validFlashSale.products[0], discountPercent: 101 }],
      };
      const res = await request(app).post('/validateFlashSale').send(invalidData);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Discount percent must be between 0-100');
    });

    it('should return 400 for invalid flashPrice', async () => {
      const invalidData = {
        ...validFlashSale,
        products: [{ ...validFlashSale.products[0], flashPrice: -10 }],
      };
      const res = await request(app).post('/validateFlashSale').send(invalidData);
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Flash sale price must be greater than or equal to 0');
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .post('/validateFlashSale')
        .send({ ...validFlashSale, status: 'pending' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Invalid status');
    });
  });

  //--- Test validateFlashSaleStatus ---
  describe('validateFlashSaleStatus (POST /validateFlashSaleStatus)', () => {
    it('should return 200 for valid status', async () => {
      const res = await request(app).post('/validateFlashSaleStatus').send({ status: 'active' });
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 if status is empty', async () => {
      const res = await request(app).post('/validateFlashSaleStatus').send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Trạng thái là bắt buộc');
    });

    it('should return 400 if status is invalid', async () => {
      const res = await request(app).post('/validateFlashSaleStatus').send({ status: 'invalid' });
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Invalid status');
    });
  });

  //--- Test validateFlashSaleQuery ---
  describe('validateFlashSaleQuery (GET /validateFlashSaleQuery)', () => {
    it('should return 200 for valid query', async () => {
      const res = await request(app).get('/validateFlashSaleQuery?status=active&page=2&limit=10');
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 for invalid page', async () => {
      const res = await request(app).get('/validateFlashSaleQuery?page=0');
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Trang phải là số nguyên dương');
    });

    it('should return 400 for invalid limit', async () => {
      const res = await request(app).get('/validateFlashSaleQuery?limit=200');
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Giới hạn phải từ 1-100');
    });

    it('should return 400 for invalid sort', async () => {
      const res = await request(app).get('/validateFlashSaleQuery?sort=startDate,endDate'); // Dấu phẩy là không hợp lệ
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('Sắp xếp không hợp lệ');
    });
  });

  //--- Test validateFlashSaleId ---
  describe('validateFlashSaleId (GET /validateFlashSaleId/:id)', () => {
    it('should return 200 for valid MongoID', async () => {
      const validId = '60d0fe4f5311236168a109ca';
      const res = await request(app).get(`/validateFlashSaleId/${validId}`);
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 for invalid MongoID', async () => {
      const res = await request(app).get('/validateFlashSaleId/12345');
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('ID flash sale không hợp lệ');
    });
  });

  //--- Test validateProductId ---
  describe('validateProductId (GET /validateProductId/:productId)', () => {
    it('should return 200 for valid MongoID', async () => {
      const validId = '60d0fe4f5311236168a109ca';
      const res = await request(app).get(`/validateProductId/${validId}`);
      expect(res.statusCode).toBe(200);
    });

    it('should return 400 for invalid MongoID', async () => {
      const res = await request(app).get('/validateProductId/12345');
      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0].msg).toBe('ID sản phẩm không hợp lệ');
    });
  });
});
