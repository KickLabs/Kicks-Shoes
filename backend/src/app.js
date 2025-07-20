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
import morgan from 'morgan';
import connectDB from './config/database.js';
import { corsMiddleware } from './config/cors.config.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import productRoutes from './routes/productRoutes.js';
import rewardPointRoutes from './routes/rewardPointRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import favouriteRoutes from './routes/favouriteRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { default as shopRoutes, default as storeRoutes } from './routes/storeRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js'; // Added from feature/HueSuong/cart-be
import vnpayRoutes from './routes/vnpayRoutes.js'; // Added VNPay routes
import logger from './utils/logger.js';
import { setupUploadDirectories } from './utils/setupUploads.js';
import { startDiscountStatusUpdateCron } from './utils/cronJobs.js';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import chatRoutes from './routes/chatRoutes.js';

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
app.use(corsMiddleware);
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Kicks Shoes API' });
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
app.use('/api/chat', chatRoutes);

// Start cron jobs
startDiscountStatusUpdateCron();

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Cho phép lắng nghe mọi địa chỉ mạng
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'https://kicks-shoes-2025.web.app',
        'https://kicks-shoes-2025.firebaseapp.com',
      ];

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('Socket CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  },
});

import setupSocketHandlers from './socket.js';
setupSocketHandlers(io);

server.listen(PORT, HOST, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;
export { server, io };
