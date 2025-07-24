/**
 * Script to create admin user for testing
 * Run with: node create-admin-user.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Simple User model for this script
const userSchema = new mongoose.Schema({
  fullName: String,
  username: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['customer', 'shop', 'admin'],
    default: 'customer'
  },
  phone: String,
  address: String,
  status: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kicks-shoes';
    console.log('Connecting to MongoDB:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists by email
    const existingAdmin = await User.findOne({ email: 'admin@kicks.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Admin details:', {
        email: existingAdmin.email,
        username: existingAdmin.username,
        role: existingAdmin.role,
        isVerified: existingAdmin.isVerified,
        status: existingAdmin.status
      });
      
      // Update existing user to ensure correct role and status
      existingAdmin.role = 'admin';
      existingAdmin.status = true;
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      console.log('✅ Admin user updated with correct permissions');
      return;
    }

    // Check for existing username conflicts
    let username = 'adminkicks';
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `adminkicks${counter}`;
      counter++;
    }

    // Create admin user
    const adminUser = new User({
      fullName: 'Admin User',
      username: username,
      email: 'admin@kicks.com',
      password: 'admin123',
      role: 'admin',
      phone: '0123456789',
      address: '123 Admin Street',
      status: true,
      isVerified: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Login credentials:');
    console.log('  Email: admin@kicks.com');
    console.log('  Password: admin123');
    console.log('  Username:', username);
    console.log('  Role: admin');

    // Also create a shop user for testing
    const existingShop = await User.findOne({ email: 'shop@kicks.com' });
    if (!existingShop) {
      let shopUsername = 'shopkicks';
      let shopCounter = 1;
      while (await User.findOne({ username: shopUsername })) {
        shopUsername = `shopkicks${shopCounter}`;
        shopCounter++;
      }

      const shopUser = new User({
        fullName: 'Shop User',
        username: shopUsername,
        email: 'shop@kicks.com', 
        password: 'shop123',
        role: 'shop',
        phone: '0987654321',
        address: '456 Shop Street',
        status: true,
        isVerified: true
      });

      await shopUser.save();
      console.log('✅ Shop user created successfully!');
      console.log('Shop login credentials:');
      console.log('  Email: shop@kicks.com');
      console.log('  Password: shop123');
      console.log('  Username:', shopUsername);
      console.log('  Role: shop');
    } else {
      console.log('⚠️  Shop user already exists');
      // Update existing shop user
      existingShop.role = 'shop';
      existingShop.status = true;
      existingShop.isVerified = true;
      await existingShop.save();
      console.log('✅ Shop user updated with correct permissions');
    }

    // List all users for debugging
    console.log('\n📋 Current users in database:');
    const allUsers = await User.find({}).select('email username role status isVerified');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.username}) - Role: ${user.role}, Status: ${user.status ? 'Active' : 'Inactive'}, Verified: ${user.isVerified}`);
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser(); 