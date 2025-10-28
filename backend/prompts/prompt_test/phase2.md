Prompt 2: Generate Test Cases
"Generate a comprehensive **Test Cases Matrix** (Markdown) for the feature **Blog & Comments**, based on `feature-analysis-blog-comments.md`.

**Feature Summary**
The system manages blog posts with CRUD operations, content publishing, user commenting, and engagement features like likes and views.

**Output**
Return exactly ONE Markdown file named header:
`# test-cases-matrix-blog-comments.md`

Each test case must be a row with **8 columns** in this order:
`Test ID | Category | Test Scenario | Pre-conditions | Test Steps | Test Data | Expected Result | Priority | Dependencies`

**Suites & Targets (generate in order, keep minimum counts)**

1. Blog CRUD Operations (≥20) — `blogController.createBlog()`, `getBlog()`, `listBlogs()`, `updateBlog()`, `deleteBlog()`
2. Blog Publishing & Management (≥15) — `setPublishStatus()`, `toggleFeatured()`, `incrementViews()`, `setLike()`
3. Comment System (≥18) — `blogCommentController.createComment()`, `listComments()`, `updateComment()`, `deleteComment()`, `setCommentLike()`
4. Content Sanitization & Validation (≥12) — HTML sanitization, slug generation, input validation
5. Authentication & Authorization (≥10) — Role-based access, JWT validation, permission checks
6. Frontend Integration (≥15) — `BlogFeedPage`, `BlogDetailPage`, `BlogComposerPage`, API integration
7. Edge Cases & Error Handling (≥15) — Database errors, network failures, invalid inputs, concurrent operations
8. Integration & E2E (≥10) — Complete user workflows from blog creation to commenting

**ID & Categories**

- Test ID format: `TC-[SuiteNumber][SequentialNumber]` (e.g., TC-101, TC-201)
- Category values: `Happy Path`, `Alternative Path`, `Edge Case`, `Negative Test`, `Error Handling`, `Performance`, `Security`

**Data Standards (Realistic blog content data)**
Blog Titles:

- `"Top 10 Sneaker Trends 2024"`
- `"How to Style Your Kicks for Summer"`
- `"The History of Air Jordan Series"`
- `"Sustainable Fashion in Footwear"`

Blog Content:

- `"<p>Discover the latest sneaker trends that are taking the fashion world by storm...</p>"`
- `"<h2>Summer Styling Tips</h2><p>Here are some expert tips for styling your kicks...</p>"`
- `"<img src='trend-image.jpg' alt='Sneaker trend'/><p>Visual guide to current trends...</p>"`

Categories: `"Fashion"`, `"Trends"`, `"Reviews"`, `"Lifestyle"`, `"History"`, `"Sustainability"`
Tags: `"sneakers"`, `"fashion"`, `"trends"`, `"style"`, `"shoes"`, `"lifestyle"`, `"sustainability"`

Comments:

- `"Great article! Love these tips."`
- `"Where can I buy these shoes?"`
- `"Thanks for sharing this information."`
- `"<script>alert('xss')</script>Malicious content"`

User Roles: `"admin"`, `"shop"`, `"user"`, `"guest"`

**Coverage Checklist (must include)**

- Blog CRUD operations (create, read, update, delete)
- Slug generation and uniqueness validation
- Content sanitization (HTML, XSS prevention)
- Role-based access control (admin/shop vs user)
- Comment creation and moderation
- Like/unlike functionality
- View counting and analytics
- Search and filtering capabilities
- Pagination and performance
- Image upload and validation
- Draft vs published status management
- Featured blog toggle
- Authentication and authorization
- Input validation and error handling
- Database transaction integrity
- Concurrent user operations
- Security vulnerabilities (XSS, injection)

**Constraints**

- Language: English for technical terms, function names, code; Vietnamese for user-facing scenarios
- **Test Steps**: BDD style (one line each) → **Given / When / Then** (optional And)
- Use only **concrete** data (no placeholders)
- At least **30% High** priority overall
- Cross-reference related functions/modules in **Dependencies** (from analysis §3–§4)

**Expected Result Formats**

- For `createBlog()`:

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Top 10 Sneaker Trends 2024",
    "slug": "top-10-sneaker-trends-2024",
    "content": "<p>Discover the latest trends...</p>",
    "author": "507f1f77bcf86cd799439012",
    "status": "published",
    "views": 0,
    "likes": 0,
    "commentsCount": 0,
    "publishedAt": "2024-01-01T00:00:00Z"
  }
}
```

- For `createComment()`:

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "blog": "507f1f77bcf86cd799439011",
    "user": "507f1f77bcf86cd799439012",
    "content": "Great article! Love these tips.",
    "likes": 0,
    "status": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```
