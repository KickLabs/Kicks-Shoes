import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import logger from '../utils/logger.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for multer
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
    secure: true,
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  },
});

// Configure storage for delivery proof images
const deliveryProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kicks-shoes/delivery-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    format: 'jpg',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    secure: true,
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'proof-' + uniqueSuffix);
  },
});

// Configure storage for delivery proof images
const deliveryProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kicks-shoes/delivery-proofs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    format: 'jpg',
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    secure: true,
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'proof-' + uniqueSuffix);
  },
});

// Middleware to log upload results
const handleUpload = (req, res, next) => {
  // Handle single file upload (req.file)
  if (req.file) {
    // Ensure URL is HTTPS
    if (req.file.path && !req.file.path.startsWith('https://')) {
      req.file.path = req.file.path.replace('http://', 'https://');
    }

    logger.info('File upload result:', {
      originalname: req.file.originalname,
      path: req.file.path,
    });
  }

  // Handle multiple file uploads (req.files)
  if (req.files) {
    Object.keys(req.files).forEach(fieldName => {
      const files = req.files[fieldName];
      files.forEach(file => {
        // Ensure URL is HTTPS
        if (file.path && !file.path.startsWith('https://')) {
          file.path = file.path.replace('http://', 'https://');
        }

        logger.info('File upload result:', {
          fieldName,
          originalname: file.originalname,
          path: file.path,
        });
      });
    });
  }

  if (!req.file && !req.files) {
    logger.info('No file uploaded');
  }

  next();
};

export { cloudinary, storage, deliveryProofStorage, handleUpload };
