# 🩺 BACKEND AI PROMPT - DOCTOR AI FEATURE

## 🎯 MỤC TIÊU

Xây dựng backend API cho feature **DoctorAI** - tư vấn thú y tự động bằng AI (Google Gemini). Frontend đã hoàn thiện và cần backend mapping chính xác.

---

## 📋 TỔNG QUAN NGHIỆP VỤ

### User Flow:

1. User upload **tối đa 5 ảnh** (JPG/PNG/PDF, ≤10MB mỗi file)
2. User nhập **mô tả ca bệnh** (giống/tuổi/cân nặng/triệu chứng)
3. User nhập **câu hỏi** cụ thể cho AI bác sĩ
4. Backend:
   - Upload ảnh lên cloud/local storage
   - Gửi ảnh + mô tả + câu hỏi tới Gemini AI
   - Gemini phân tích và trả lời
   - Lưu conversation history
5. Frontend hiển thị câu trả lời của AI

### Đặc điểm:

- ✅ **Conversation-based**: Mỗi cuộc trò chuyện có `conversationId` để maintain context
- ✅ **Image Analysis**: Gemini Vision API để phân tích ảnh thú cưng
- ✅ **Persistent History**: Lưu lịch sử chat để user có thể tiếp tục
- ✅ **Authentication Required**: Chỉ user đã login mới sử dụng

---

## 🛣️ API ENDPOINTS CẦN XÂY DỰNG

### 1. **Upload Images API**

```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**

```javascript
FormData {
  images: File[]  // Key là 'images', có thể upload nhiều files
}
```

**Response (Success - 200):**

```json
{
  "urls": [
    "https://storage.example.com/uploads/abc123.jpg",
    "https://storage.example.com/uploads/def456.jpg",
    "https://storage.example.com/uploads/ghi789.jpg"
  ]
}
```

**Response (Error - 400):**

```json
{
  "error": "File size exceeds 10MB limit",
  "message": "Kích thước file vượt quá 10MB"
}
```

**Response (Error - 401):**

```json
{
  "error": "Unauthorized",
  "message": "Bạn cần đăng nhập để sử dụng dịch vụ này"
}
```

**Response (Error - 413):**

```json
{
  "error": "Payload too large",
  "message": "Chỉ được upload tối đa 5 ảnh"
}
```

---

### 2. **Chat with AI Doctor API**

```http
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```typescript
{
  conversationId?: string | null,  // null = tạo conversation mới
  userText: string,                // Tin nhắn đã được format sẵn
  imageUrls: string[],            // URLs từ upload endpoint
  createIfMissing?: boolean       // true = tự động tạo conversation mới
}
```

**Ví dụ Request:**

```json
{
  "conversationId": null,
  "userText": "[MÔ TẢ CA BỆNH]\nChó Alaska, 3 tuổi, 35kg. Bị nôn mửa từ sáng nay, ăn xương gà tối qua.\n\n[CÂU HỎI]\nCho bé có nguy hiểm không? Cần đi khám ngay không?",
  "imageUrls": [
    "https://storage.example.com/uploads/abc123.jpg",
    "https://storage.example.com/uploads/def456.jpg"
  ],
  "createIfMissing": true
}
```

**Response (Success - 200):**

```json
{
  "conversationId": "conv_1234567890",
  "reply": "Dựa trên mô tả và hình ảnh bạn cung cấp, tình trạng của bé có thể do:\n\n1. **Viêm dạ dày ruột cấp**: Do xương gà có thể gây tổn thương niêm mạc dạ dày\n2. **Tắc nghẽn đường tiêu hóa**: Mảnh xương sắc nhọn có thể gây tắc\n\n⚠️ **KHUYẾN NGHỊ KHẨN CẤP**:\n- Đưa bé đến phòng khám ngay lập tức\n- Không cho ăn uống gì thêm\n- Chụp X-quang để kiểm tra tắc nghẽn\n\nĐây là tình trạng CẦN CAN THIỆP SỚM. Vui lòng liên hệ bác sĩ ngay."
}
```

**Response (Error - 400):**

```json
{
  "error": "Invalid request",
  "message": "Thiếu thông tin userText hoặc imageUrls"
}
```

**Response (Error - 401):**

```json
{
  "error": "Unauthorized",
  "message": "Bạn cần đăng nhập để sử dụng DoctorAI"
}
```

**Response (Error - 404):**

```json
{
  "error": "Conversation not found",
  "message": "Không tìm thấy cuộc trò chuyện. Vui lòng tạo cuộc trò chuyện mới."
}
```

**Response (Error - 429):**

```json
{
  "error": "Rate limit exceeded",
  "message": "Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 5 phút."
}
```

**Response (Error - 500):**

```json
{
  "error": "AI service error",
  "message": "Có lỗi xảy ra khi kết nối với dịch vụ AI. Vui lòng thử lại sau."
}
```

---

## 📊 DATABASE SCHEMA

### 1. **Conversations Collection/Table**

```javascript
{
  _id: ObjectId,                    // MongoDB ID
  conversationId: String,           // UUID hoặc unique string
  userId: ObjectId,                 // Reference to User
  petInfo: {                        // Optional: thông tin thú cưng
    species: String,                // "dog", "cat", "bird", etc.
    breed: String,                  // "Alaska", "Golden Retriever", etc.
    age: Number,
    weight: Number
  },
  createdAt: Date,
  updatedAt: Date,
  lastActivityAt: Date,
  status: String                    // "active", "closed"
}
```

### 2. **Messages Collection/Table**

```javascript
{
  _id: ObjectId,
  conversationId: String,           // Foreign key to Conversations
  userId: ObjectId,                 // Reference to User
  role: String,                     // "user" | "assistant"
  content: {
    text: String,                   // Nội dung tin nhắn
    imageUrls: [String],           // URLs của ảnh (nếu có)
    metadata: {                     // Metadata cho phân tích
      petSpecies: String,
      symptoms: [String],
      urgencyLevel: String         // "low", "medium", "high", "emergency"
    }
  },
  timestamp: Date,
  aiModel: String,                  // "gemini-1.5-pro" hoặc version AI
  tokensUsed: Number,              // Tracking cost
  processingTime: Number           // Milliseconds
}
```

---

## 🤖 GOOGLE GEMINI INTEGRATION

### Setup Gemini API:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro', // hoặc gemini-1.5-flash cho nhanh hơn
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  },
});
```

### System Prompt cho DoctorAI:

```javascript
const SYSTEM_PROMPT = `Bạn là một BÁC SĨ THÚ Y AI chuyên nghiệp tại phòng khám MyPet Clinic.

🎯 VAI TRÒ CỦA BẠN:
- Phân tích triệu chứng và hình ảnh thú cưng
- Đưa ra tư vấn chuyên môn dựa trên thông tin được cung cấp
- Đánh giá mức độ khẩn cấp: LOW (theo dõi), MEDIUM (khám trong 1-2 ngày), HIGH (khám trong ngày), EMERGENCY (khám ngay lập tức)
- Luôn khuyến khích chủ nhân đến phòng khám nếu có dấu hiệu nghiêm trọng

⚠️ NGUYÊN TẮC QUAN TRỌNG:
1. Không thay thế cho khám trực tiếp - chỉ tư vấn sơ bộ
2. Nếu tình trạng nghiêm trọng, PHẢI khuyến nghị đi khám ngay
3. Không kê đơn thuốc cụ thể - chỉ tư vấn hướng xử lý
4. Luôn thân thiện, dễ hiểu, tránh thuật ngữ phức tạp
5. Nếu không chắc chắn, khuyên chủ nhân đến gặp bác sĩ

📋 ĐỊNH DẠNG TRẢ LỜI:
- Phân tích tình trạng
- Nguyên nhân có thể
- Mức độ khẩn cấp
- Khuyến nghị xử lý
- Lưu ý đặc biệt (nếu có)

🐾 LOẠI THÚ CƯNG PHỤC VỤ:
Chó, mèo, chim, thỏ, hamster, bò sát và các động vật cảnh phổ biến.`;
```

### Chat Function với Gemini:

```javascript
async function chatWithGemini({ userText, imageUrls, conversationHistory }) {
  try {
    // Prepare conversation context
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content.text }],
    }));

    // Prepare current message parts
    const parts = [{ text: SYSTEM_PROMPT + '\n\n' + userText }];

    // Add images if provided
    if (imageUrls && imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        // Download image and convert to base64
        const imageData = await downloadImageAsBase64(imageUrl);
        parts.push({
          inlineData: {
            mimeType: getMimeType(imageUrl),
            data: imageData,
          },
        });
      }
    }

    // Start chat session with history
    const chat = model.startChat({
      history: history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    // Send message
    const result = await chat.sendMessage(parts);
    const response = await result.response;
    const reply = response.text();

    return {
      reply,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0,
      model: 'gemini-1.5-pro',
    };
  } catch (error) {
    console.error('[Gemini AI Error]:', error);
    throw new Error('Không thể kết nối với dịch vụ AI. Vui lòng thử lại sau.');
  }
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Middleware:

```javascript
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Bạn cần đăng nhập để sử dụng dịch vụ này',
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.user = await User.findById(decoded.userId);

    if (!req.user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Tài khoản không tồn tại',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  }
};
```

---

## 📁 FILE UPLOAD HANDLING

### Multer Configuration:

```javascript
const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/doctor-ai/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file JPG, PNG, WEBP hoặc PDF'));
  }
};

// Upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5, // Tối đa 5 files
  },
});

module.exports = upload;
```

### Upload Endpoint:

```javascript
router.post('/api/upload', authenticateUser, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Vui lòng chọn ít nhất một ảnh',
      });
    }

    // Generate URLs for uploaded files
    const urls = req.files.map(file => {
      // Option 1: Local URL
      return `${req.protocol}://${req.get('host')}/uploads/doctor-ai/${file.filename}`;

      // Option 2: Cloud Storage URL (nếu dùng AWS S3, Cloudinary, etc.)
      // return uploadToCloudStorage(file);
    });

    res.json({ urls });
  } catch (error) {
    console.error('[Upload Error]:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message || 'Không thể tải ảnh lên. Vui lòng thử lại.',
    });
  }
});
```

---

## 🛡️ RATE LIMITING

```javascript
const rateLimit = require('express-rate-limit');

// Rate limiter for chat endpoint
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 requests per 5 minutes
  message: {
    error: 'Rate limit exceeded',
    message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau 5 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Sử dụng userId để track
  keyGenerator: req => req.userId || req.ip,
});

// Rate limiter for upload endpoint
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Max 20 uploads per 15 minutes
  message: {
    error: 'Upload rate limit exceeded',
    message: 'Bạn đã tải quá nhiều ảnh. Vui lòng thử lại sau.',
  },
});

// Apply to routes
router.post('/api/chat', authenticateUser, chatLimiter, handleChat);
router.post(
  '/api/upload',
  authenticateUser,
  uploadLimiter,
  upload.array('images', 5),
  handleUpload
);
```

---

## 🔄 CHAT ENDPOINT IMPLEMENTATION

```javascript
router.post('/api/chat', authenticateUser, chatLimiter, async (req, res) => {
  try {
    const { conversationId, userText, imageUrls, createIfMissing } = req.body;
    const userId = req.userId;

    // Validate input
    if (!userText || typeof userText !== 'string') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Vui lòng nhập nội dung tin nhắn',
      });
    }

    let conversation;

    // Find or create conversation
    if (conversationId) {
      conversation = await Conversation.findOne({
        conversationId,
        userId,
      });

      if (!conversation && !createIfMissing) {
        return res.status(404).json({
          error: 'Conversation not found',
          message: 'Không tìm thấy cuộc trò chuyện',
        });
      }
    }

    if (!conversation || createIfMissing) {
      // Create new conversation
      conversation = await Conversation.create({
        conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        status: 'active',
      });
    }

    // Save user message
    const userMessage = await Message.create({
      conversationId: conversation.conversationId,
      userId: userId,
      role: 'user',
      content: {
        text: userText,
        imageUrls: imageUrls || [],
      },
      timestamp: new Date(),
    });

    // Get conversation history (last 10 messages for context)
    const conversationHistory = await Message.find({
      conversationId: conversation.conversationId,
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Reverse to get chronological order
    conversationHistory.reverse();

    // Call Gemini AI
    const startTime = Date.now();
    const aiResponse = await chatWithGemini({
      userText,
      imageUrls: imageUrls || [],
      conversationHistory,
    });
    const processingTime = Date.now() - startTime;

    // Save AI response
    await Message.create({
      conversationId: conversation.conversationId,
      userId: userId,
      role: 'assistant',
      content: {
        text: aiResponse.reply,
        imageUrls: [],
      },
      timestamp: new Date(),
      aiModel: aiResponse.model,
      tokensUsed: aiResponse.tokensUsed,
      processingTime,
    });

    // Update conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastActivityAt: new Date(),
    });

    // Return response
    res.json({
      conversationId: conversation.conversationId,
      reply: aiResponse.reply,
    });
  } catch (error) {
    console.error('[Chat Error]:', error);

    if (error.message.includes('AI')) {
      return res.status(500).json({
        error: 'AI service error',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
    });
  }
});
```

---

## 📝 ROUTES STRUCTURE

```javascript
// routes/doctorAI.routes.js
const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { chatLimiter, uploadLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const { handleUpload, handleChat } = require('../controllers/doctorAI.controller');

// Upload images
router.post('/upload', authenticateUser, uploadLimiter, upload.array('images', 5), handleUpload);

// Chat with AI Doctor
router.post('/chat', authenticateUser, chatLimiter, handleChat);

module.exports = router;
```

```javascript
// app.js hoặc server.js
const doctorAIRoutes = require('./routes/doctorAI.routes');

app.use('/api', doctorAIRoutes);

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));
```

---

## 🧪 TESTING

### Test Upload Endpoint:

```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@pet1.jpg" \
  -F "images=@pet2.jpg"
```

### Test Chat Endpoint:

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": null,
    "userText": "[MÔ TẢ CA BỆNH]\nChó Alaska, 3 tuổi, 35kg. Nôn mửa.\n\n[CÂU HỎI]\nCó nguy hiểm không?",
    "imageUrls": ["http://localhost:5000/uploads/doctor-ai/pet-123.jpg"],
    "createIfMissing": true
  }'
```

---

## 🔧 ENVIRONMENT VARIABLES

```env
# .env file
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/mypet-clinic
PORT=5000

# File upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
MAX_FILES=5

# Rate limiting
CHAT_RATE_LIMIT_WINDOW=300000  # 5 minutes in ms
CHAT_RATE_LIMIT_MAX=10
UPLOAD_RATE_LIMIT_WINDOW=900000  # 15 minutes
UPLOAD_RATE_LIMIT_MAX=20

# Cloud storage (optional)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=mypet-doctor-ai
CLOUDINARY_URL=cloudinary://...
```

---

## ✅ CHECKLIST IMPLEMENTATION

- [ ] Setup Gemini AI với API key
- [ ] Tạo database schema (Conversations & Messages)
- [ ] Implement authentication middleware
- [ ] Setup multer cho file upload
- [ ] Tạo `/api/upload` endpoint
- [ ] Tạo `/api/chat` endpoint với Gemini integration
- [ ] Implement rate limiting
- [ ] Add error handling đầy đủ
- [ ] Test với frontend
- [ ] Deploy và configure cloud storage (optional)
- [ ] Monitor API usage và cost
- [ ] Add logging cho debugging

---

## 🎨 FRONTEND INTEGRATION

Frontend đã SẴN SÀNG và chỉ cần backend mapping đúng:

### Frontend Flow:

1. User upload files → Call `POST /api/upload` → Nhận `urls[]`
2. User nhập mô tả + câu hỏi → Format thành `userText`
3. Click "Gửi" → Call `POST /api/chat` với:
   - `conversationId` (null lần đầu)
   - `userText` (đã format)
   - `imageUrls` (từ step 1)
   - `createIfMissing: true`
4. Backend trả về `{ conversationId, reply }`
5. Frontend hiển thị reply và lưu `conversationId` cho lần sau

### Data Format Example:

```javascript
// Frontend gửi đi
{
  conversationId: null,  // hoặc "conv_123" nếu tiếp tục chat
  userText: "[MÔ TẢ CA BỆNH]\nChó Alaska, 3 tuổi, 35kg. Nôn mửa từ sáng.\n\n[CÂU HỎI]\nCho bé có nguy hiểm không?",
  imageUrls: [
    "http://localhost:5000/uploads/doctor-ai/pet-1732234567890.jpg"
  ],
  createIfMissing: true
}

// Backend trả về
{
  conversationId: "conv_1732234567890_abc123",
  reply: "Dựa trên mô tả và hình ảnh, tình trạng của bé..."
}
```

---

## 📚 REFERENCES

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Vision API](https://ai.google.dev/tutorials/vision_quickstart)
- [Express Multer](https://github.com/expressjs/multer)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)

---

## 🚀 DEPLOY NOTES

### Backend cần:

1. Node.js server (Express)
2. MongoDB database
3. Gemini API key (free tier có sẵn)
4. Storage cho uploaded files:
   - Local: Dùng `multer` + serve static
   - Cloud: AWS S3, Cloudinary, Google Cloud Storage

### Costs estimate:

- Gemini API: Free tier 15 requests/minute
- Storage: ~$0.023/GB/month (AWS S3)
- Server: Tùy provider

---

## 💡 TÓM TẮT

**Backend cần implement 2 endpoints chính:**

1. **`POST /api/upload`**: Upload images → Trả về URLs
2. **`POST /api/chat`**: Chat với AI → Trả về reply + conversationId

**Tech stack gợi ý:**

- Node.js + Express
- MongoDB (Mongoose)
- Google Gemini AI
- Multer (file upload)
- JWT authentication
- Express Rate Limit

**Frontend ĐÃ HOÀN THÀNH và chỉ cần backend mapping đúng spec này!** ✅
