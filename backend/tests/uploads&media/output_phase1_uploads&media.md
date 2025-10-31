# Uploads & Media - Feature Analysis & Test Planning

## 1. Feature Overview

### Business Purpose

The Uploads & Media module provides the ability to upload and manage image files in the Kicks Shoes system, including:

- User avatars
- Product images (main image and additional images)
- Feedback/review images
- Visual search images
- Try-on feature images
- Blog post images

### Key UI Flows Involved

1. **Product Management**: Upload product images when creating/editing products
2. **User Profile**: Upload/update avatar
3. **Feedback/Review**: Attach images to reviews
4. **Visual Search**: Upload images to search for similar products
5. **Virtual Try-On**: Upload user photos and clothing images
6. **Store Management**: Upload store product images

### Main Business Rules & Success Criteria

- **File Type**: Only allow JPG, JPEG, PNG, GIF, WebP
- **File Size**: Maximum 10MB (backend) / 5MB (frontend validation)
- **Image Processing**: Auto-resize to max 500x500px, convert to JPG
- **Storage**: Upload to Cloudinary, return HTTPS URL
- **Security**: Force HTTPS URLs, validate file types
- **Multiple Uploads**: Support single/multiple/fields upload modes

### Why This Feature is Important for Testing

- **Critical User Experience**: Upload failures directly affect the ability to create products and profiles
- **Security Risk**: Potential XSS/malicious file upload attacks
- **Third-party Dependency**: Rely on Cloudinary service (network failures)
- **Performance Impact**: Large file uploads can slow down the system
- **Data Integrity**: Ensure URLs are saved in correct format and are accessible

---

## 2. UI/UX Flow Mapping

### Flow 1: Product Image Upload (Add/Edit Product)

| Step | UI Screen/Component | User Action                        | System Behavior                                     |
| ---- | ------------------- | ---------------------------------- | --------------------------------------------------- |
| 1    | ProductDetails.jsx  | Click "Upload" area or drag & drop | Show upload dragger interface                       |
| 2    | Upload.Dragger      | Select image file(s)               | Validate file type & size on client-side            |
| 3    | ProductDetails.jsx  | File passes validation             | Call `uploadToCloud()` with FormData                |
| 4    | Backend /upload     | POST multipart/form-data           | Multer intercepts, validates, uploads to Cloudinary |
| 5    | Cloudinary          | Process image                      | Resize to 500x500, convert to JPG, return URL       |
| 6    | Backend             | Return response                    | Send `{ url: "https://..." }`                       |
| 7    | Frontend            | Receive URL                        | Update fileList, product.images, product.mainImage  |
| 8    | ProductDetails.jsx  | Display uploaded image             | Show thumbnail with remove option                   |

### Flow 2: Avatar Upload (User Profile)

| Step | UI Screen/Component | User Action         | System Behavior                                 |
| ---- | ------------------- | ------------------- | ----------------------------------------------- |
| 1    | ProfileTab.jsx      | Click avatar upload | Open file picker                                |
| 2    | Input type="file"   | Select image        | Validate file type/size                         |
| 3    | ProfileTab.jsx      | File accepted       | Upload to `/upload` endpoint                    |
| 4    | Backend             | Process upload      | Save to Cloudinary folder "kicks-shoes/avatars" |
| 5    | UserController      | Update profile      | Save avatar URL to user.avatar field            |
| 6    | Frontend            | Success response    | Display new avatar, update UI                   |

### Flow 3: Feedback Image Upload

| Step | UI Screen/Component      | User Action         | System Behavior                                 |
| ---- | ------------------------ | ------------------- | ----------------------------------------------- |
| 1    | Feedback.jsx             | Add image to review | Click upload in feedback form                   |
| 2    | Upload component         | Select image        | Validate and upload via customRequest           |
| 3    | Backend /feedback/upload | Receive file        | Process and return Cloudinary URL               |
| 4    | Frontend                 | Store URL           | Add to fileList, include in feedback submission |

### Flow 4: Visual Search Upload

| Step | UI Screen/Component             | User Action             | System Behavior                               |
| ---- | ------------------------------- | ----------------------- | --------------------------------------------- |
| 1    | VisualSearch.jsx                | Upload image for search | Select/drag image file                        |
| 2    | Frontend                        | Validate image          | Check type (jpg, png, webp)                   |
| 3    | Backend /products/visual-search | POST with image         | Upload via multer, process with AI/ML service |
| 4    | ProductController               | Analyze image           | Return matching products                      |
| 5    | Frontend                        | Display results         | Show similar products                         |

---

## 3. Related Files, Components & Modules

### Backend Files

| File/Path                              | Layer      | Responsibility                           | Key Methods/Props/States                                               |
| -------------------------------------- | ---------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `src/middlewares/upload.middleware.js` | Middleware | Configure multer upload, file validation | `fileFilter()`, `upload.single()`, `upload.array()`, `upload.fields()` |
| `src/config/cloudinary.js`             | Config     | Cloudinary setup, storage config         | `cloudinary.config()`, `CloudinaryStorage()`, `handleUpload()`         |
| `src/routes/uploadRoutes.js`           | Route      | Upload endpoint                          | `POST /upload`                                                         |
| `src/routes/productRoutes.js`          | Route      | Visual search upload                     | `POST /products/visual-search` with `upload.single('image')`           |
| `src/routes/userRoutes.js`             | Route      | Avatar upload                            | `PUT /profile` with `upload.single('avatar')`                          |
| `src/routes/authRoutes.js`             | Route      | Register with avatar                     | `POST /register` with `upload.fields()`                                |
| `src/routes/storeRoutes.js`            | Route      | Store product images                     | `POST /store/products` with `upload.array('images', 5)`                |
| `src/routes/feedbackRoutes.js`         | Route      | Feedback image upload                    | `POST /feedback/upload` with `upload.single('image')`                  |
| `src/routes/tryonRoutes.js`            | Route      | Try-on images                            | `POST /tryon` with `upload.fields()`                                   |
| `src/utils/setupUploads.js`            | Utility    | Create upload directories                | `setupUploadDirectories()`                                             |
| `src/utils/errorResponse.js`           | Utility    | Custom error handling                    | `ErrorResponse(message, statusCode)`                                   |

### Frontend Files

| File/Path                                                         | Layer        | Responsibility          | Key Methods/Props/States                                                                          |
| ----------------------------------------------------------------- | ------------ | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `frontend/src/components/common/components/ProductDetails.jsx`    | UI Component | Product image upload UI | `uploadToCloud()`, `handleUploadChange()`, `validateFile()`, `fileList` state, `VALIDATION_RULES` |
| `frontend/src/components/common/components/Feedback.jsx`          | UI Component | Feedback image upload   | `customRequest()`, `handleRemove()`, `fileList` state                                             |
| `frontend/src/components/pages/account/components/ProfileTab.jsx` | UI Component | Avatar upload           | Upload input, image preview                                                                       |
| `frontend/src/components/pages/shop/VisualSearch.jsx`             | UI Component | Visual search upload    | Image file input, search trigger                                                                  |
| `frontend/src/components/layout/HeaderVisualSearch.jsx`           | UI Component | Header visual search    | Quick upload interface                                                                            |
| `frontend/src/components/pages/blog/BlogComposerPage.jsx`         | UI Component | Blog image upload       | Blog post image handling                                                                          |

### Key Dependencies

| Dependency                         | Type            | Purpose                              |
| ---------------------------------- | --------------- | ------------------------------------ |
| `multer@^1.4.5-lts.1`              | NPM Package     | Handle multipart/form-data uploads   |
| `multer-storage-cloudinary@^4.0.0` | NPM Package     | Cloudinary storage engine for multer |
| `cloudinary@^1.41.3`               | NPM Package     | Cloudinary SDK                       |
| Ant Design `Upload`                | React Component | Frontend upload UI                   |
| `FormData` API                     | Browser API     | Create multipart form data           |

---

## 4. Core Functions / Methods to Test

### 4.1 Backend: `fileFilter()` - upload.middleware.js

**Purpose:** Validate uploaded file type to prevent non-image uploads

**Inputs:**

- `req`: Express request object
- `file`: Multer file object with `originalname`, `mimetype`
- `cb`: Callback function `(error, acceptFile)`

**Outputs:**

- Calls `cb(null, true)` if valid
- Calls `cb(ErrorResponse, false)` if invalid

**State Change / Side Effects:** None (pure validation)

**Edge Cases:**

- File without extension
- File with double extension (`.jpg.exe`)
- File with uppercase extension (`.JPG`)
- File with incorrect MIME type
- Null/undefined file
- File with spaces or special chars in name

**Dependencies:**

- `ErrorResponse` utility (should mock)

---

### 4.2 Backend: `upload` multer instance - upload.middleware.js

**Purpose:** Configure multer middleware with storage, limits, filter

**Inputs:**

- Configuration object with `storage`, `fileFilter`, `limits`

**Outputs:**

- Multer middleware instance with methods: `.single()`, `.array()`, `.fields()`

**State Change / Side Effects:**

- When used, processes file upload and adds `req.file` or `req.files`

**Edge Cases:**

- File exceeds 10MB limit
- Multiple files when expecting single
- Field name mismatch
- No file uploaded
- Corrupted/truncated upload

**Dependencies:**

- `multer` package
- `storage` from cloudinary.js

---

### 4.3 Backend: `CloudinaryStorage` config - cloudinary.js

**Purpose:** Configure Cloudinary storage engine for multer

**Inputs:**

- `cloudinary`: Cloudinary instance
- `params`: Upload parameters (folder, formats, transformations)

**Outputs:**

- Storage engine object for multer

**State Change / Side Effects:**

- Uploads file to Cloudinary
- Generates unique filename with timestamp
- Applies image transformations (500x500 resize, JPG conversion)

**Edge Cases:**

- Missing Cloudinary credentials
- Network failure to Cloudinary
- Invalid folder path
- Cloudinary quota exceeded
- Image transformation failures

**Dependencies:**

- `cloudinary` package
- Environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

---

### 4.4 Backend: `handleUpload()` middleware - cloudinary.js

**Purpose:** Post-process upload, ensure HTTPS URLs, logging

**Inputs:**

- `req`: Express request with `req.file`
- `res`: Response object
- `next`: Next middleware

**Outputs:**

- Calls `next()` to continue
- Logs upload info

**State Change / Side Effects:**

- Modifies `req.file.path` to force HTTPS
- Logs to winston logger

**Edge Cases:**

- No file uploaded (req.file is undefined)
- URL already HTTPS
- URL is HTTP
- Missing path property

**Dependencies:**

- `logger` utility (should mock)

---

### 4.5 Backend: `/upload` endpoint - uploadRoutes.js

**Purpose:** Generic file upload endpoint

**Inputs:**

- `POST /upload`
- Field name: `image`
- Content-Type: `multipart/form-data`

**Outputs:**

- Success: `{ url: "https://..." }` (200)
- Error: `{ error: "No file uploaded" }` (400)

**State Change / Side Effects:**

- File uploaded to Cloudinary
- URL stored in response

**Edge Cases:**

- Missing file
- Wrong field name
- Invalid content type
- Upload middleware error

**Dependencies:**

- `upload.single('image')` middleware

---

### 4.6 Frontend: `uploadToCloud()` - ProductDetails.jsx

**Purpose:** Handle file upload to backend with progress tracking

**Inputs:**

- `{ file, onSuccess, onError, onProgress }` - Upload options object

**Outputs:**

- Returns Promise<string> (URL) on success
- Calls `onError()` on failure

**State Change / Side Effects:**

- Creates FormData with image
- POSTs to `/upload` endpoint
- Updates upload progress
- Shows success/error messages

**Edge Cases:**

- File validation fails
- Network error during upload
- Server returns error
- Progress calculation edge cases
- Upload timeout

**Dependencies:**

- `axiosInstance`
- `validateFile()` function
- Ant Design `message` API

---

### 4.7 Frontend: `validateFile()` - ProductDetails.jsx

**Purpose:** Client-side file validation before upload

**Inputs:**

- `file`: File object with `size`, `type` properties

**Outputs:**

- Returns array of error strings (empty if valid)

**State Change / Side Effects:** None (pure function)

**Edge Cases:**

- File exactly at size limit (5MB)
- File type case sensitivity
- File type with charset (e.g., `image/jpeg; charset=utf-8`)
- Missing type or size
- Very large files (>100MB)

**Dependencies:**

- `VALIDATION_RULES.images` constant

---

### 4.8 Frontend: `handleUploadChange()` - ProductDetails.jsx

**Purpose:** Handle file list changes, update product state

**Inputs:**

- `{ fileList }`: Object with array of uploaded files

**Outputs:**

- Updates component state

**State Change / Side Effects:**

- Updates `fileList` state
- Updates `product.images` array
- Sets `product.mainImage` (first image)
- Clears validation errors if applicable
- Creates object URLs for preview

**Edge Cases:**

- Exceed max image count (VALIDATION_RULES.images.maxCount)
- Empty fileList
- Files without URLs or thumbUrls
- Remove last image (mainImage reset)
- Edit mode vs create mode behavior

**Dependencies:**

- `setFileList` state setter
- `setProduct` state setter
- `VALIDATION_RULES`

---

### 4.9 Backend: `setupUploadDirectories()` - setupUploads.js

**Purpose:** Ensure upload directories exist on server startup

**Inputs:** None

**Outputs:** None (side effects only)

**State Change / Side Effects:**

- Creates `uploads/` directory if not exists
- Creates `uploads/avatars/` subdirectory if not exists

**Edge Cases:**

- Directories already exist
- No write permissions
- Disk full
- Invalid path characters

**Dependencies:**

- `fs` module
- `path` module

---

## 5. Test Case Matrix

### Category A: File Validation (Backend)

| Category | Scenario               | Pre-condition  | Input                      | Expected Output/Behavior                     |
| -------- | ---------------------- | -------------- | -------------------------- | -------------------------------------------- |
| Happy    | Valid JPG file         | Server running | `.jpg` file, 2MB           | File accepted, upload proceeds               |
| Happy    | Valid PNG file         | Server running | `.png` file, 1MB           | File accepted, upload proceeds               |
| Happy    | Valid GIF file         | Server running | `.gif` file, 500KB         | File accepted, upload proceeds               |
| Edge     | File at size limit     | Server running | `.jpg` file, exactly 10MB  | File accepted                                |
| Edge     | File 1 byte over limit | Server running | `.jpg` file, 10MB + 1 byte | Error: "File too large" (413/400)            |
| Edge     | Uppercase extension    | Server running | `.JPG` file                | File accepted (case-insensitive)             |
| Error    | Invalid file type      | Server running | `.exe` file                | Error: "Only image files are allowed!" (400) |
| Error    | No extension           | Server running | File named "test"          | Error: File rejected                         |
| Error    | Double extension       | Server running | `image.jpg.exe`            | Error: File rejected                         |
| Error    | PDF file               | Server running | `.pdf` file                | Error: "Only image files are allowed!"       |
| Error    | No file uploaded       | Server running | Empty request              | Error: "No file uploaded" (400)              |

### Category B: File Validation (Frontend)

| Category | Scenario               | Pre-condition     | Input             | Expected Output/Behavior                           |
| -------- | ---------------------- | ----------------- | ----------------- | -------------------------------------------------- |
| Happy    | Valid JPG, under limit | Component mounted | 2MB `.jpg`        | No error, upload proceeds                          |
| Happy    | Valid WebP             | Component mounted | 1MB `.webp`       | No error, upload proceeds                          |
| Edge     | File at 5MB limit      | Component mounted | Exactly 5MB image | No error                                           |
| Edge     | File 1KB over limit    | Component mounted | 5MB + 1KB image   | Error: "File size must be less than 5MB"           |
| Error    | Invalid type           | Component mounted | `.pdf` file       | Error: "Only JPG, PNG, and WebP files are allowed" |
| Error    | SVG file               | Component mounted | `.svg` file       | Error: Invalid type                                |
| Error    | Empty file             | Component mounted | 0 byte file       | Depends on implementation                          |

### Category C: Cloudinary Integration

| Category | Scenario                  | Pre-condition               | Input                         | Expected Output/Behavior                 |
| -------- | ------------------------- | --------------------------- | ----------------------------- | ---------------------------------------- |
| Happy    | Upload to Cloudinary      | Valid credentials           | Valid image                   | Returns HTTPS URL                        |
| Happy    | Image transformation      | Valid credentials           | 2000x2000 image               | Resized to 500x500, converted to JPG     |
| Happy    | Unique filename           | Valid credentials           | Multiple uploads of same file | Each gets unique filename with timestamp |
| Edge     | Missing API key           | Invalid/missing env vars    | Valid image                   | Error: Cloudinary auth failed            |
| Edge     | Network timeout           | Cloudinary unreachable      | Valid image                   | Error: Upload timeout/network error      |
| Edge     | Cloudinary quota exceeded | Account over quota          | Valid image                   | Error: Cloudinary error response         |
| Error    | Invalid cloud name        | Wrong CLOUDINARY_CLOUD_NAME | Valid image                   | Error: Invalid credentials               |
| Error    | Invalid folder path       | Malformed folder config     | Valid image                   | Error or default folder used             |

### Category D: Multiple Upload Modes

| Category | Scenario                  | Pre-condition                    | Input                 | Expected Output/Behavior                     |
| -------- | ------------------------- | -------------------------------- | --------------------- | -------------------------------------------- |
| Happy    | Single upload             | Route with `.single('image')`    | 1 image file          | `req.file` populated                         |
| Happy    | Array upload (5 max)      | Route with `.array('images', 5)` | 3 images              | `req.files` array with 3 items               |
| Happy    | Fields upload             | Route with `.fields([...])`      | Multiple named fields | `req.files.avatar`, `req.files.profileImage` |
| Edge     | Array at max limit        | `.array('images', 5)`            | Exactly 5 images      | All accepted                                 |
| Error    | Array over limit          | `.array('images', 5)`            | 6 images              | Error: "Too many files"                      |
| Error    | Wrong field name          | Expects 'image'                  | Field named 'photo'   | No file received, `req.file` undefined       |
| Error    | Multiple files for single | `.single('image')`               | 2 files               | Only first accepted or error                 |

### Category E: HTTP/HTTPS URL Handling

| Category | Scenario                  | Pre-condition            | Input       | Expected Output/Behavior           |
| -------- | ------------------------- | ------------------------ | ----------- | ---------------------------------- |
| Happy    | HTTPS URL from Cloudinary | Normal upload            | Valid image | URL starts with `https://`         |
| Edge     | HTTP URL returned         | Cloudinary returns HTTP  | Valid image | `handleUpload` converts to HTTPS   |
| Edge     | Already HTTPS             | Cloudinary returns HTTPS | Valid image | URL unchanged                      |
| Edge     | No path in file object    | Upload error scenario    | -           | Logs "No file uploaded", continues |

### Category F: Upload Progress & UI Feedback

| Category | Scenario                 | Pre-condition       | Input        | Expected Output/Behavior                                 |
| -------- | ------------------------ | ------------------- | ------------ | -------------------------------------------------------- |
| Happy    | Upload progress tracking | Upload in progress  | Large file   | `onProgress` called with percent (0-100)                 |
| Happy    | Success callback         | Upload completes    | Valid image  | `onSuccess` called with URL                              |
| Happy    | Error callback           | Upload fails        | Invalid file | `onError` called with error                              |
| Happy    | File list update         | Upload succeeds     | Image        | fileList updated with `{uid, name, status: 'done', url}` |
| Edge     | Upload cancellation      | User cancels upload | -            | Upload aborted, cleanup performed                        |

### Category G: Security & Edge Cases

| Category | Scenario           | Pre-condition      | Input                                   | Expected Output/Behavior                                 |
| -------- | ------------------ | ------------------ | --------------------------------------- | -------------------------------------------------------- |
| Security | Fake MIME type     | Attacker uploads   | `.exe` renamed to `.jpg` but wrong MIME | Rejected by fileFilter (checks extension)                |
| Security | XSS in filename    | Malicious filename | `<script>alert('xss')</script>.jpg`     | Filename sanitized by Cloudinary                         |
| Security | Path traversal     | Malicious filename | `../../etc/passwd.jpg`                  | Rejected or sanitized                                    |
| Edge     | Concurrent uploads | Multiple users     | 10 simultaneous uploads                 | All processed independently                              |
| Edge     | Very large image   | 8000x8000px        | 9MB image                               | Processed, resized to 500x500                            |
| Edge     | Corrupted image    | Partial upload     | Truncated file                          | Error: Invalid image format                              |
| Edge     | Slow network       | High latency       | Valid image                             | Upload takes longer, but completes with timeout handling |

### Category H: Directory Setup

| Category | Scenario               | Pre-condition       | Input | Expected Output/Behavior                  |
| -------- | ---------------------- | ------------------- | ----- | ----------------------------------------- |
| Happy    | Directories exist      | Already created     | None  | Function returns, no changes              |
| Happy    | Create new directories | First run           | None  | `uploads/` and `uploads/avatars/` created |
| Edge     | Read-only filesystem   | No write permission | None  | Error thrown, server may fail to start    |
| Edge     | Disk full              | No space            | None  | Error: ENOSPC                             |

### Category I: Integration Tests

| Category    | Scenario                   | Pre-condition       | Input                      | Expected Output/Behavior        |
| ----------- | -------------------------- | ------------------- | -------------------------- | ------------------------------- |
| Integration | Full upload flow           | Server + Cloudinary | POST /upload with image    | 200, returns `{url}`            |
| Integration | Unauthorized access        | No auth token       | Protected route upload     | 401 Unauthorized                |
| Integration | Upload in product creation | User authenticated  | POST /products with images | Product created with image URLs |
| Integration | Avatar update              | User logged in      | PUT /profile with avatar   | User avatar updated in DB       |

---

## 6. Test Priority Recommendation

### High Priority (Business Critical)

| Module/Function              | Priority | Justification                                                                                 |
| ---------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `fileFilter()`               | **HIGH** | **Security:** Prevents malicious file uploads; **Impact:** Affects all upload endpoints       |
| File size validation         | **HIGH** | **Performance:** Prevents DoS via large files; **User Experience:** Immediate feedback        |
| Cloudinary upload            | **HIGH** | **Dependency:** Critical third-party service; **Failure Impact:** Blocks all uploads          |
| `/upload` endpoint           | **HIGH** | **Core Feature:** Used by multiple modules; **Frequency:** Very high usage                    |
| `uploadToCloud()` (frontend) | **HIGH** | **User Experience:** Direct user interaction; **Error Handling:** Must provide clear feedback |

### Medium Priority (Important but Lower Risk)

| Module/Function             | Priority   | Justification                                                             |
| --------------------------- | ---------- | ------------------------------------------------------------------------- |
| `handleUpload()` middleware | **MEDIUM** | **Enhancement:** HTTPS conversion; **Impact:** Important but not blocking |
| `validateFile()` (frontend) | **MEDIUM** | **UX:** Client-side validation; **Fallback:** Backend validates anyway    |
| `handleUploadChange()`      | **MEDIUM** | **Complexity:** Multiple state updates; **Impact:** UI state management   |
| Multiple upload modes       | **MEDIUM** | **Variety:** Different use cases; **Complexity:** Array/fields handling   |
| Progress tracking           | **MEDIUM** | **UX:** User feedback; **Non-blocking:** Upload works without it          |

### Low Priority (Edge Cases, Nice-to-Have)

| Module/Function              | Priority | Justification                                                                         |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `setupUploadDirectories()`   | **LOW**  | **Frequency:** Runs once on startup; **Cloudinary Primary:** Local upload less used   |
| Image transformation details | **LOW**  | **Managed by Cloudinary:** Less control needed; **Reliable:** Cloudinary handles well |
| Filename generation          | **LOW**  | **Automated:** Handled by Cloudinary; **Low Risk:** Unlikely to fail                  |

---

## 7. Mocking & Test Data Preparation

### Backend Testing - Mocks Needed

| Dependency            | What to Mock                        | Mocking Strategy                           | Sample Mock Data                                                                                |
| --------------------- | ----------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Cloudinary SDK        | `cloudinary.uploader.upload()`      | Use `jest.mock('cloudinary')`              | `{ secure_url: 'https://cloudinary.com/test.jpg', public_id: 'test123' }`                       |
| Multer                | File upload handling                | Use `multer.memoryStorage()` or mock files | `{ originalname: 'test.jpg', size: 1024, mimetype: 'image/jpeg', buffer: Buffer.from('fake') }` |
| Logger                | `logger.info()`, `logger.error()`   | `jest.fn()`                                | N/A (spy on calls)                                                                              |
| Environment variables | Cloudinary credentials              | `process.env` mocking                      | `{ CLOUDINARY_CLOUD_NAME: 'test', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret' }` |
| Filesystem (fs)       | `fs.existsSync()`, `fs.mkdirSync()` | `jest.mock('fs')`                          | Return `true`/`false` for exists, mock `mkdirSync`                                              |

### Frontend Testing - Mocks Needed

| Dependency              | What to Mock           | Mocking Strategy           | Sample Mock Data                                            |
| ----------------------- | ---------------------- | -------------------------- | ----------------------------------------------------------- |
| `axiosInstance.post()`  | Upload API call        | `jest.mock()` or MSW       | `{ data: { url: 'https://test.com/image.jpg' } }`           |
| Ant Design `message`    | Success/error messages | `jest.fn()`                | N/A (spy on calls)                                          |
| File API                | `File` object          | Create mock File instances | `new File(['content'], 'test.jpg', { type: 'image/jpeg' })` |
| `FormData`              | FormData append        | Native API or polyfill     | Verify `.append('image', file)` called                      |
| `URL.createObjectURL()` | Blob URL creation      | Mock to return string      | `'blob:http://localhost/abc-123'`                           |

### Sample Test Data

```javascript
// Valid image file mock
const mockValidImageFile = {
  originalname: 'product-shoe.jpg',
  mimetype: 'image/jpeg',
  size: 2 * 1024 * 1024, // 2MB
  buffer: Buffer.from('fake-image-data'),
  fieldname: 'image',
};

// Invalid file mock (too large)
const mockLargeFile = {
  originalname: 'large-image.jpg',
  mimetype: 'image/jpeg',
  size: 15 * 1024 * 1024, // 15MB (over 10MB limit)
};

// Invalid file mock (wrong type)
const mockInvalidTypeFile = {
  originalname: 'document.pdf',
  mimetype: 'application/pdf',
  size: 500 * 1024, // 500KB
};

// Cloudinary response mock
const mockCloudinaryResponse = {
  secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  public_id: 'sample',
  format: 'jpg',
  width: 500,
  height: 500,
  bytes: 45678,
};

// Frontend File object mock
const mockFrontendFile = new File(['fake-image-content'], 'test-product.jpg', {
  type: 'image/jpeg',
});
Object.defineProperty(mockFrontendFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB

// Upload progress mock
const mockUploadProgress = {
  loaded: 500000,
  total: 1000000,
  percent: 50,
};

// File list state mock (Ant Design Upload)
const mockFileList = [
  {
    uid: '-1',
    name: 'image1.png',
    status: 'done',
    url: 'https://res.cloudinary.com/demo/image/upload/image1.png',
  },
  {
    uid: '-2',
    name: 'image2.jpg',
    status: 'uploading',
    percent: 70,
  },
];

// Express request mock with file
const mockReqWithFile = {
  file: {
    originalname: 'test.jpg',
    path: 'http://res.cloudinary.com/demo/image/upload/test.jpg', // HTTP (will be converted)
  },
};

// Express request mock without file
const mockReqNoFile = {
  file: undefined,
};
```

---

## 8. Suggested Next Prompts

### Prompt 1: Generate Detailed Unit Test Cases

```
Generate comprehensive unit test cases for the Uploads & Media module:

1. Backend tests:
   - Test `fileFilter()` function with all edge cases (valid/invalid types, extensions)
   - Test multer configuration (limits, file size validation)
   - Test `handleUpload()` middleware (HTTPS conversion, logging)
   - Test `setupUploadDirectories()` (directory creation, permissions)

2. Frontend tests:
   - Test `validateFile()` with various file types and sizes
   - Test `uploadToCloud()` with success/error scenarios
   - Test `handleUploadChange()` state management
   - Test upload progress tracking

Use Jest and React Testing Library. Include mocks for Cloudinary, axios, fs, and logger.
```

### Prompt 2: Generate Integration Test Code

```
Generate integration tests for Uploads & Media endpoints:

1. Test POST /upload endpoint:
   - Happy path: Valid image upload, returns URL
   - Error: No file uploaded
   - Error: Invalid file type
   - Error: File too large
   - Edge: Multiple concurrent uploads

2. Test protected routes:
   - PUT /profile with avatar upload (authenticated)
   - POST /products/visual-search with image
   - POST /store/products with multiple images

3. Test Cloudinary integration:
   - Mock Cloudinary responses
   - Test error handling when Cloudinary is unavailable
   - Verify image transformations

Use supertest for HTTP testing, and mock Cloudinary SDK.
```

### Prompt 3: Generate E2E Test Scenarios

```
Generate end-to-end test scenarios for file uploads:

1. User journey: Add product with images
   - Login as seller
   - Navigate to "Add Product"
   - Upload main image and 3 additional images
   - Fill product details
   - Submit form
   - Verify product created with correct image URLs in database
   - Verify images accessible via HTTPS

2. User journey: Update profile avatar
   - Login as user
   - Go to profile settings
   - Upload new avatar
   - Verify avatar updated in UI and database
   - Verify old avatar cleanup (if applicable)

3. Error handling journey:
   - Try to upload file > 10MB
   - Try to upload non-image file
   - Simulate network error during upload
   - Verify user sees appropriate error messages

Use Cypress or Playwright for E2E tests.
```

### Prompt 4: Generate Performance & Load Tests

```
Generate performance tests for upload functionality:

1. Load testing:
   - Simulate 50 concurrent users uploading files
   - Measure average upload time
   - Measure server resource usage
   - Identify bottlenecks

2. Large file handling:
   - Test with files at size limit (10MB)
   - Test with various image dimensions (up to 8000x8000)
   - Measure transformation time

3. Cloudinary quota monitoring:
   - Test behavior when approaching quota limits
   - Implement graceful degradation

Use Artillery or k6 for load testing.
```

### Prompt 5: Generate Security Test Cases

```
Generate security-focused tests for upload module:

1. File type validation bypass attempts:
   - Upload .exe file renamed to .jpg
   - Upload file with double extension (.jpg.exe)
   - Upload file with manipulated MIME type
   - Upload polyglot files (valid image + malicious payload)

2. Path traversal attacks:
   - Attempt upload with filename: ../../etc/passwd.jpg
   - Test with various path injection techniques

3. XSS attempts:
   - Upload file with XSS in filename
   - Test for proper filename sanitization

4. DoS attempts:
   - Rapidly upload many small files
   - Upload files at size limit repeatedly
   - Test rate limiting

Document expected security behavior for each scenario.
```

### Prompt 6: Generate Mock Data & Test Utilities

```
Create comprehensive test utilities and mock data for upload testing:

1. Mock factory functions:
   - `createMockFile(options)` - Generate File objects with custom properties
   - `createMockMulterFile(options)` - Generate multer file objects
   - `createMockCloudinaryResponse(options)` - Generate Cloudinary responses

2. Test helpers:
   - `simulateFileUpload(file, endpoint)` - Helper to POST file uploads
   - `createFormDataWithFile(file, fieldName)` - FormData creator
   - `waitForUploadComplete(uploadPromise, timeout)` - Async upload waiter

3. Assertion helpers:
   - `expectValidCloudinaryUrl(url)` - Assert URL format
   - `expectFileInRequest(req, fieldName)` - Assert req.file presence
   - `expectUploadError(response, errorMessage)` - Assert error format

Provide TypeScript types if applicable.
```

---

## 9. Additional Recommendations

### Code Coverage Goals

- **Unit Tests**: Aim for >90% coverage on upload.middleware.js, cloudinary.js
- **Integration Tests**: Cover all upload endpoints with happy/error paths
- **E2E Tests**: At least 3 critical user journeys

### CI/CD Considerations

- Mock Cloudinary in CI environment to avoid API quota usage
- Use test Cloudinary account for integration tests
- Implement upload test file cleanup in afterEach/afterAll hooks

### Documentation Needs

- Document upload size limits clearly in API docs
- Provide frontend component usage examples
- Create troubleshooting guide for common upload errors

### Future Enhancements to Test

- Image compression before upload
- Support for video uploads
- Progressive image loading
- Image CDN caching strategy
- Backup storage provider (S3, local filesystem)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-12  
**Status:** Ready for Test Implementation
