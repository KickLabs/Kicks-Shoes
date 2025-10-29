# AI & Try-on Tests

## Overview

This directory contains comprehensive tests for the **AI & Try-on** feature, which enables users to virtually try on shoes and clothing products using Google's Gemini AI.

## Test Structure

```
backend/tests/ai-try-on/
├── backend-api-tests.test.js     # Backend API unit tests (TC-TRYON-001 to TC-TRYON-022)
├── mocks/
│   └── gemini.mock.js            # Mock for Google Gemini API
├── _helpers/
│   └── testUtils.js              # Test utilities and helpers
├── output_prompt/
│   ├── output_phase1_try_on.md   # Technical analysis document
│   └── output_phase2_try_on.md   # Test cases matrix
└── README.md                     # This file
```

## Test Suites

### 1. Backend API Tests (`backend-api-tests.test.js`)

- **Test Count**: 22 test cases
- **Coverage Areas**:
  - File upload validation (TC-TRYON-002 to TC-TRYON-004)
  - Image format support: JPEG, PNG, WebP (TC-TRYON-007 to TC-TRYON-010)
  - Gemini API integration (TC-TRYON-011 to TC-TRYON-016)
  - Base64 encoding (TC-TRYON-017 to TC-TRYON-018)
  - Prompt engineering (TC-TRYON-019)
  - Response formatting (TC-TRYON-021 to TC-TRYON-022)

## Running Tests

### Run all AI Try-on tests

```bash
npm test -- ai-try-on
```

### Run specific test file

```bash
npm test -- backend-api-tests.test.js
```

### Run with coverage

```bash
npm test -- --coverage ai-try-on
```

### Run in watch mode

```bash
npm test -- --watch ai-try-on
```

### Run specific test by ID

```bash
npm test -- -t "TC-TRYON-001"
```

## Test Prerequisites

### Environment Variables

Ensure these are set in your `.env` file or test environment:

```env
GEMINI_API_KEY=your-test-api-key
GEMINI_MODEL_ID=gemini-2.0-flash-exp-image-generation
NODE_ENV=test
```

### Dependencies

- `@google/genai` - Google Gemini AI client (mocked in tests)
- `multer` - File upload handling
- `express` - Web framework
- `supertest` - HTTP testing
- `jest` - Test runner

## Mock Data

### Gemini API Mock

Located in `mocks/gemini.mock.js`, provides:

- `mockResponses.success` - Successful generation
- `mockResponses.blocked` - Content blocked by safety filters
- `mockResponses.empty` - Empty response
- `mockResponses.textOnly` - Text without image
- `mockErrors` - Various error scenarios

### Test Utilities

Located in `_helpers/testUtils.js`, provides:

- `createMockRequest()` - Mock Express request with file uploads
- `createMockResponse()` - Mock Express response
- `createMockFile()` - Mock multer file object
- `createMockImageBuffer()` - Mock image buffers (JPEG, PNG, WebP)
- `createMockUser()` - Mock user object
- `createMockProduct()` - Mock product object
- `createMockGeminiResponse()` - Mock Gemini API responses
- `isValidImageDataUrl()` - Validate data URL format
- `measurePerformance()` - Performance measurement wrapper

## Test Coverage Goals

- **Statement Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: ≥ 85%
- **Line Coverage**: ≥ 80%

## Key Test Scenarios

### Happy Path

- ✅ Valid file uploads generate try-on image successfully
- ✅ Multiple image formats (JPEG, PNG, WebP) are supported
- ✅ Mixed formats work correctly
- ✅ Response includes valid base64 image and description

### Validation

- ✅ Missing userImage returns 400 error
- ✅ Missing clothingImage returns 400 error
- ✅ Both files missing returns 400 error

### Error Handling

- ✅ Missing API key logs error and returns 500
- ✅ Gemini API rate limit handled gracefully
- ✅ API timeout handled properly
- ✅ Blocked content (safety filters) returns appropriate error
- ✅ Empty responses handled
- ✅ Text-only responses (no image) handled

### Data Processing

- ✅ Images correctly converted to base64
- ✅ Base64 can be decoded back to original
- ✅ Detailed prompt sent to Gemini API includes required keywords

### Response Format

- ✅ Image returned as data URL (`data:image/png;base64,...`)
- ✅ Description text included or defaults to fallback message

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:

- **Pre-commit**: Unit tests
- **Pull Request**: All tests with coverage report
- **Nightly**: Full test suite including E2E

### GitHub Actions Example

```yaml
- name: Run AI Try-on Tests
  run: npm test -- ai-try-on --coverage
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_TEST_KEY }}
    NODE_ENV: test
```

## Troubleshooting

### Tests failing due to missing environment variables

```bash
# Set test environment variables
export GEMINI_API_KEY=test-key-123
export NODE_ENV=test
```

### Module import errors

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
npm ci
```

### Timeout errors

Increase Jest timeout in `jest.config.js`:

```javascript
testTimeout: 30000; // 30 seconds
```

## Contributing

When adding new tests:

1. Follow the naming convention: `TC-TRYON-XXX | Description`
2. Use Given-When-Then comments
3. Add test to appropriate suite
4. Update test count in this README
5. Ensure coverage doesn't decrease

## Related Documentation

- [Technical Analysis](./output_prompt/output_phase1_try_on.md)
- [Test Cases Matrix](./output_prompt/output_phase2_try_on.md)
- [Main Test README](../README.md)

## Contact

For questions or issues with these tests, please contact the development team or create an issue in the repository.
