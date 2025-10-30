/**
 * AI & Try-on - Backend API Tests
 * Test Suite: BACKEND API TESTS (TC-TRYON-001 to TC-TRYON-022)
 *
 * Tests the core try-on API endpoint functionality including:
 * - File upload validation
 * - Image format support
 * - Gemini API integration
 * - Error handling
 * - Base64 encoding
 * - Response formatting
 */

import { jest } from '@jest/globals';

// Mock dependencies before imports
const mockGeminiAPI = {
  models: {
    generateContent: jest.fn(),
  },
};

const mockGoogleGenAI = jest.fn(() => mockGeminiAPI);

// Mock @google/genai
jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: mockGoogleGenAI,
}));

// Import after mocks
const { default: tryonRoutes } = await import('../../src/routes/tryonRoutes.js');
const express = await import('express');
const request = await import('supertest');

describe('AI & Try-on — Backend API Tests', () => {
  let app;
  let originalEnv;

  beforeAll(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Setup test environment
    process.env.GEMINI_API_KEY = 'test-key-123';
    process.env.GEMINI_MODEL_ID = 'gemini-2.0-flash-exp-image-generation';
  });

  beforeEach(() => {
    // Create fresh Express app for each test
    app = express.default();
    app.use(express.default.json());
    app.use('/api/tryon', tryonRoutes);

    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  // ==================== HAPPY PATH TESTS ====================

  test('TC-TRYON-001 | Successfully generate try-on image with valid inputs', async () => {
    // Given: Gemini API key configured and mock returns success
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
                  mimeType: 'image/png',
                },
              },
              {
                text: 'Successfully generated virtual try-on image.',
              },
            ],
          },
        },
      ],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(mockResponse);

    // Create test image buffers
    const userImageBuffer = Buffer.from('fake-jpeg-data', 'utf-8');
    const clothingImageBuffer = Buffer.from('fake-png-data', 'utf-8');

    // When: POST request with both images
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', userImageBuffer, 'user.jpg')
      .attach('clothingImage', clothingImageBuffer, 'clothing.png');

    // Then: HTTP 200 with valid response structure
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('image');
    expect(response.body).toHaveProperty('description');
    expect(response.body.image).toMatch(/^data:image\/png;base64,/);
    expect(response.body.description).toBeTruthy();
    expect(mockGeminiAPI.models.generateContent).toHaveBeenCalled();
  });

  // ==================== VALIDATION TESTS ====================

  test('TC-TRYON-002 | Missing userImage file', async () => {
    // Given: API configured
    const clothingImageBuffer = Buffer.from('fake-png-data', 'utf-8');

    // When: Send POST request with only clothingImage
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('clothingImage', clothingImageBuffer, 'clothing.png');

    // Then: HTTP 400 with error message
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Both userImage and clothingImage files are required');
  });

  test('TC-TRYON-003 | Missing clothingImage file', async () => {
    // Given: API configured
    const userImageBuffer = Buffer.from('fake-jpeg-data', 'utf-8');

    // When: Send POST request with only userImage
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', userImageBuffer, 'user.jpg');

    // Then: HTTP 400 with error message
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Both userImage and clothingImage files are required');
  });

  test('TC-TRYON-004 | Both files missing', async () => {
    // Given: API configured

    // When: Send POST request with no files
    const response = await request.default(app).post('/api/tryon').send({});

    // Then: HTTP 400 with error message
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Both userImage and clothingImage files are required');
  });

  // ==================== FORMAT SUPPORT TESTS ====================

  test('TC-TRYON-007 | JPEG image format', async () => {
    // Given: API configured with mock success response
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64-encoded-image-data',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(mockResponse);

    const jpegBuffer = Buffer.from('fake-jpeg-data', 'utf-8');

    // When: Upload JPEG images
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', jpegBuffer, { filename: 'user.jpg', contentType: 'image/jpeg' })
      .attach('clothingImage', jpegBuffer, { filename: 'clothing.jpg', contentType: 'image/jpeg' });

    // Then: HTTP 200, Gemini API called with correct mimeType, valid response
    expect(response.status).toBe(200);
    expect(response.body.image).toBeTruthy();
    expect(mockGeminiAPI.models.generateContent).toHaveBeenCalled();

    const apiCall = mockGeminiAPI.models.generateContent.mock.calls[0][0];
    expect(apiCall.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg');
    expect(apiCall.contents[0].parts[2].inlineData.mimeType).toBe('image/jpeg');
  });

  test('TC-TRYON-008 | PNG image format', async () => {
    // Given: API configured
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64-png-data',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(mockResponse);

    const pngBuffer = Buffer.from('fake-png-data', 'utf-8');

    // When: Upload PNG images
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', pngBuffer, { filename: 'user.png', contentType: 'image/png' })
      .attach('clothingImage', pngBuffer, { filename: 'clothing.png', contentType: 'image/png' });

    // Then: HTTP 200, Gemini API called with mimeType: image/png
    expect(response.status).toBe(200);
    expect(response.body.image).toBeTruthy();

    const apiCall = mockGeminiAPI.models.generateContent.mock.calls[0][0];
    expect(apiCall.contents[0].parts[1].inlineData.mimeType).toBe('image/png');
    expect(apiCall.contents[0].parts[2].inlineData.mimeType).toBe('image/png');
  });

  test('TC-TRYON-009 | WebP image format', async () => {
    // Given: API configured
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64-webp-data',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(mockResponse);

    const webpBuffer = Buffer.from('fake-webp-data', 'utf-8');

    // When: Upload WebP images
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', webpBuffer, { filename: 'user.webp', contentType: 'image/webp' })
      .attach('clothingImage', webpBuffer, {
        filename: 'clothing.webp',
        contentType: 'image/webp',
      });

    // Then: HTTP 200, Gemini API accepts WebP
    expect(response.status).toBe(200);
    expect(response.body.image).toBeTruthy();
  });

  test('TC-TRYON-010 | Mixed formats (JPEG user + PNG garment)', async () => {
    // Given: API configured
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64-mixed-data',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(mockResponse);

    const jpegBuffer = Buffer.from('fake-jpeg', 'utf-8');
    const pngBuffer = Buffer.from('fake-png', 'utf-8');

    // When: Upload JPEG userImage and PNG clothingImage
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', jpegBuffer, { filename: 'user.jpg', contentType: 'image/jpeg' })
      .attach('clothingImage', pngBuffer, { filename: 'clothing.png', contentType: 'image/png' });

    // Then: HTTP 200, both images converted to base64, correct mimeTypes
    expect(response.status).toBe(200);

    const apiCall = mockGeminiAPI.models.generateContent.mock.calls[0][0];
    expect(apiCall.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg');
    expect(apiCall.contents[0].parts[2].inlineData.mimeType).toBe('image/png');
  });

  // ==================== ERROR HANDLING TESTS ====================

  test('TC-TRYON-011 | Gemini API key not configured', async () => {
    // Given: GEMINI_API_KEY is empty
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    // Reload module to pick up env change
    jest.resetModules();
    const { default: tryonRoutesNoKey } = await import('../../src/routes/tryonRoutes.js');
    const appNoKey = express.default();
    appNoKey.use('/api/tryon', tryonRoutesNoKey);

    const buffer = Buffer.from('test', 'utf-8');

    // When: Send request
    const response = await request
      .default(appNoKey)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: HTTP 500, error: "AI generation failed"
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('AI generation failed');

    // Restore
    process.env.GEMINI_API_KEY = originalKey;
  });

  test('TC-TRYON-012 | Gemini API returns error (rate limit)', async () => {
    // Given: Gemini API mock throws rate limit error
    mockGeminiAPI.models.generateContent.mockRejectedValue(new Error('429 Too Many Requests'));

    const buffer = Buffer.from('test', 'utf-8');

    // When: Send valid request
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: HTTP 500, error: "AI generation failed"
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('AI generation failed');
  });

  test('TC-TRYON-013 | Gemini API timeout', async () => {
    // Given: Gemini API mock delays >30s
    mockGeminiAPI.models.generateContent.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 35000))
    );

    const buffer = Buffer.from('test', 'utf-8');

    // When: Send valid request (with shorter timeout for test)
    const response = await request
      .default(app)
      .post('/api/tryon')
      .timeout(1000) // Short timeout for test
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg')
      .catch(err => err);

    // Then: Timeout error or 500
    expect(response.timeout || response.status === 500).toBeTruthy();
  });

  test('TC-TRYON-014 | Gemini API returns blocked content', async () => {
    // Given: Gemini API mock returns safety block
    const blockedResponse = {
      promptFeedback: {
        blockReason: 'SAFETY',
      },
      candidates: [],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(blockedResponse);

    const buffer = Buffer.from('test', 'utf-8');

    // When: Send valid request
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: HTTP 500, error: "Empty AI response (SAFETY)"
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Empty AI response (SAFETY)');
  });

  test('TC-TRYON-015 | Gemini API returns empty response', async () => {
    // Given: Gemini API mock returns no candidates
    const emptyResponse = {
      candidates: [],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(emptyResponse);

    const buffer = Buffer.from('test', 'utf-8');

    // When: Send valid request
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: HTTP 500, error: "Empty AI response (unknown)"
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Empty AI response (unknown)');
  });

  test('TC-TRYON-016 | Gemini API returns no image data', async () => {
    // Given: Gemini API mock returns text only (no inlineData)
    const textOnlyResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'This is just text, no image',
              },
            ],
          },
        },
      ],
    };
    mockGeminiAPI.models.generateContent.mockResolvedValue(textOnlyResponse);

    const buffer = Buffer.from('test', 'utf-8');

    // When: Send valid request
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: HTTP 200, image: null, description present
    expect(response.status).toBe(200);
    expect(response.body.image).toBeNull();
    expect(response.body.description).toBe('This is just text, no image');
  });

  // ==================== DATA PROCESSING TESTS ====================

  test('TC-TRYON-017 | Base64 encoding of user image', async () => {
    // Given: Valid JPEG buffer
    const jpegBuffer = Buffer.from('JPEG-BINARY-DATA', 'utf-8');
    const expectedBase64 = jpegBuffer.toString('base64');

    mockGeminiAPI.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: 'result', mimeType: 'image/png' } }],
          },
        },
      ],
    });

    // When: Provide JPEG buffer and convert to base64
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', jpegBuffer, 'user.jpg')
      .attach('clothingImage', jpegBuffer, 'clothing.jpg');

    // Then: Base64 string is valid and can be decoded back
    expect(response.status).toBe(200);

    const apiCall = mockGeminiAPI.models.generateContent.mock.calls[0][0];
    const sentBase64 = apiCall.contents[0].parts[1].inlineData.data;

    expect(sentBase64).toBe(expectedBase64);
    expect(Buffer.from(sentBase64, 'base64').toString('utf-8')).toBe('JPEG-BINARY-DATA');
  });

  test('TC-TRYON-018 | Base64 encoding of clothing image', async () => {
    // Given: Valid PNG buffer
    const pngBuffer = Buffer.from('PNG-BINARY-DATA', 'utf-8');
    const expectedBase64 = pngBuffer.toString('base64');

    mockGeminiAPI.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: 'result', mimeType: 'image/png' } }],
          },
        },
      ],
    });

    // When: Provide PNG buffer and convert to base64
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', pngBuffer, 'user.png')
      .attach('clothingImage', pngBuffer, 'clothing.png');

    // Then: Base64 string decodes correctly
    expect(response.status).toBe(200);

    const apiCall = mockGeminiAPI.models.generateContent.mock.calls[0][0];
    const sentBase64 = apiCall.contents[0].parts[2].inlineData.data;

    expect(sentBase64).toBe(expectedBase64);
    expect(Buffer.from(sentBase64, 'base64').toString('utf-8')).toBe('PNG-BINARY-DATA');
  });

  test('TC-TRYON-019 | Detailed prompt sent to Gemini API', async () => {
    // Given: API configured
    mockGeminiAPI.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: 'result', mimeType: 'image/png' } }],
          },
        },
      ],
    });

    const buffer = Buffer.from('test', 'utf-8');

    // When: Send valid request and capture Gemini API call
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Prompt includes required keywords and is >500 characters
    expect(response.status).toBe(200);

    const apiCall = mockGeminiAPI.models.generateContent.mock.calls[0][0];
    const prompt = apiCall.contents[0].parts[0].text;

    expect(prompt).toContain('PIXEL-PERFECT IDENTITY LOCK');
    expect(prompt).toContain('PIXEL-PERFECT GARMENT FIDELITY');
    expect(prompt).toContain('QUALITY CONTROL CHECKLIST');
    expect(prompt.length).toBeGreaterThan(500);
  });

  // ==================== RESPONSE FORMAT TESTS ====================

  test('TC-TRYON-021 | Response contains image as data URL', async () => {
    // Given: Gemini returns valid image
    const mockImageData =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    mockGeminiAPI.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: mockImageData,
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    });

    const buffer = Buffer.from('test', 'utf-8');

    // When: Mock Gemini success response
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Response.image starts with "data:image/png;base64," and is valid
    expect(response.status).toBe(200);
    expect(response.body.image).toMatch(/^data:image\/png;base64,/);
    expect(response.body.image).toContain(mockImageData);
  });

  test('TC-TRYON-022 | Response includes description text', async () => {
    // Given: Gemini returns text part
    const mockDescription = 'Generated try-on image with photorealistic background';
    mockGeminiAPI.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64data',
                  mimeType: 'image/png',
                },
              },
              {
                text: mockDescription,
              },
            ],
          },
        },
      ],
    });

    const buffer = Buffer.from('test', 'utf-8');

    // When: Mock Gemini success with text
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Response.description is non-empty string
    expect(response.status).toBe(200);
    expect(response.body.description).toBe(mockDescription);
  });

  test('TC-TRYON-022b | Response description fallback when missing', async () => {
    // Given: Gemini returns no text part
    mockGeminiAPI.models.generateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'base64data',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    });

    const buffer = Buffer.from('test', 'utf-8');

    // When: No description in response
    const response = await request
      .default(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Falls back to "AI description not available."
    expect(response.status).toBe(200);
    expect(response.body.description).toBe('AI description not available.');
  });
});
