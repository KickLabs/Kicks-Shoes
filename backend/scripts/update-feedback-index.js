import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateFeedbackIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the database
    const db = mongoose.connection.db;
    const collection = db.collection('feedbacks');

    // Drop the old index
    try {
      await collection.dropIndex('user_1_product_1');
      console.log('✅ Dropped old index: user_1_product_1');
    } catch (error) {
      console.log('ℹ️ Old index not found or already dropped');
    }

    // Drop existing index with different name if exists
    try {
      await collection.dropIndex('user_1_order_1_product_1');
      console.log('✅ Dropped existing index: user_1_order_1_product_1');
    } catch (error) {
      console.log('ℹ️ Existing index not found or already dropped');
    }

    // Create the new index
    await collection.createIndex(
      { user: 1, order: 1, product: 1 },
      {
        unique: true,
        name: 'user_order_product_unique',
      }
    );
    console.log('✅ Created new index: user_order_product_unique');

    // List all indexes to verify
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('🎉 Feedback index update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating feedback index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
updateFeedbackIndex();
