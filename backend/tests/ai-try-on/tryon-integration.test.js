/**
 * @fileoverview AI Try-on Integration Tests
 * @module tests/ai-try-on/tryon-integration.test.js
 * @description Integration tests for Try-on API endpoint
 *
 * NOTE: Giống như Categories test, đây là INTEGRATION test
 * vì Try-on không có Service layer - logic nằm trực tiếp trong Routes
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock @google/genai BEFORE any imports
const mockGenerateContent = jest.fn();
const MockGoogleGenAI = jest.fn().mockImplementation(() => ({
  models: {
    generateContent: mockGenerateContent,
  },
}));

// Mock the module
jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: MockGoogleGenAI,
}));

// Import after mocking
const { default: tryonRoutes } = await import('../../src/routes/tryonRoutes.js');

describe('AI & Try-on — Integration Tests', () => {
  let app;

  beforeAll(() => {
    // Setup Express app (giống Categories test)
    app = express();
    app.use(express.json());
    app.use('/api/tryon', tryonRoutes);

    // Set test environment
    process.env.GEMINI_API_KEY = 'test-api-key-123';
    process.env.GEMINI_MODEL_ID = 'gemini-2.0-flash-exp-image-generation';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // TC-TRYON-002: Validation - Missing userImage
  // ============================================================================
  test('TC-TRYON-002 | Should return 400 when userImage is missing', async () => {
    // Given: Only clothingImage is provided
    const testImagePath = path.join(__dirname, '_fixtures', 'test-image.jpg');
    const imageBuffer = Buffer.from('fake-clothing-image-data');

    // When: POST request with only clothingImage
    const response = await request(app)
      .post('/api/tryon')
      .attach('clothingImage', imageBuffer, 'clothing.jpg');

    // Then: Should return 400 error
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Both userImage and clothingImage files are required');
  });

  // ============================================================================
  // TC-TRYON-003: Validation - Missing clothingImage
  // ============================================================================
  test('TC-TRYON-003 | Should return 400 when clothingImage is missing', async () => {
    // Given: Only userImage is provided
    const imageBuffer = Buffer.from('fake-user-image-data');

    // When: POST request with only userImage
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', imageBuffer, 'user.jpg');

    // Then: Should return 400 error
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Both userImage and clothingImage files are required');
  });

  // ============================================================================
  // TC-TRYON-004: Validation - Both files missing
  // ============================================================================
  test('TC-TRYON-004 | Should return 400 when both files are missing', async () => {
    // Given: No files provided

    // When: POST request without any files
    const response = await request(app).post('/api/tryon').send({});

    // Then: Should return 400 error
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Both userImage and clothingImage files are required');
  });

  // ============================================================================
  // TC-TRYON-001: Happy Path - Successful generation
  // ============================================================================
  test('TC-TRYON-001 | Should successfully generate try-on image with valid inputs', async () => {
    // Given: Mock Gemini API returns success response
    const mockGeminiResponse = {
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
    mockGenerateContent.mockResolvedValue(mockGeminiResponse);

    const userImageBuffer = Buffer.from('fake-user-jpeg-data');
    const clothingImageBuffer = Buffer.from('fake-clothing-png-data');

    // When: POST with both valid images
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', userImageBuffer, 'user.jpg')
      .attach('clothingImage', clothingImageBuffer, 'clothing.png');

    // Then: Should return 200 with image data URL
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('image');
    expect(response.body).toHaveProperty('description');
    expect(response.body.image).toMatch(/^data:image\/png;base64,/);
    expect(response.body.description).toBe('Successfully generated virtual try-on image.');
  });

  // ============================================================================
  // TC-TRYON-014: Error Handling - Blocked content
  // ============================================================================
  test('TC-TRYON-014 | Should return 500 when Gemini API blocks content', async () => {
    // Given: Gemini API returns safety block
    const blockedResponse = {
      promptFeedback: {
        blockReason: 'SAFETY',
      },
      candidates: [],
    };
    mockGenerateContent.mockResolvedValue(blockedResponse);

    const buffer = Buffer.from('test-data');

    // When: Request try-on with blocked content
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Should return 500 with blocked error
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Empty AI response (SAFETY)');
  });

  // ============================================================================
  // TC-TRYON-015: Error Handling - Empty response
  // ============================================================================
  test('TC-TRYON-015 | Should return 500 when Gemini API returns empty response', async () => {
    // Given: Gemini API returns no candidates
    mockGenerateContent.mockResolvedValue({ candidates: [] });

    const buffer = Buffer.from('test-data');

    // When: Request try-on
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Should return 500 with empty response error
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Empty AI response (unknown)');
  });

  // ============================================================================
  // TC-TRYON-012: Error Handling - API error
  // ============================================================================
  test('TC-TRYON-012 | Should return 500 when Gemini API throws error', async () => {
    // Given: Gemini API throws rate limit error
    mockGenerateContent.mockRejectedValue(new Error('429 Rate Limit Exceeded'));

    const buffer = Buffer.from('test-data');

    // When: Request try-on
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Should return 500 with AI generation failed error
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('AI generation failed');
  });

  // ============================================================================
  // TC-TRYON-016: Edge Case - Text only response (no image)
  // ============================================================================
  test('TC-TRYON-016 | Should handle response with text only (no image data)', async () => {
    // Given: Gemini API returns only text (no image)
    const textOnlyResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Unable to generate image, only description available.',
              },
            ],
          },
        },
      ],
    };
    mockGenerateContent.mockResolvedValue(textOnlyResponse);

    const buffer = Buffer.from('test-data');

    // When: Request try-on
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Should return 200 with null image and description
    expect(response.status).toBe(200);
    expect(response.body.image).toBeNull();
    expect(response.body.description).toBe('Unable to generate image, only description available.');
  });

  // ============================================================================
  // TC-TRYON-017: Data Processing - Base64 encoding
  // ============================================================================
  test('TC-TRYON-017 | Should correctly encode images to base64', async () => {
    // Given: Mock Gemini API and test data
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'result-image-data',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    });

    const testData = 'JPEG-TEST-DATA';
    const buffer = Buffer.from(testData, 'utf-8');
    const expectedBase64 = buffer.toString('base64');

    // When: Send request
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Gemini should receive base64 encoded data
    expect(mockGenerateContent).toHaveBeenCalled();
    const callArgs = mockGenerateContent.mock.calls[0][0];
    const userImageData = callArgs.contents[0].parts[1].inlineData.data;

    // Verify base64 encoding
    expect(userImageData).toBe(expectedBase64);
    expect(Buffer.from(userImageData, 'base64').toString('utf-8')).toBe(testData);
  });

  // ============================================================================
  // TC-TRYON-019: Prompt Engineering - Verify prompt content
  // ============================================================================
  test('TC-TRYON-019 | Should send detailed prompt to Gemini API', async () => {
    // Given: Mock Gemini API
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: { data: 'test', mimeType: 'image/png' },
              },
            ],
          },
        },
      ],
    });

    const buffer = Buffer.from('test');

    // When: Send request
    await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Prompt should include required keywords
    expect(mockGenerateContent).toHaveBeenCalled();
    const callArgs = mockGenerateContent.mock.calls[0][0];
    const prompt = callArgs.contents[0].parts[0].text;

    expect(prompt).toContain('PIXEL-PERFECT IDENTITY LOCK');
    expect(prompt).toContain('PIXEL-PERFECT GARMENT FIDELITY');
    expect(prompt).toContain('QUALITY CONTROL CHECKLIST');
    expect(prompt.length).toBeGreaterThan(500);
  });

  // ============================================================================
  // TC-TRYON-021: Response Format - Image as data URL
  // ============================================================================
  test('TC-TRYON-021 | Should return image as valid data URL', async () => {
    // Given: Mock Gemini with base64 image
    const mockImageData =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    mockGenerateContent.mockResolvedValue({
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

    const buffer = Buffer.from('test');

    // When: Request try-on
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Should return valid data URL
    expect(response.status).toBe(200);
    expect(response.body.image).toMatch(/^data:image\/png;base64,/);
    expect(response.body.image).toContain(mockImageData);
  });

  // ============================================================================
  // TC-TRYON-022: Response Format - Description fallback
  // ============================================================================
  test('TC-TRYON-022 | Should provide fallback description when missing', async () => {
    // Given: Mock Gemini with image only (no text)
    mockGenerateContent.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  data: 'image-data',
                  mimeType: 'image/png',
                },
              },
            ],
          },
        },
      ],
    });

    const buffer = Buffer.from('test');

    // When: Request try-on
    const response = await request(app)
      .post('/api/tryon')
      .attach('userImage', buffer, 'user.jpg')
      .attach('clothingImage', buffer, 'clothing.jpg');

    // Then: Should use fallback description
    expect(response.status).toBe(200);
    expect(response.body.description).toBe('AI description not available.');
  });
});
