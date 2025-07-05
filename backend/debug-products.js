import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all products
    const products = await Product.find({}).limit(5);
    console.log(`Found ${products.length} products`);

    if (products.length > 0) {
      console.log('\n=== Sample Product Structure ===');
      const sample = products[0];
      console.log('Name:', sample.name);
      console.log('Brand:', sample.brand);
      console.log('Category:', sample.category);
      console.log('Price:', sample.price);
      console.log('Variants:', sample.variants);
      console.log('Inventory:', sample.inventory);
      console.log('Inventory length:', sample.inventory?.length || 0);

      if (sample.inventory && sample.inventory.length > 0) {
        console.log('\n=== Sample Inventory Items ===');
        sample.inventory.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, {
            size: item.size,
            color: item.color,
            quantity: item.quantity,
          });
        });
      }

      // Check for specific filters
      console.log('\n=== Testing Filters ===');

      // Test size filter
      const sizeFilter = await Product.find({
        $or: [{ 'variants.sizes': { $in: [40] } }, { 'inventory.size': 40 }],
      });
      console.log(`Products with size 40: ${sizeFilter.length}`);

      // Test color filter
      const colorFilter = await Product.find({
        $or: [{ 'variants.colors': { $in: ['Black'] } }, { 'inventory.color': 'Black' }],
      });
      console.log(`Products with color Black: ${colorFilter.length}`);

      // Test price filter
      const priceFilter = await Product.find({
        'price.regular': { $gte: 100, $lte: 500 },
      });
      console.log(`Products with price 100-500: ${priceFilter.length}`);
    } else {
      console.log('No products found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

debugProducts();
