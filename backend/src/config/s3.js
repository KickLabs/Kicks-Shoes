import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import path from 'path';

dotenv.config();

/**
 * AWS S3 Configuration for file uploads
 * Supports both IAM role (EC2/Lambda) and explicit credentials
 */

const getS3Config = () => {
  const config = {
    region: process.env.AWS_REGION || 'ap-southeast-1',
  };

  // Use explicit credentials if provided
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }
  // Otherwise, SDK will use IAM role automatically

  return config;
};

// Create S3 client
const s3Client = new S3Client(getS3Config());

// S3 bucket name from environment
export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'kicks-shoes-uploads';

// S3 folders structure
export const S3_FOLDERS = {
  AVATARS: 'avatars',
  PRODUCTS: 'products',
  DELIVERY_PROOFS: 'delivery-proofs',
  BLOGS: 'blogs',
  TEMP: 'temp',
};

/**
 * Generate unique filename
 */
const generateFileName = (originalName, folder = '') => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const uniqueId = nanoid(10);
  const fileName = `${timestamp}-${uniqueId}${ext}`;
  return folder ? `${folder}/${fileName}` : fileName;
};

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @param {string} folder - S3 folder (optional)
 * @returns {Promise<{url: string, key: string}>}
 */
export const uploadToS3 = async (fileBuffer, originalName, mimetype, folder = '') => {
  try {
    const key = generateFileName(originalName, folder);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
        // Make files publicly readable (optional - remove if using CloudFront)
        // ACL: 'public-read',
      },
    });

    await upload.done();

    // Generate URL
    const url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`;

    return { url, key };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 */
export const deleteFromS3 = async key => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for temporary access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration in seconds (default: 1 hour)
 */
export const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('S3 Presigned URL Error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Test S3 connection
 */
export const testS3Connection = async () => {
  try {
    const { HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const command = new HeadBucketCommand({ Bucket: S3_BUCKET });
    await s3Client.send(command);
    console.log(`S3 Connected Successfully - Bucket: ${S3_BUCKET}`);
    return true;
  } catch (error) {
    console.error('S3 Connection Error:', error.message);
    return false;
  }
};

export { s3Client };
export default s3Client;
