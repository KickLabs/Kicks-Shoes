# 🔧 FIX BACKEND: Xử lý keepImages khi update post

## ❌ Vấn đề hiện tại:

Frontend gửi lên:

```json
{
  "content": "Hoàng hôn buông xuống anh chỉ nhớ đến em",
  "keepImages": ["https://res.cloudinary.com/dgyb5zpqr/image/upload/.../owxdcmrrxdvsh2ckh5uj.jpg"],
  "address": "Đà Nẵng, Việt Nam",
  "tags": []
}
```

Backend trả về:

```json
{
  "images": [] // ❌ Sai! Phải giữ lại ảnh trong keepImages
}
```

---

## ✅ Giải pháp: Sửa backend controller

### File: `backend/controllers/postController.js` (hoặc tương tự)

Tìm hàm `updatePost` và sửa như sau:

```javascript
// ❌ TRƯỚC (SAI):
exports.updatePost = async (req, res) => {
  try {
    const { content, tags, address } = req.body;

    // Upload ảnh mới (nếu có)
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      newImageUrls = req.files.map(file => file.path); // Cloudinary URLs
    }

    // ❌ BUG: Ghi đè trực tiếp, mất ảnh cũ!
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        content,
        tags,
        address,
        images: newImageUrls, // ❌ Chỉ có ảnh mới, mất ảnh cũ!
      },
      { new: true }
    ).populate('author', 'username avatar');

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

```javascript
// ✅ SAU (ĐÚNG):
exports.updatePost = async (req, res) => {
  try {
    const { content, tags, address, keepImages } = req.body;

    console.log('=== updatePost controller ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('keepImages received:', keepImages);

    // ✅ Bước 1: Parse keepImages từ JSON string (nếu gửi từ FormData)
    let imagesToKeep = [];
    if (keepImages) {
      if (typeof keepImages === 'string') {
        try {
          imagesToKeep = JSON.parse(keepImages);
        } catch (e) {
          imagesToKeep = [keepImages]; // Nếu chỉ là 1 URL string
        }
      } else if (Array.isArray(keepImages)) {
        imagesToKeep = keepImages;
      }
    }

    console.log('Parsed imagesToKeep:', imagesToKeep);

    // ✅ Bước 2: Upload ảnh mới lên Cloudinary (nếu có)
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      newImageUrls = req.files.map(file => file.path);
    }

    console.log('New images uploaded:', newImageUrls);

    // ✅ Bước 3: MERGE: imagesToKeep + newImageUrls
    const finalImages = [...imagesToKeep, ...newImageUrls];

    console.log('Final images to save:', finalImages);
    console.log('  - Kept from old:', imagesToKeep.length);
    console.log('  - Newly uploaded:', newImageUrls.length);
    console.log('  - Total:', finalImages.length);

    // ✅ Bước 4: Update post với mảng ảnh đã merge
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        content,
        tags: tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [],
        address,
        images: finalImages, // ✅ Merge ảnh cũ + ảnh mới
      },
      { new: true }
    ).populate('author', 'username avatar');

    console.log('Updated post images:', updatedPost.images);
    console.log('=============================');

    res.json(updatedPost);
  } catch (error) {
    console.error('updatePost error:', error);
    res.status(500).json({ message: error.message });
  }
};
```

---

## 📝 Những điểm quan trọng:

### 1. **Parse `keepImages` từ request body**

Vì có thể gửi dưới dạng:

- JSON body: `keepImages: ["url1", "url2"]` (array)
- FormData: `keepImages: '["url1", "url2"]'` (JSON string)

→ Cần parse bằng `JSON.parse()` nếu là string

### 2. **MERGE thay vì GHI ĐÈ**

```javascript
// ❌ SAI: Chỉ lưu ảnh mới
images: newImageUrls;

// ✅ ĐÚNG: Merge ảnh cũ (giữ lại) + ảnh mới (upload)
images: [...imagesToKeep, ...newImageUrls];
```

### 3. **Thứ tự ảnh**

- `imagesToKeep` (ảnh cũ) đặt trước
- `newImageUrls` (ảnh mới) đặt sau
- Frontend sẽ hiển thị ảnh theo thứ tự này

---

## 🧪 Test sau khi sửa:

### Test case 1: Xóa 1 ảnh (giữ 2 ảnh còn lại)

**Request:**

```json
{
  "content": "...",
  "keepImages": ["url1", "url2"]
}
```

**Expected response:**

```json
{
  "images": ["url1", "url2"] // ✅ Giữ đúng 2 ảnh
}
```

### Test case 2: Xóa 2 ảnh, thêm 1 ảnh mới

**Request:**

```json
{
  "content": "...",
  "keepImages": ["url1"],
  "files": [File]  // 1 ảnh mới
}
```

**Expected response:**

```json
{
  "images": ["url1", "newUrl"] // ✅ 1 ảnh cũ + 1 ảnh mới
}
```

### Test case 3: Xóa hết, thêm 2 ảnh mới

**Request:**

```json
{
  "content": "...",
  "keepImages": [],
  "files": [File, File]  // 2 ảnh mới
}
```

**Expected response:**

```json
{
  "images": ["newUrl1", "newUrl2"] // ✅ Chỉ có ảnh mới
}
```

---

## 🚀 Triển khai:

1. **Sao chép code trên vào backend controller**
2. **Restart backend server**
3. **Test lại trên frontend** (không cần thay đổi gì)
4. **Kiểm tra console log** ở cả frontend và backend

---

## 🔍 Debug backend (nếu vẫn lỗi):

Thêm log này vào đầu hàm `updatePost`:

```javascript
console.log('====================');
console.log('UPDATE POST DEBUG:');
console.log('req.params.id:', req.params.id);
console.log('req.body:', JSON.stringify(req.body, null, 2));
console.log('req.files:', req.files);
console.log('====================');
```

Sau đó gửi log backend cho tôi để debug tiếp!
