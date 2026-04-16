/**
 * @fileoverview Main Application Entry Point
 * @created 2025-05-31
 * @file app.js
 * @description This is the main entry point of the Kicks Shoes backend application.
 * It sets up the Express server, middleware configurations, and route handlers.
 * The application uses a modular architecture with separate routes, controllers,
 * and services for better organization and maintainability.
 *
 * Key features:
 * - Express server configuration
 * - Middleware setup (CORS, body-parser, etc.)
 * - Route registration
 * - Error handling
 * - Database connection
 * - Logging configuration
 */

import compression from 'compression';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import { corsMiddleware, isOriginAllowed } from './config/cors.config.js';
import connectDB from './config/database.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js'; // Added from feature/HueSuong/cart-be
import categoryRoutes from './routes/categoryRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import livestreamRoutes from './routes/livestreamRoutes.js'; // Added LiveStream routes
import orderRoutes from './routes/orderRoutes.js';
import payosRoutes from './routes/payos.routes.js';
import productRoutes from './routes/productRoutes.js';
import rewardPointRoutes from './routes/rewardPointRoutes.js';
import { default as shopRoutes, default as storeRoutes } from './routes/storeRoutes.js';
import tryonRoutes from './routes/tryonRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import userRoutes from './routes/userRoutes.js';
import vnpayRoutes from './routes/vnpayRoutes.js'; // Added VNPay routes
import blogRoutes from './routes/blogRoutes.js';
import blogCommentRoutes from './routes/blogCommentRoutes.js';
import potentialOrderRoutes from './routes/potentialOrderRoutes.js'; // Added Potential Order routes
import flashSaleRoutes from './routes/flashSaleRoutes.js'; // Added Flash Sale routes
import userDiscountRoutes from './routes/userDiscountRoutes.js'; // Added UserDiscount routes
import aiRoutes from './routes/aiRoutes.js';
import aiSearchRoutes from './routes/aiSearchRoutes.js'; // Added AI Search routes
import outfitSuggestionRoutes from './routes/outfitSuggestionRoutes.js'; // Added Outfit Suggestion routes
import shipperRoutes from './routes/shipperRoutes.js'; // Added Shipper routes
import deliveryReportRoutes from './routes/deliveryReportRoutes.js'; // Added Delivery Report routes
import shipperApplicationRoutes from './routes/shipperApplicationRoutes.js'; // Added Shipper Application routes
import aiInventoryRoutes from './routes/aiInventoryRoutes.js'; // AI Inventory Intelligence
import weatherRoutes from './routes/weatherRoutes.js'; // Weather Recommendation routes
import logger from './utils/logger.js';
import { setupUploadDirectories } from './utils/setupUploads.js';
import {
  startDiscountStatusUpdateCron,
  startFlashSaleStatusUpdateCron,
  startAutoCompleteOrdersCron,
} from './utils/cronJobs.js';
import inventoryScheduler from './services/inventoryScheduler.service.js'; // AI Inventory Scheduler

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Set up upload directories
setupUploadDirectories();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply CORS middleware first - this should handle everything
app.use(corsMiddleware);
// Ensure preflight requests are handled explicitly across all routes
app.options('*', corsMiddleware);

// Enhanced request logging with detailed debug info
app.use((req, res, next) => {
  logger.debug('=== REQUEST DEBUG ===');
  logger.debug(`${req.method} ${req.path} from ${req.headers.origin || 'unknown'}`);
  logger.debug('Host:', req.headers.host);
  logger.debug('User-Agent:', req.headers['user-agent']);
  logger.debug('Content-Type:', req.headers['content-type']);
  logger.debug('Content-Length:', req.headers['content-length']);
  logger.debug('Request URL:', req.url);
  logger.debug('Request path:', req.path);
  logger.debug('Request base URL:', req.baseUrl);
  logger.debug('Request original URL:', req.originalUrl);
  logger.debug('========================');
  next();
});

// Fallback CORS headers (backup if cors middleware fails)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization,X-Requested-With,Accept,Origin'
    );
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  next();
});

app.use(morgan('dev'));
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Kicks Shoes API' });
});

// Health check endpoint for deployment monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Debug endpoint to test tryon route accessibility
app.get('/api/tryon/debug', (req, res) => {
  logger.debug('=== TRYON DEBUG ENDPOINT ===');
  logger.debug('Request received at:', new Date().toISOString());
  logger.debug('Request headers:', req.headers);

  res.status(200).json({
    message: 'Tryon endpoint is accessible',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    method: req.method,
    url: req.url,
    path: req.path,
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reward-points', rewardPointRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favourites', favouriteRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api', uploadRoutes);
app.use('/api/payment/vnpay', vnpayRoutes); // Added VNPay payment routes
app.use('/api/payos', payosRoutes); // Added PayOS payment routes
app.use('/api/chat', chatRoutes);
app.use('/api/livestream', livestreamRoutes); // Added LiveStream routes
app.use('/api/blogs', blogRoutes);
app.use('/api/blog-comments', blogCommentRoutes);
app.use('/api/potential-orders', potentialOrderRoutes); // Added Potential Order routes
app.use('/api/tryon', tryonRoutes);
app.use('/api/flash-sales', flashSaleRoutes); // Added Flash Sale routes
app.use('/api/user-discounts', userDiscountRoutes); // Added UserDiscount routes
app.use('/api/ai', aiRoutes);
app.use('/api/ai', outfitSuggestionRoutes); // AI proxy routes
app.use('/api/ai', aiSearchRoutes); // AI Search routes
app.use('/api/shipper', shipperRoutes); // Added Shipper routes
app.use('/api/delivery-reports', deliveryReportRoutes); // Added Delivery Report routes
app.use('/api/shipper-applications', shipperApplicationRoutes); // Added Shipper Application routes
app.use('/api/ai/inventory', aiInventoryRoutes); // AI Inventory Intelligence
app.use('/api/weather', weatherRoutes); // Weather Recommendation routes

// Start cron jobs
startDiscountStatusUpdateCron();
startFlashSaleStatusUpdateCron();
startAutoCompleteOrdersCron();

// Start AI Inventory Scheduler (runs daily at 8:00 AM)
inventoryScheduler.start();
logger.info('AI Inventory Intelligence started - Daily analysis at 8:00 AM');

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST =
  process.env.HOST ||
  (process.env.NODE_ENV === 'development' && !process.env.WEBSITE_HOSTNAME
    ? 'localhost'
    : '0.0.0.0');
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        logger.warn('Socket CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

import setupSocketHandlers from './socket.js';
import { setSocketIO } from './utils/socketIO.js';

// Setup socket handlers
setupSocketHandlers(io);

// Make io instance globally accessible for controllers
setSocketIO(io);

server.listen(PORT, HOST, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;
export { io, server };
