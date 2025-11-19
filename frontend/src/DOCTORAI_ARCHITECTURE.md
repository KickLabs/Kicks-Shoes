# 🏗️ DOCTOR AI - SYSTEM ARCHITECTURE

## 📊 SYSTEM FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                    ✅ ĐÃ HOÀN THÀNH 100%                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTP/REST API
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                         │
│                    ❌ CẦN XÂY DỰNG                                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Upload Endpoint: POST /api/upload                     │   │
│  │    - Nhận: FormData (images)                             │   │
│  │    - Xử lý: Lưu file → Generate URLs                     │   │
│  │    - Trả về: { urls: ["url1", "url2"] }                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 2. Chat Endpoint: POST /api/chat                         │   │
│  │    - Nhận: { conversationId, userText, imageUrls }       │   │
│  │    - Xử lý: Query DB → Call Gemini AI → Save messages   │   │
│  │    - Trả về: { conversationId, reply }                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    │                           │
        ┌───────────▼───────────┐   ┌──────────▼─────────┐
        │    File Storage       │   │  Google Gemini AI  │
        │  (Local/Cloud)        │   │   Vision API       │
        │  - Images             │   │  - Analyze images  │
        │  - PDFs               │   │  - Generate reply  │
        └───────────────────────┘   └────────────────────┘
                    │
        ┌───────────▼───────────┐
        │   MongoDB Database    │
        │  - Conversations      │
        │  - Messages           │
        │  - Users              │
        └───────────────────────┘
```

---

## 🔄 USER JOURNEY FLOW

```
USER ACTIONS                    FRONTEND                 BACKEND                    AI SERVICE
─────────────────────────────────────────────────────────────────────────────────────────────

1. Upload ảnh thú cưng
   │                             │
   ├─► Click "Chọn ảnh"          │
   │   Select 1-5 images         │
   │                             │
   │   ┌─────────────────┐       │
   │   │ Preview images  │       │
   │   │ on screen       │       │
   │   └─────────────────┘       │
   │                             │
   │                             │
2. Nhập mô tả ca bệnh            │
   │                             │
   ├─► Textarea: "Chó Alaska,    │
   │   3 tuổi, nôn mửa..."       │
   │                             │
   │                             │
3. Nhập câu hỏi                  │
   │                             │
   ├─► Input: "Có nguy hiểm      │
   │   không?"                   │
   │                             │
   │                             │
4. Click "Gửi"                   │
   │                             │
   │                          ┌──▼────────────────────┐
   │                          │ 1. Upload images      │
   │                          │    POST /api/upload   │
   │                          └───┬───────────────────┘
   │                              │
   │                              ├─► Save files to disk/cloud
   │                              ├─► Generate URLs
   │                              │
   │                          ┌───▼───────────────────┐
   │                          │ Return: { urls: [...] }│
   │                          └───┬───────────────────┘
   │                              │
   │                          ┌───▼───────────────────┐
   │                          │ 2. Format userText    │
   │                          │   [MÔ TẢ CA BỆNH]...  │
   │                          │   [CÂU HỎI]...        │
   │                          └───┬───────────────────┘
   │                              │
   │                          ┌───▼───────────────────┐
   │                          │ 3. Call POST /api/chat│
   │                          │    with payload       │
   │                          └───┬───────────────────┘
   │                              │
   │                              ├─► Find/Create Conversation
   │                              ├─► Save User Message to DB
   │                              │
   │                              ├─────────────────► Call Gemini API
   │                              │                   - Send userText
   │                              │                   - Send imageUrls
   │                              │                   - Get AI analysis
   │                              │
   │                              │◄─────────────────── Return AI reply
   │                              │
   │                              ├─► Save AI Message to DB
   │                              ├─► Update Conversation
   │                              │
   │                          ┌───▼───────────────────┐
   │                          │ Return: {             │
   │                          │   conversationId,     │
   │                          │   reply               │
   │                          │ }                     │
   │                          └───┬───────────────────┘
   │   ┌─────────────────┐       │
   │   │ Display reply   │◄──────┘
   │   │ in chat UI      │
   │   └─────────────────┘
   │
5. Tiếp tục chat (nếu cần)
   │                             │
   ├─► Input new question        │
   │                             │
   │                          ┌──▼────────────────────┐
   │                          │ Use same              │
   │                          │ conversationId        │
   │                          │ for context           │
   │                          └───────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA

```
┌──────────────────────────────────────┐
│         Conversations                 │
├──────────────────────────────────────┤
│ _id: ObjectId                         │
│ conversationId: String (unique)       │
│ userId: ObjectId → Users              │
│ createdAt: Date                       │
│ lastActivityAt: Date                  │
│ status: "active" | "closed"           │
└──────────────────────────────────────┘
                  │
                  │ 1:N
                  ▼
┌──────────────────────────────────────┐
│            Messages                   │
├──────────────────────────────────────┤
│ _id: ObjectId                         │
│ conversationId: String                │
│ userId: ObjectId → Users              │
│ role: "user" | "assistant"            │
│ content: {                            │
│   text: String                        │
│   imageUrls: [String]                 │
│ }                                     │
│ timestamp: Date                       │
│ aiModel: String                       │
│ tokensUsed: Number                    │
└──────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │ 1. Login
       │    POST /api/auth/login
       │    { email, password }
       ▼
┌──────────────┐
│   Backend    │
│              │
│  Verify user │
│  Generate JWT│
└──────┬───────┘
       │ 2. Return token
       │    { token: "eyJhbG..." }
       ▼
┌──────────────┐
│   Frontend   │
│              │
│  Save to     │
│  localStorage│
└──────┬───────┘
       │ 3. Make API calls
       │    Authorization: Bearer <token>
       ▼
┌──────────────┐
│   Backend    │
│              │
│  Verify JWT  │
│  Extract     │
│  userId      │
└──────┬───────┘
       │ 4. Process request
       │    with userId
       ▼
   (Success)
```

---

## 🎨 DATA FLOW: Upload → Chat

```
FRONTEND STATE                         BACKEND PROCESSING
─────────────────────────────────────────────────────────────

state: {
  conversationId: null                 1. Upload Phase
  files: [File, File]          ────────►  POST /api/upload
  description: "Chó..."                    │
  input: "Có nguy hiểm?"                   ├─► Multer receives files
}                                          ├─► Save to disk/S3
                                           ├─► Generate public URLs
                                           │
                                      ◄────┤ { urls: ["url1", "url2"] }

state: {                               2. Text Composition
  imageUrls: ["url1", "url2"]            composeUserText(input, description)
}                                          │
                                           ▼
                                      "[MÔ TẢ CA BỆNH]
                                       Chó Alaska...

                                       [CÂU HỎI]
                                       Có nguy hiểm không?"

                                       3. Chat Phase
sendMessage()                   ────────►  POST /api/chat
  payload: {                               {
    conversationId: null                     conversationId: null,
    userText: "..."                          userText: "...",
    imageUrls: [...]                         imageUrls: [...],
    createIfMissing: true                    createIfMissing: true
  }                                        }
                                           │
                                           ├─► Create Conversation
                                           ├─► Save User Message
                                           │
                                           ├─► Call Gemini AI ────►
                                           │   with text + images
                                           │                   Analyze
                                           │                   Generate
                                           │                   Reply
                                           │   ◄──────────────
                                           │
                                           ├─► Save AI Message
                                           │
                                      ◄────┤ {
                                             conversationId: "conv_123",
                                             reply: "Dựa trên..."
                                           }

state: {
  conversationId: "conv_123"          4. Display Phase
  messages: [                            Update UI with:
    {                                    - User message bubble
      role: "user",                      - AI response bubble
      text: "...",                       - Images inline
      imageUrls: [...]
    },
    {
      role: "assistant",
      text: "Dựa trên..."
    }
  ]
}
```

---

## 🔌 API CONTRACT

### Request/Response Schemas

#### Upload API

```typescript
// Request
Content-Type: multipart/form-data
FormData {
  images: File[]  // 1-5 files, ≤10MB each
}

// Response Success
Status: 200 OK
{
  urls: string[]  // Array of public URLs
}

// Response Error
Status: 400 Bad Request
{
  error: string,
  message: string  // Vietnamese error message
}
```

#### Chat API

```typescript
// Request
Content-Type: application/json
{
  conversationId?: string | null,  // null for new conversation
  userText: string,                // Required, formatted text
  imageUrls: string[],            // URLs from upload endpoint
  createIfMissing?: boolean       // Auto-create conversation
}

// Response Success
Status: 200 OK
{
  conversationId: string,  // UUID or unique string
  reply: string           // AI response in Vietnamese
}

// Response Errors
Status: 400 - Invalid input
Status: 401 - Unauthorized (no token)
Status: 404 - Conversation not found
Status: 429 - Rate limit exceeded
Status: 500 - Server/AI error
```

---

## 🎯 INTEGRATION POINTS

### 1. Frontend → Backend

- **Base URL**: `https://my-pet-api.onrender.com`
- **Auth Header**: `Authorization: Bearer <token>`
- **Endpoints**:
  - `/api/upload` (POST)
  - `/api/chat` (POST)

### 2. Backend → Gemini AI

- **Library**: `@google/generative-ai`
- **Model**: `gemini-1.5-pro` or `gemini-1.5-flash`
- **Features Used**:
  - Text generation
  - Vision (image analysis)
  - Multi-turn conversation

### 3. Backend → Database

- **MongoDB** với Mongoose
- **Collections**:
  - `conversations` - Conversation metadata
  - `messages` - Chat history
  - `users` - User authentication

### 4. Backend → Storage

- **Option 1**: Local filesystem + Static serve
- **Option 2**: AWS S3 / Cloudinary / Google Cloud Storage

---

## 📈 SCALABILITY CONSIDERATIONS

### Current Design (MVP)

- Single server
- Local file storage
- Rate limiting: 10 requests/5min per user

### Future Enhancements

- Load balancer for multiple servers
- Cloud storage (S3) for images
- Redis for session/rate limiting
- WebSocket for real-time updates
- Conversation archiving for old chats
- Analytics dashboard for admin
- Cost optimization (use cheaper AI models for simple queries)

---

## 🔒 SECURITY MEASURES

1. **Authentication**: JWT tokens required for all endpoints
2. **File Validation**:
   - Type checking (images only)
   - Size limit (10MB)
   - Quantity limit (5 files)
3. **Rate Limiting**: Prevent abuse
4. **Input Sanitization**: Prevent injection attacks
5. **CORS**: Whitelist frontend domain
6. **HTTPS**: Encrypt data in transit
7. **Environment Variables**: Never expose API keys

---

## 📊 MONITORING & LOGGING

### Metrics to Track

- API response times
- Gemini AI token usage (cost)
- Error rates by endpoint
- Conversation completion rate
- Average messages per conversation

### Logging Points

- All API requests/responses
- Gemini AI calls (for debugging)
- Upload operations
- Database operations
- Error stack traces

---

## 💰 COST ESTIMATION

### Gemini API (Free Tier)

- 15 requests/minute
- 1500 requests/day
- $0 for development

### Gemini API (Paid)

- $0.00025 per 1K characters (input)
- $0.001 per 1K characters (output)
- ~$1-5/month for moderate usage

### Storage

- Local: Free
- AWS S3: ~$0.023/GB/month
- Cloudinary: Free tier 25GB

### Server

- Local: Free
- VPS: $5-10/month
- Cloud (AWS/GCP): $10-50/month

---

## ✅ TESTING STRATEGY

### Unit Tests

- File upload validation
- Text formatting utility
- Database operations

### Integration Tests

- Upload endpoint with mock files
- Chat endpoint with mock AI
- Authentication middleware

### End-to-End Tests

- Complete user flow
- Error handling scenarios
- Rate limiting behavior

### Manual Tests

- Upload different file types/sizes
- Chat with real images
- Test conversation continuity
- Check error messages

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Setup MongoDB cluster
- [ ] Get Gemini API key
- [ ] Configure environment variables
- [ ] Setup file storage (local/cloud)
- [ ] Deploy backend server
- [ ] Configure CORS for frontend domain
- [ ] Setup SSL certificate (HTTPS)
- [ ] Test all endpoints
- [ ] Monitor logs for errors
- [ ] Setup backup strategy

---

## 📚 DOCUMENTATION LINKS

- **Full Prompt**: `BACKEND_DOCTORAI_PROMPT.md`
- **Quick Start**: `BACKEND_DOCTORAI_QUICKSTART.md`
- **This Architecture**: `DOCTORAI_ARCHITECTURE.md`
- **Frontend README**: `src/features/doctor-ai/README.md`

---

**FRONTEND ✅ COMPLETE | BACKEND ❌ PENDING | INTEGRATION 🔜 READY**
