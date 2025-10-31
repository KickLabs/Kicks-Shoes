# Blog & Comments – Technical & Testing Analysis

## 1. Feature Overview

### Business Purpose

The Blog & Comments feature enables the Kicks Shoes platform to:

- **Content Marketing**: Publish articles about shoes, fashion trends, and brand stories
- **Community Engagement**: Allow users to interact through comments and likes
- **SEO & Discovery**: Improve search visibility through structured blog content
- **User Retention**: Keep users engaged with fresh content and social interactions

### Key UI Flows

1. **Blog Discovery**: Users browse published blogs with filtering and search
2. **Blog Reading**: Users view individual blog posts with full content
3. **Blog Creation**: Admin/Shop users create and manage blog posts
4. **Commenting System**: Authenticated users can comment and like posts
5. **Content Moderation**: Admin controls over publishing and featuring

### Main Business Rules & Success Criteria

- **Publishing Control**: Only admin/shop roles can create/edit blogs
- **Content Quality**: All content is sanitized and validated
- **Engagement Metrics**: Track views, likes, and comments for analytics
- **SEO Optimization**: Unique slugs, meta content, and structured data
- **User Experience**: Responsive design with smooth interactions

### Why This Feature is Important for Testing

- **Content Management**: Critical for brand communication and SEO
- **User Engagement**: Comments and likes drive community interaction
- **Security**: Content sanitization prevents XSS and injection attacks
- **Performance**: Pagination and caching affect user experience
- **Access Control**: Role-based permissions must be properly enforced

## 2. UI/UX Flow Mapping

| Step | UI Screen/Component | User Action                   | System Behavior                                           |
| ---- | ------------------- | ----------------------------- | --------------------------------------------------------- |
| 1    | BlogFeedPage        | User visits `/blog`           | Loads published blogs with pagination                     |
| 2    | BlogFeedPage        | User searches/filters content | Updates query parameters and refetches data               |
| 3    | BlogFeedPage        | User clicks on blog card      | Navigates to `/blog/:id` and increments view count        |
| 4    | BlogDetailPage      | User views blog content       | Displays full blog with author info and metadata          |
| 5    | BlogDetailPage      | User clicks "Like" button     | Requires authentication, updates like count               |
| 6    | BlogDetailPage      | User writes comment           | Requires authentication, validates content, adds to list  |
| 7    | BlogComposerPage    | Admin creates new post        | Form validation, content sanitization, slug generation    |
| 8    | BlogComposerPage    | Admin publishes post          | Sets status to 'published', updates publishedAt timestamp |
| 9    | BlogDetailPage      | Admin toggles featured status | Updates isFeatured flag, affects display priority         |

## 3. Related Files, Components & Modules

| File/Path                                                 | Layer (UI/Logic/Service/State/API) | Responsibility               | Key Methods/Props/States                                  |
| --------------------------------------------------------- | ---------------------------------- | ---------------------------- | --------------------------------------------------------- |
| **Backend Models**                                        |
| `backend/src/models/Blog.js`                              | Data Layer                         | Blog schema definition       | title, slug, content, author, status, views, likes        |
| `backend/src/models/BlogComment.js`                       | Data Layer                         | Comment schema definition    | blog, user, content, parentComment, likes, status         |
| **Backend Controllers**                                   |
| `backend/src/controllers/blogController.js`               | API Layer                          | Blog CRUD operations         | createBlog, getBlog, listBlogs, updateBlog, deleteBlog    |
| `backend/src/controllers/blogCommentController.js`        | API Layer                          | Comment operations           | createComment, listComments, updateComment, deleteComment |
| **Backend Routes**                                        |
| `backend/src/routes/blogRoutes.js`                        | API Layer                          | Blog endpoint definitions    | GET /, GET /:id, POST /, PUT /:id, DELETE /:id            |
| `backend/src/routes/blogCommentRoutes.js`                 | API Layer                          | Comment endpoint definitions | GET /:blogId, POST /, PUT /:id, DELETE /:id               |
| **Frontend Components**                                   |
| `frontend/src/components/pages/blog/BlogFeedPage.jsx`     | UI Layer                           | Blog listing and filtering   | load(), handleFilterChange(), handleView()                |
| `frontend/src/components/pages/blog/BlogDetailPage.jsx`   | UI Layer                           | Blog display and interaction | load(), handleLike(), submitComment()                     |
| `frontend/src/components/pages/blog/BlogComposerPage.jsx` | UI Layer                           | Blog creation/editing        | submit(), handleUpload(), handleChange()                  |
| **Frontend Services**                                     |
| `frontend/src/services/blogService.js`                    | Service Layer                      | API communication            | list(), get(), create(), update(), createComment()        |
| **Authentication & Authorization**                        |
| `backend/src/middlewares/auth.middleware.js`              | Middleware                         | JWT verification             | protect(), optionalAuth(), authorize()                    |
| `backend/src/middlewares/role.middleware.js`              | Middleware                         | Role-based access            | requireRoles(), requireAdmin()                            |
| **Utilities**                                             |
| `backend/src/utils/sanitize.js`                           | Utility                            | Content sanitization         | sanitizeText(), sanitizeHtml()                            |
| `backend/src/utils/logger.js`                             | Utility                            | Logging                      | info(), error(), warn()                                   |

## 4. Core Functions / Methods to Test

### Blog Controller Functions

#### `createBlog(req, res)`

- **Purpose**: Create new blog post with validation and slug generation
- **Inputs + Types**:
  - `req.body`: { title: string, content: string, summary?: string, category?: string, tags?: string[], status?: 'draft'|'published' }
  - `req.user`: Authenticated user object
- **Outputs / Return**:
  - Success: `{ success: true, data: Blog }` (201)
  - Error: `{ success: false, message: string }` (400/500)
- **State Change / Side Effects**:
  - Creates new Blog document in database
  - Generates unique slug from title
  - Sets publishedAt if status is 'published'
- **Edge Cases**:
  - Empty title (validation error)
  - Duplicate slug (auto-increment with counter)
  - Invalid HTML content (sanitization)
  - Missing author (uses req.user.\_id)
- **Dependencies (mock needed?)**:
  - Blog model (mock)
  - User model (mock)
  - sanitizeText/sanitizeHtml (mock)

#### `getBlog(req, res)`

- **Purpose**: Retrieve single blog by ID or slug
- **Inputs + Types**:
  - `req.params.idOrSlug`: string (MongoDB ObjectId or slug)
- **Outputs / Return**:
  - Success: `{ success: true, data: Blog }` (200)
  - Error: `{ success: false, message: string }` (404/500)
- **State Change / Side Effects**: None (read-only)
- **Edge Cases**:
  - Invalid ID format
  - Non-existent blog
  - Malformed slug
- **Dependencies (mock needed?)**:
  - Blog model (mock)

#### `listBlogs(req, res)`

- **Purpose**: Retrieve paginated list of blogs with filtering
- **Inputs + Types**:
  - `req.query`: { q?: string, category?: string, author?: string, tags?: string[], status?: string, sortBy?: string, order?: string, page?: number, limit?: number }
- **Outputs / Return**:
  - Success: `{ success: true, data: Blog[], total: number }` (200)
- **State Change / Side Effects**: None (read-only)
- **Edge Cases**:
  - Empty search results
  - Invalid pagination parameters
  - Malformed filter values
- **Dependencies (mock needed?)**:
  - Blog model (mock)

#### `updateBlog(req, res)`

- **Purpose**: Update existing blog post
- **Inputs + Types**:
  - `req.params.id`: string (MongoDB ObjectId)
  - `req.body`: Partial Blog object
- **Outputs / Return**:
  - Success: `{ success: true, data: Blog }` (200)
  - Error: `{ success: false, message: string }` (404/400/500)
- **State Change / Side Effects**:
  - Updates Blog document
  - Regenerates slug if title changed
- **Edge Cases**:
  - Non-existent blog ID
  - Duplicate slug after title change
  - Invalid update data
- **Dependencies (mock needed?)**:
  - Blog model (mock)

#### `deleteBlog(req, res)`

- **Purpose**: Permanently delete blog post
- **Inputs + Types**:
  - `req.params.id`: string (MongoDB ObjectId)
- **Outputs / Return**:
  - Success: `{ success: true, message: string }` (200)
  - Error: `{ success: false, message: string }` (404/500)
- **State Change / Side Effects**:
  - Removes Blog document from database
- **Edge Cases**:
  - Non-existent blog ID
  - Cascade delete comments (not implemented)
- **Dependencies (mock needed?)**:
  - Blog model (mock)

### Blog Comment Controller Functions

#### `createComment(req, res)`

- **Purpose**: Create new comment on blog post
- **Inputs + Types**:
  - `req.body`: { blog: string, content: string, parentComment?: string }
  - `req.user`: Authenticated user object
- **Outputs / Return**:
  - Success: `{ success: true, data: BlogComment }` (201)
  - Error: `{ success: false, message: string }` (400/500)
- **State Change / Side Effects**:
  - Creates new BlogComment document
  - Increments blog.commentsCount
- **Edge Cases**:
  - Empty content
  - Non-existent blog ID
  - Invalid parent comment reference
- **Dependencies (mock needed?)**:
  - BlogComment model (mock)
  - Blog model (mock)

#### `listComments(req, res)`

- **Purpose**: Retrieve comments for a blog post
- **Inputs + Types**:
  - `req.params.blogId`: string (MongoDB ObjectId)
  - `req.query`: { parentComment?: string, page?: number, limit?: number }
- **Outputs / Return**:
  - Success: `{ success: true, data: BlogComment[], total: number }` (200)
- **State Change / Side Effects**: None (read-only)
- **Edge Cases**:
  - Non-existent blog ID
  - Empty comment list
  - Invalid pagination
- **Dependencies (mock needed?)**:
  - BlogComment model (mock)

#### `setCommentLike(req, res)`

- **Purpose**: Like/unlike a comment
- **Inputs + Types**:
  - `req.params.id`: string (MongoDB ObjectId)
  - `req.body`: { like: boolean }
- **Outputs / Return**:
  - Success: `{ success: true, data: BlogComment }` (200)
- **State Change / Side Effects**:
  - Increments/decrements comment.likes
  - Prevents negative like count
- **Edge Cases**:
  - Non-existent comment
  - Negative like count (corrected to 0)
- **Dependencies (mock needed?)**:
  - BlogComment model (mock)

### Frontend Service Functions

#### `blogService.list(params)`

- **Purpose**: Fetch paginated blog list with filters
- **Inputs + Types**:
  - `params`: { q?: string, category?: string, page?: number, limit?: number, sortBy?: string, order?: string }
- **Outputs / Return**:
  - Promise resolving to `{ success: boolean, data: Blog[], total: number }`
- **State Change / Side Effects**:
  - Makes HTTP GET request to `/blogs`
- **Edge Cases**:
  - Network errors
  - Empty response
  - Invalid parameters
- **Dependencies (mock needed?)**:
  - axiosInstance (mock)

#### `blogService.createComment(payload)`

- **Purpose**: Submit new comment
- **Inputs + Types**:
  - `payload`: { blog: string, content: string }
- **Outputs / Return**:
  - Promise resolving to `{ success: boolean, data: BlogComment }`
- **State Change / Side Effects**:
  - Makes HTTP POST request to `/blog-comments`
- **Edge Cases**:
  - Authentication required
  - Content validation
  - Network errors
- **Dependencies (mock needed?)**:
  - axiosInstance (mock)

## 5. Test Case Matrix

| Category                               | Scenario                       | Pre-condition                                     | Input                                                                                               | Expected Output/Behavior                          |
| -------------------------------------- | ------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Blog Creation - Happy Path**         |
| Happy                                  | Create valid blog post         | Authenticated admin/shop user                     | `{ title: "Test Post", content: "Content", status: "draft" }`                                       | Blog created with auto-generated slug, 201 status |
| Happy                                  | Create and publish immediately | Authenticated admin/shop user                     | `{ title: "Test Post", content: "Content", status: "published" }`                                   | Blog created with publishedAt timestamp           |
| Happy                                  | Create with custom slug        | Authenticated admin/shop user                     | `{ title: "Test Post", slug: "custom-slug", content: "Content" }`                                   | Blog created with provided slug                   |
| **Blog Creation - Edge Cases**         |
| Edge                                   | Empty title                    | Authenticated admin/shop user                     | `{ title: "", content: "Content" }`                                                                 | Validation error, 400 status                      |
| Edge                                   | Duplicate slug                 | Authenticated admin/shop user                     | `{ title: "Existing Title", content: "Content" }`                                                   | Auto-generated unique slug with counter           |
| Edge                                   | Very long content              | Authenticated admin/shop user                     | `{ title: "Test", content: "x".repeat(10000) }`                                                     | Content sanitized and truncated                   |
| Edge                                   | HTML injection attempt         | Authenticated admin/shop user                     | `{ title: "<script>alert('xss')</script>", content: "Content" }`                                    | HTML sanitized, script tags removed               |
| **Blog Creation - Error Cases**        |
| Error                                  | Unauthenticated user           | No authentication                                 | `{ title: "Test", content: "Content" }`                                                             | 401 Unauthorized                                  |
| Error                                  | Invalid role                   | Authenticated user role                           | `{ title: "Test", content: "Content" }`                                                             | 403 Forbidden                                     |
| Error                                  | Database connection failure    | Database down                                     | `{ title: "Test", content: "Content" }`                                                             | 500 Internal Server Error                         |
| **Blog Retrieval - Happy Path**        |
| Happy                                  | Get blog by ID                 | Valid blog exists                                 | `GET /blogs/507f1f77bcf86cd799439011`                                                               | Blog data returned with populated author          |
| Happy                                  | Get blog by slug               | Valid blog exists                                 | `GET /blogs/test-blog-slug`                                                                         | Blog data returned                                |
| Happy                                  | List blogs with filters        | Published blogs exist                             | `GET /blogs?category=shoes&page=1&limit=10`                                                         | Paginated blog list returned                      |
| **Blog Retrieval - Edge Cases**        |
| Edge                                   | Non-existent blog ID           | No blog with ID                                   | `GET /blogs/507f1f77bcf86cd799439012`                                                               | 404 Not Found                                     |
| Edge                                   | Invalid ID format              | Malformed ObjectId                                | `GET /blogs/invalid-id`                                                                             | 400 Bad Request                                   |
| Edge                                   | Empty search results           | No matching blogs                                 | `GET /blogs?q=nonexistent`                                                                          | Empty array with total: 0                         |
| **Blog Retrieval - Error Cases**       |
| Error                                  | Database connection failure    | Database down                                     | `GET /blogs`                                                                                        | 500 Internal Server Error                         |
| **Comment Creation - Happy Path**      |
| Happy                                  | Create valid comment           | Authenticated user, valid blog                    | `{ blog: "507f1f77bcf86cd799439011", content: "Great post!" }`                                      | Comment created, blog.commentsCount incremented   |
| Happy                                  | Create nested comment          | Authenticated user, valid blog and parent comment | `{ blog: "507f1f77bcf86cd799439011", content: "Reply", parentComment: "507f1f77bcf86cd799439012" }` | Nested comment created                            |
| **Comment Creation - Edge Cases**      |
| Edge                                   | Empty comment content          | Authenticated user, valid blog                    | `{ blog: "507f1f77bcf86cd799439011", content: "" }`                                                 | Validation error, 400 status                      |
| Edge                                   | Very long comment              | Authenticated user, valid blog                    | `{ blog: "507f1f77bcf86cd799439011", content: "x".repeat(1000) }`                                   | Content sanitized and truncated                   |
| Edge                                   | Comment on non-existent blog   | Authenticated user                                | `{ blog: "507f1f77bcf86cd799439012", content: "Comment" }`                                          | 400 Bad Request                                   |
| **Comment Creation - Error Cases**     |
| Error                                  | Unauthenticated user           | No authentication                                 | `{ blog: "507f1f77bcf86cd799439011", content: "Comment" }`                                          | 401 Unauthorized                                  |
| Error                                  | Database connection failure    | Database down                                     | `{ blog: "507f1f77bcf86cd799439011", content: "Comment" }`                                          | 500 Internal Server Error                         |
| **Comment Interaction - Happy Path**   |
| Happy                                  | Like comment                   | Authenticated user, valid comment                 | `POST /blog-comments/507f1f77bcf86cd799439011/like { like: true }`                                  | Comment likes incremented                         |
| Happy                                  | Unlike comment                 | Authenticated user, valid comment                 | `POST /blog-comments/507f1f77bcf86cd799439011/like { like: false }`                                 | Comment likes decremented                         |
| **Comment Interaction - Edge Cases**   |
| Edge                                   | Like non-existent comment      | Authenticated user                                | `POST /blog-comments/507f1f77bcf86cd799439012/like { like: true }`                                  | 404 Not Found                                     |
| Edge                                   | Unlike when likes = 0          | Authenticated user, comment with 0 likes          | `POST /blog-comments/507f1f77bcf86cd799439011/like { like: false }`                                 | Likes remain 0 (no negative)                      |
| **Frontend Integration - Happy Path**  |
| Happy                                  | Load blog feed                 | User visits /blog                                 | Page loads                                                                                          | Blog cards displayed with pagination              |
| Happy                                  | Search blogs                   | User types in search box                          | "shoes"                                                                                             | Filtered results displayed                        |
| Happy                                  | View blog detail               | User clicks blog card                             | Navigate to /blog/:id                                                                               | Full blog content displayed                       |
| Happy                                  | Submit comment                 | User types comment and submits                    | "Great article!"                                                                                    | Comment appears in list                           |
| **Frontend Integration - Edge Cases**  |
| Edge                                   | Network timeout                | Slow connection                                   | Any API call                                                                                        | Loading state shown, error message displayed      |
| Edge                                   | Empty blog feed                | No published blogs                                | Page loads                                                                                          | Empty state with "Create First Post" button       |
| Edge                                   | Comment submission failure     | Network error during comment                      | "Comment text"                                                                                      | Comment restored to input, error message shown    |
| **Frontend Integration - Error Cases** |
| Error                                  | Authentication expired         | User session expired                              | Any authenticated action                                                                            | Redirect to login page                            |
| Error                                  | Server error                   | Backend returns 500                               | Any API call                                                                                        | Error message displayed to user                   |

## 6. Test Priority Recommendation

### High Priority (Critical Business Functions)

- **Blog CRUD Operations** - Core content management functionality
- **Comment Creation & Display** - Essential for user engagement
- **Authentication & Authorization** - Security-critical role-based access
- **Content Sanitization** - Prevents XSS and injection attacks
- **Slug Generation & Uniqueness** - SEO and URL routing dependent

### Medium Priority (Important Features)

- **Blog Filtering & Search** - User experience enhancement
- **Pagination** - Performance and usability
- **Like/Unlike Functionality** - User engagement features
- **Image Upload** - Content creation workflow
- **Blog Status Management** - Content publishing control

### Low Priority (Nice-to-Have Features)

- **Comment Nesting** - Advanced commenting features
- **Blog Analytics** - Views and engagement tracking
- **Featured Blog Toggle** - Content prioritization
- **Tag Management** - Content organization
- **Rich Text Editor** - Content creation experience

## 7. Mocking & Test Data Preparation

| Dependency          | What to Mock                                                                                              | Mocking Strategy                                | Sample Mock Data                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database Models** |
| Blog Model          | `Blog.create()`, `Blog.findById()`, `Blog.find()`, `Blog.findByIdAndUpdate()`, `Blog.findByIdAndDelete()` | Jest mock functions returning resolved promises | `{ _id: "507f1f77bcf86cd799439011", title: "Test Blog", slug: "test-blog", content: "Test content", author: "507f1f77bcf86cd799439012", status: "published", views: 0, likes: 0, commentsCount: 0, createdAt: "2024-01-01T00:00:00Z" }` |
| BlogComment Model   | `BlogComment.create()`, `BlogComment.find()`, `BlogComment.findByIdAndUpdate()`                           | Jest mock functions returning resolved promises | `{ _id: "507f1f77bcf86cd799439013", blog: "507f1f77bcf86cd799439011", user: "507f1f77bcf86cd799439012", content: "Great post!", likes: 0, status: true, createdAt: "2024-01-01T00:00:00Z" }`                                            |
| User Model          | `User.findById()`                                                                                         | Jest mock function for authentication           | `{ _id: "507f1f77bcf86cd799439012", email: "test@example.com", role: "admin", isVerified: true, status: true }`                                                                                                                         |
| **HTTP Requests**   |
| axiosInstance       | All HTTP methods (GET, POST, PUT, DELETE)                                                                 | Jest mock with `jest.mock()`                    | `{ data: { success: true, data: mockBlogData } }`                                                                                                                                                                                       |
| **Utilities**       |
| sanitizeText        | `sanitizeText()` function                                                                                 | Jest mock returning sanitized string            | `"sanitized-text"`                                                                                                                                                                                                                      |
| sanitizeHtml        | `sanitizeHtml()` function                                                                                 | Jest mock returning sanitized HTML              | `"<p>sanitized html</p>"`                                                                                                                                                                                                               |
| logger              | `logger.info()`, `logger.error()`                                                                         | Jest mock functions                             | No return value needed                                                                                                                                                                                                                  |
| **Authentication**  |
| JWT                 | `jwt.verify()`                                                                                            | Jest mock returning decoded token               | `{ id: "507f1f77bcf86cd799439012", iat: 1640995200 }`                                                                                                                                                                                   |
| **File Upload**     |
| Cloudinary/Multer   | File upload middleware                                                                                    | Jest mock returning file URL                    | `"https://res.cloudinary.com/example/image/upload/v1234567890/test.jpg"`                                                                                                                                                                |

## 8. Suggested Next Prompts

### Prompt 1: Generate Detailed Unit Test Cases

```
Generate comprehensive unit test cases for the Blog & Comments feature using Jest and Supertest. Focus on:

1. Blog Controller Tests:
   - Test createBlog with valid/invalid inputs
   - Test getBlog with existing/non-existing IDs
   - Test listBlogs with various filters
   - Test updateBlog and deleteBlog operations
   - Test authentication and authorization middleware

2. Blog Comment Controller Tests:
   - Test createComment with valid/invalid inputs
   - Test listComments with pagination
   - Test setCommentLike functionality
   - Test comment deletion (soft/hard delete)

3. Edge Cases and Error Handling:
   - Test slug uniqueness and generation
   - Test content sanitization
   - Test database connection failures
   - Test validation errors

Include proper mocking strategies and test data setup.
```

### Prompt 2: Generate Integration Test Code

```
Create integration tests for the Blog & Comments feature that test:

1. Complete API Workflows:
   - Create blog → View blog → Add comment → Like comment
   - Search and filter blogs
   - Admin blog management (publish, feature, delete)

2. Authentication Flows:
   - Public access to published blogs
   - Authenticated user commenting
   - Admin-only blog creation/editing

3. Database Integration:
   - Test actual database operations
   - Test data consistency (commentsCount updates)
   - Test cascade operations

Use Supertest for API testing and include database setup/teardown.
```

### Prompt 3: Generate Frontend Component Tests

```
Create React Testing Library tests for Blog & Comments frontend components:

1. BlogFeedPage Component:
   - Test blog listing and pagination
   - Test search and filtering functionality
   - Test empty states and loading states
   - Test responsive design

2. BlogDetailPage Component:
   - Test blog content display
   - Test comment submission and display
   - Test like functionality
   - Test authentication requirements

3. BlogComposerPage Component:
   - Test form validation
   - Test rich text editor integration
   - Test image upload functionality
   - Test draft/publish workflow

Include proper mocking of API calls and user interactions.
```

### Prompt 4: Generate E2E Test Scenarios

```
Create end-to-end test scenarios using Cypress or Playwright for Blog & Comments:

1. User Journey Tests:
   - Guest user browsing blogs
   - Authenticated user commenting
   - Admin creating and managing blogs

2. Cross-Browser Testing:
   - Test on Chrome, Firefox, Safari
   - Test responsive design on mobile/tablet
   - Test accessibility compliance

3. Performance Testing:
   - Test page load times
   - Test API response times
   - Test with large datasets

Include test data setup and cleanup procedures.
```

### Prompt 5: Generate Security Test Cases

```
Create security-focused test cases for Blog & Comments:

1. Input Validation Tests:
   - XSS prevention in blog content
   - SQL injection prevention
   - File upload security
   - Content sanitization

2. Authentication & Authorization Tests:
   - JWT token validation
   - Role-based access control
   - Session management
   - CSRF protection

3. Data Protection Tests:
   - Sensitive data exposure
   - Rate limiting
   - Input length limits
   - File type validation

Include both automated and manual testing approaches.
```
