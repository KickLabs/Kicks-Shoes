import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import logger from '../utils/logger.js';

cloudinary.config({
  cloud_name: "",
  api_key: "",
  api_secret: ""
});

// Cấu hình storage cho multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kicks-shoes/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    format: 'jpg',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: true,
    secure: true
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

// Middleware để log kết quả upload
const handleUpload = (req, res, next) => {
  if (!req.file) {
    logger.info('No file uploaded');
    return next();
  }

  // Đảm bảo URL là HTTPS
  if (req.file.path && !req.file.path.startsWith('https://')) {
    req.file.path = req.file.path.replace('http://', 'https://');
  }

  logger.info('File upload result:', {
    originalname: req.file.originalname,
    path: req.file.path
  });

  next();
};

export { cloudinary, storage, handleUpload }; 