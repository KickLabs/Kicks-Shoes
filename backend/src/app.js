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

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";
import shopRoutes from "./routes/storeRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import { errorHandler } from "./middlewares/error.js";
import logger from "./utils/logger.js";
import { setupUploadDirectories } from "./utils/setupUploads.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Set up upload directories
setupUploadDirectories();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Kicks Shoes API" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/email", emailRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

export default app;
