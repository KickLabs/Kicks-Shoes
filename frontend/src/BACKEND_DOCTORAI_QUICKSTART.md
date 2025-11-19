# 🚀 DOCTOR AI BACKEND - QUICK START GUIDE

## TL;DR - Cần implement gì?

### 2 Endpoints:

1. `POST /api/upload` - Upload ảnh thú cưng
2. `POST /api/chat` - Chat với AI Doctor (Gemini)

---

## 📋 QUICK REFERENCE

### 1. Upload Endpoint

```javascript
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

// Request
FormData { images: File[] }

// Response
{ "urls": ["url1", "url2", ...] }
```

### 2. Chat Endpoint

```javascript
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

// Request
{
  "conversationId": null,          // null = new conversation
  "userText": "[MÔ TẢ CA BỆNH]...",
  "imageUrls": ["url1", "url2"],
  "createIfMissing": true
}

// Response
{
  "conversationId": "conv_123",
  "reply": "AI response text..."
}
```

---

## 🔥 COPY-PASTE CODE

### Setup Dependencies

```bash
npm install @google/generative-ai express multer express-rate-limit jsonwebtoken mongoose dotenv
```

### .env File

```env
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/mypet
PORT=5000
```

### Gemini Service (services/gemini.service.js)

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `Bạn là BÁC SĨ THÚ Y AI chuyên nghiệp tại MyPet Clinic.
Phân tích triệu chứng, đánh giá mức độ khẩn cấp, đưa ra tư vấn.
Luôn khuyến nghị đi khám nếu nghiêm trọng.`;

async function chatWithGemini({ userText, imageUrls }) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const parts = [{ text: SYSTEM_PROMPT + '\n\n' + userText }];

  // Add images if provided
  for (const url of imageUrls || []) {
    const imageData = await fetchImageAsBase64(url);
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData,
      },
    });
  }

  const result = await model.generateContent(parts);
  return result.response.text();
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

module.exports = { chatWithGemini };
```

### Upload Controller (controllers/upload.controller.js)

```javascript
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'Vui lòng chọn ít nhất một ảnh',
      });
    }

    const urls = req.files.map(
      file => `${req.protocol}://${req.get('host')}/uploads/doctor-ai/${file.filename}`
    );

    res.json({ urls });
  } catch (error) {
    res.status(500).json({
      message: 'Không thể tải ảnh lên',
    });
  }
};
```

### Chat Controller (controllers/chat.controller.js)

```javascript
const { chatWithGemini } = require('../services/gemini.service');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');

exports.chat = async (req, res) => {
  try {
    const { conversationId, userText, imageUrls, createIfMissing } = req.body;
    const userId = req.userId;

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ conversationId, userId });
    }

    if (!conversation && createIfMissing) {
      conversation = await Conversation.create({
        conversationId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
        status: 'active',
      });
    }

    if (!conversation) {
      return res.status(404).json({
        message: 'Không tìm thấy cuộc trò chuyện',
      });
    }

    // Save user message
    await Message.create({
      conversationId: conversation.conversationId,
      userId,
      role: 'user',
      content: { text: userText, imageUrls },
      timestamp: new Date(),
    });

    // Get AI response
    const reply = await chatWithGemini({ userText, imageUrls });

    // Save AI response
    await Message.create({
      conversationId: conversation.conversationId,
      userId,
      role: 'assistant',
      content: { text: reply },
      timestamp: new Date(),
    });

    res.json({
      conversationId: conversation.conversationId,
      reply,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      message: 'Có lỗi xảy ra khi xử lý tin nhắn',
    });
  }
};
```

### Routes (routes/doctorAI.routes.js)

```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateUser } = require('../middleware/auth');
const { uploadImages } = require('../controllers/upload.controller');
const { chat } = require('../controllers/chat.controller');

// Configure multer
const storage = multer.diskStorage({
  destination: 'uploads/doctor-ai/',
  filename: (req, file, cb) => {
    cb(null, `pet-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'));
    }
  },
});

// Routes
router.post('/upload', authenticateUser, upload.array('images', 5), uploadImages);
router.post('/chat', authenticateUser, chat);

module.exports = router;
```

### Models

**Conversation Model (models/conversation.model.js)**

```javascript
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
});

module.exports = mongoose.model('Conversation', conversationSchema);
```

**Message Model (models/message.model.js)**

```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: {
    text: String,
    imageUrls: [String],
  },
  timestamp: { type: Date, default: Date.now },
  aiModel: String,
  tokensUsed: Number,
});

module.exports = mongoose.model('Message', messageSchema);
```

### Main App Setup (app.js)

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Routes
const doctorAIRoutes = require('./routes/doctorAI.routes');
app.use('/api', doctorAIRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🧪 TEST

### Test Upload

```bash
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "images=@pet.jpg"
```

### Test Chat

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": null,
    "userText": "[MÔ TẢ CA BỆNH]\nChó Alaska, 3 tuổi. Nôn mửa.\n\n[CÂU HỎI]\nCó nguy hiểm không?",
    "imageUrls": ["http://localhost:5000/uploads/doctor-ai/pet-123.jpg"],
    "createIfMissing": true
  }'
```

---

## 📝 CHECKLIST

- [ ] Install dependencies
- [ ] Setup `.env` với Gemini API key
- [ ] Create `uploads/doctor-ai/` folder
- [ ] Copy models, controllers, routes
- [ ] Setup main app.js
- [ ] Test upload endpoint
- [ ] Test chat endpoint
- [ ] Integrate với frontend

---

## ⚡ ONE-LINE DEPLOY

```bash
# Clone, install, setup
npm install && mkdir -p uploads/doctor-ai && echo "GEMINI_API_KEY=your_key\nJWT_SECRET=secret\nMONGODB_URI=mongodb://localhost:27017/mypet" > .env && npm start
```

---

## 🔗 Next Steps

1. Get Gemini API key: https://aistudio.google.com/app/apikey
2. Copy code above
3. Test với frontend đã có sẵn
4. Done! ✅

**Frontend ĐÃ SẴN SÀNG - CHỈ CẦN BACKEND MAPPING ĐÚNG!**
