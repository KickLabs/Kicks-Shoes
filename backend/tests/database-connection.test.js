/**
 * Database Connection Test
 * Test kết nối MongoDB thực tế
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Database Connection Test', () => {
  // Timeout cho DB connection test - set in individual tests instead

  afterAll(async () => {
    // Đóng connection sau khi test xong
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test('Should connect to MongoDB successfully', async () => {
    // Given
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kicks-shoes';

    console.log('Attempting to connect to:', mongoUri);

    try {
      // When
      const connection = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Timeout nhanh để test
      });

      // Then
      expect(connection).toBeDefined();
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
      console.log('✅ MongoDB connected:', mongoose.connection.host);
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.error('Make sure MongoDB is running on localhost:27017');
      throw error;
    }
  }, 15000);

  test('Should have kicks-shoes database', async () => {
    // Given - connection đã được tạo từ test trước
    expect(mongoose.connection.readyState).toBe(1);

    // When
    const dbName = mongoose.connection.name;

    // Then
    expect(dbName).toBe('kicks-shoes');
    console.log('✅ Database name:', dbName);
  });

  test('Should be able to list collections', async () => {
    // Given
    expect(mongoose.connection.readyState).toBe(1);

    // When
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Then
    expect(collections).toBeDefined();
    expect(Array.isArray(collections)).toBe(true);
    console.log('✅ Collections found:', collectionNames.length);
    console.log('Collection names:', collectionNames);
  });
});
