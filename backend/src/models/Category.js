/**
 * @fileoverview Category Model
 * @created 2025-05-31
 * @file Category.js
 * @description This file defines the Category model schema for organizing products in the Kicks Shoes application.
 * It supports hierarchical category structures and includes metadata for category management.
 */

import mongoose from "mongoose";
const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", CategorySchema);

export default Category;
