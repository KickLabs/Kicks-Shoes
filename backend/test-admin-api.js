/**
 * Test script for Admin API endpoints
 * Run with: node test-admin-api.js
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://10.13.13.119:3000/api';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@kicks.com',
  password: 'admin123'
};

const SHOP_CREDENTIALS = {
  email: 'shop@kicks.com', 
  password: 'shop123'
};

let adminToken = null;
let shopToken = null;

/**
 * Login and get token
 */
async function login(credentials) {
  try {
    console.log(`🔐 Logging in as ${credentials.email}...`);
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Login failed: ${data.message || data.error || response.statusText}`);
    }

    const token = data.data?.tokens?.accessToken || data.data?.token || data.token;
    
    if (!token) {
      throw new Error('No token received from login response');
    }

    console.log(`✅ Login successful for ${credentials.email}`);
    console.log(`🎫 Token: ${token.substring(0, 20)}...`);
    
    return token;
  } catch (error) {
    console.error(`❌ Login failed for ${credentials.email}:`, error.message);
    return null;
  }
}

/**
 * Test admin stats endpoint
 */
async function testAdminStats(token) {
  try {
    console.log('\n📊 Testing Admin Stats endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/dashboard/admin/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${data.message || data.error || response.statusText}`);
    }

    console.log('✅ Admin Stats API Success!');
    console.log('📈 Stats received:');
    console.log(`  - Total Users: ${data.data?.totalUsers || 'N/A'}`);
    console.log(`  - Total Orders: ${data.data?.totalOrders || 'N/A'}`);
    console.log(`  - Total Revenue: ${data.data?.totalRevenue || 'N/A'}`);
    console.log(`  - Total Products: ${data.data?.totalProducts || 'N/A'}`);
    console.log(`  - Total Categories: ${data.data?.totalCategories || 'N/A'}`);
    console.log(`  - Total Conversations: ${data.data?.totalConversations || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Admin Stats API Failed:', error.message);
    return false;
  }
}

/**
 * Test admin users endpoint
 */
async function testAdminUsers(token) {
  try {
    console.log('\n👥 Testing Admin Users endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/dashboard/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${data.message || data.error || response.statusText}`);
    }

    console.log('✅ Admin Users API Success!');
    console.log(`👤 Users count: ${data.data?.users?.length || data.data?.length || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Admin Users API Failed:', error.message);
    return false;
  }
}

/**
 * Test admin categories endpoint
 */
async function testAdminCategories(token) {
  try {
    console.log('\n🏷️  Testing Admin Categories endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/dashboard/admin/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${data.message || data.error || response.statusText}`);
    }

    console.log('✅ Admin Categories API Success!');
    console.log(`🏷️  Categories count: ${data.data?.categories?.length || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Admin Categories API Failed:', error.message);
    return false;
  }
}

/**
 * Test server connectivity
 */
async function testServerConnectivity() {
  try {
    console.log('🌐 Testing server connectivity...');
    
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Server is reachable');
      return true;
    } else {
      console.log(`⚠️  Server responded with ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Server connectivity failed:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Admin API Tests...');
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  
  // Test server connectivity first
  const serverOk = await testServerConnectivity();
  if (!serverOk) {
    console.log('\n❌ Cannot reach server. Please ensure backend is running.');
    return;
  }

  // Login as admin
  adminToken = await login(ADMIN_CREDENTIALS);
  if (!adminToken) {
    console.log('\n❌ Admin login failed. Please run create-admin-user.js first.');
    return;
  }

  // Run admin API tests
  console.log('\n🧪 Running Admin API Tests...');
  const statsOk = await testAdminStats(adminToken);
  const usersOk = await testAdminUsers(adminToken);
  const categoriesOk = await testAdminCategories(adminToken);

  // Summary
  console.log('\n📋 Test Results Summary:');
  console.log(`  - Server Connectivity: ${serverOk ? '✅' : '❌'}`);
  console.log(`  - Admin Login: ${adminToken ? '✅' : '❌'}`);
  console.log(`  - Admin Stats API: ${statsOk ? '✅' : '❌'}`);
  console.log(`  - Admin Users API: ${usersOk ? '✅' : '❌'}`);
  console.log(`  - Admin Categories API: ${categoriesOk ? '✅' : '❌'}`);

  const allPassed = serverOk && adminToken && statsOk && usersOk && categoriesOk;
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed!'}`);
  
  if (allPassed) {
    console.log('\n✅ Backend Admin APIs are working correctly!');
    console.log('📱 You can now test the mobile app with these credentials:');
    console.log('   Email: admin@kicks.com');
    console.log('   Password: admin123');
  }
}

// Run the tests
runTests().catch(console.error); 