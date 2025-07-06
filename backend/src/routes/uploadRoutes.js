import express from 'express';
import upload from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  // Multer + Cloudinary đã gán URL vào req.file.path
  res.json({ url: req.file.path });
});

export default router;
