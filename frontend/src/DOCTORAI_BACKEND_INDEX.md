# 📚 DOCTOR AI BACKEND - DOCUMENTATION INDEX

## 🎯 Bạn cần gì?

### 1️⃣ Tôi muốn hiểu tổng quan hệ thống

👉 Đọc file: **[DOCTORAI_ARCHITECTURE.md](DOCTORAI_ARCHITECTURE.md)**

- Flow diagrams
- Database schema
- System architecture
- Data flow visualization

### 2️⃣ Tôi muốn build backend ngay

👉 Đọc file: **[BACKEND_DOCTORAI_QUICKSTART.md](BACKEND_DOCTORAI_QUICKSTART.md)**

- Copy-paste ready code
- All controllers, models, routes
- Setup instructions
- Testing commands

### 3️⃣ Tôi muốn spec API chi tiết để dùng cho AI

👉 Đọc file: **[BACKEND_DOCTORAI_PROMPT.md](BACKEND_DOCTORAI_PROMPT.md)**

- Complete API specifications
- Request/Response examples
- Error handling
- Gemini AI integration guide
- Database schema
- Security considerations

### 4️⃣ Tôi muốn xem frontend code

👉 Đọc file: **[src/features/doctor-ai/README.md](src/features/doctor-ai/README.md)**

- Frontend structure
- Usage guide
- State management
- API integration points

---

## 📋 TÓM TẮT NHANH

### Frontend (✅ Đã hoàn thành)

```
src/features/doctor-ai/
├── components/          # UI components
├── context/            # State management (React Context)
├── pages/              # Main page
├── services/           # API calls
└── utils/              # Helper functions
```

**Tính năng:**

- ✅ Upload multiple images (max 5)
- ✅ Image preview
- ✅ Description & question input
- ✅ Chat interface with history
- ✅ Persistent conversation
- ✅ Error handling
- ✅ Loading states

### Backend (❌ Cần xây dựng)

**2 Endpoints chính:**

#### 1. Upload Images

```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request: FormData { images: File[] }
Response: { urls: string[] }
```

#### 2. Chat with AI

```http
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

Request: {
  conversationId?: string | null,
  userText: string,
  imageUrls: string[],
  createIfMissing?: boolean
}

Response: {
  conversationId: string,
  reply: string
}
```

---

## 🛠️ TECH STACK

### Frontend (Đã có)

- React 18
- TypeScript
- Context API
- Bootstrap 5
- Axios

### Backend (Cần build)

- Node.js + Express
- MongoDB + Mongoose
- Google Gemini AI
- Multer (file upload)
- JWT authentication
- Express Rate Limit

---

## 🚀 QUICK START (30 phút)

### Step 1: Get API Key

```
1. Truy cập: https://aistudio.google.com/app/apikey
2. Tạo API key miễn phí
3. Copy key
```

### Step 2: Setup Backend

```bash
# Clone/Create project
mkdir doctor-ai-backend
cd doctor-ai-backend
npm init -y

# Install dependencies
npm install express mongoose @google/generative-ai multer jsonwebtoken express-rate-limit dotenv cors

# Create .env
echo "GEMINI_API_KEY=your_key_here" > .env
echo "MONGODB_URI=mongodb://localhost:27017/mypet" >> .env
echo "JWT_SECRET=your_secret" >> .env
```

### Step 3: Copy Code

```
1. Mở file BACKEND_DOCTORAI_QUICKSTART.md
2. Copy toàn bộ code (models, controllers, routes)
3. Paste vào project
4. npm start
```

### Step 4: Test

```bash
# Test upload
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "images=@pet.jpg"

# Test chat
curl -X POST http://localhost:5000/api/chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId":null,"userText":"Chó bị nôn","imageUrls":[],"createIfMissing":true}'
```

---

## 📊 FILE STRUCTURE

```
my-pet-backend/
├── models/
│   ├── conversation.model.js
│   ├── message.model.js
│   └── user.model.js
├── controllers/
│   ├── upload.controller.js
│   └── chat.controller.js
├── services/
│   └── gemini.service.js
├── routes/
│   └── doctorAI.routes.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── uploads/
│   └── doctor-ai/         # Uploaded images
├── .env
├── app.js
└── package.json
```

---

## 🎓 LEARNING PATH

### Beginner → Đọc theo thứ tự:

1. `DOCTORAI_ARCHITECTURE.md` - Hiểu flow
2. `BACKEND_DOCTORAI_QUICKSTART.md` - Copy code
3. Test và debug

### Intermediate → Customize:

1. `BACKEND_DOCTORAI_PROMPT.md` - Hiểu chi tiết
2. Modify theo nhu cầu
3. Add features mới

### Advanced → Optimize:

1. Implement caching (Redis)
2. Cloud storage (S3)
3. WebSocket for real-time
4. Analytics dashboard

---

## 🆘 TROUBLESHOOTING

### Lỗi thường gặp:

#### 1. "Failed to load resource: the server responded with 401"

✅ **Fix**: Check JWT token, đảm bảo Authorization header đúng

#### 2. "Error: Cannot find module '@google/generative-ai'"

✅ **Fix**: `npm install @google/generative-ai`

#### 3. "Gemini API error: API_KEY_INVALID"

✅ **Fix**: Kiểm tra `.env` file, đảm bảo GEMINI_API_KEY đúng

#### 4. "Upload failed: ENOENT: no such file or directory"

✅ **Fix**: Tạo folder: `mkdir -p uploads/doctor-ai`

#### 5. "MongoServerError: connect ECONNREFUSED"

✅ **Fix**: Start MongoDB: `mongod` hoặc check connection string

---

## 📞 SUPPORT

### Các câu hỏi thường gặp:

**Q: Frontend và Backend chạy ở port nào?**
A: Frontend (React): `http://localhost:5173`, Backend: `http://localhost:5000`

**Q: Cần setup CORS không?**
A: Có, thêm trong `app.js`:

```javascript
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);
```

**Q: Gemini API có miễn phí không?**
A: Có free tier: 15 requests/minute, đủ cho development

**Q: Cần MongoDB Atlas hay local?**
A: Cả hai đều được, local nhanh hơn khi dev

**Q: Upload file lưu ở đâu?**
A: Có 2 options:

- Local: `uploads/doctor-ai/` folder
- Cloud: AWS S3, Cloudinary (recommend cho production)

---

## 📈 NEXT STEPS

### Sau khi hoàn thành MVP:

- [ ] Deploy backend lên cloud (Railway, Render, AWS)
- [ ] Setup cloud storage (S3/Cloudinary)
- [ ] Add monitoring (Sentry, Datadog)
- [ ] Implement caching với Redis
- [ ] Add admin dashboard
- [ ] Setup CI/CD pipeline
- [ ] Write tests (Jest/Mocha)
- [ ] Add logging (Winston)
- [ ] Optimize AI prompts
- [ ] Add conversation export

---

## 🎯 SUCCESS CRITERIA

### Backend hoàn thành khi:

- ✅ Upload endpoint working
- ✅ Chat endpoint working
- ✅ Gemini AI integration success
- ✅ Database saving messages
- ✅ Frontend có thể connect
- ✅ Error handling working
- ✅ Authentication working
- ✅ Rate limiting working

---

## 📝 CHECKLIST

```
MVP Phase:
[ ] Setup Node.js project
[ ] Install dependencies
[ ] Get Gemini API key
[ ] Create MongoDB database
[ ] Implement models
[ ] Implement upload controller
[ ] Implement chat controller
[ ] Setup routes
[ ] Add authentication
[ ] Test with Postman
[ ] Connect with frontend
[ ] Fix CORS issues
[ ] Test end-to-end

Production Phase:
[ ] Setup cloud storage
[ ] Deploy to server
[ ] Setup domain & SSL
[ ] Add monitoring
[ ] Setup backups
[ ] Optimize performance
[ ] Add analytics
[ ] Write documentation
```

---

## 📚 FULL DOCUMENTATION

| File                                 | Purpose              | Best For                      |
| ------------------------------------ | -------------------- | ----------------------------- |
| **DOCTORAI_ARCHITECTURE.md**         | System design & flow | Understanding architecture    |
| **BACKEND_DOCTORAI_QUICKSTART.md**   | Copy-paste code      | Quick implementation          |
| **BACKEND_DOCTORAI_PROMPT.md**       | Detailed specs       | AI assistant / Full reference |
| **src/features/doctor-ai/README.md** | Frontend docs        | Frontend understanding        |
| **DOCTORAI_BACKEND_INDEX.md**        | This file            | Navigation                    |

---

## 🎉 READY TO GO!

**Frontend**: ✅ 100% Complete
**Backend**: ❌ 0% Complete
**Documentation**: ✅ 100% Complete

👉 **Bắt đầu từ:** [BACKEND_DOCTORAI_QUICKSTART.md](BACKEND_DOCTORAI_QUICKSTART.md)

**Estimated Time**: 30-60 minutes for MVP
**Difficulty**: ⭐⭐⭐ (Intermediate)

---

💪 **Good luck building!**
