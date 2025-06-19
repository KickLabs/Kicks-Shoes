import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import logger from "../utils/logger.js";

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
    folder: "kicks-shoes/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
    format: "jpg",
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    overwrite: true,
    secure: true,
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

// Middleware to log upload results
const handleUpload = (req, res, next) => {
  if (!req.file) {
    logger.info("No file uploaded");
    return next();
  }

  // Ensure URL is HTTPS
  if (req.file.path && !req.file.path.startsWith("https://")) {
    req.file.path = req.file.path.replace("http://", "https://");
  }

  logger.info("File upload result:", {
    originalname: req.file.originalname,
    path: req.file.path,
  });

  next();
};

export { cloudinary, storage, handleUpload };
