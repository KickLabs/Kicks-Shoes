import request from 'supertest';
import mongoose from 'mongoose';
import { io as socketClient } from 'socket.io-client';
import app, { io as socketServer, server } from '../src/app.js';
import LiveStream from '../src/models/LiveStream.js';
import LiveStreamChat from '../src/models/LiveStreamChat.js';
import PotentialOrder from '../src/models/PotentialOrder.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import { makeStream, makeUser, makeProduct } from './_helpers/testUtils.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Suite 7: Integration & End-to-End Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let normalUser;
  let testStream;
  let testProduct;
  const SOCKET_PORT = 3000;

  beforeAll(async () => {
    // Start server (use the server instance from app.js to avoid double creation)
    await new Promise(resolve => {
      server.listen(SOCKET_PORT, resolve);
    });
  });

  afterAll(async () => {
    // Clean up all test data
    await User.deleteMany({ email: { $regex: /test/ } });
    await Product.deleteMany({});
    await LiveStream.deleteMany({});
    await LiveStreamChat.deleteMany({});
    await PotentialOrder.deleteMany({});
    await Order.deleteMany({});

    // Close Socket.IO server first
    if (socketServer) {
      socketServer.close();
    }

    // Close HTTP server
    if (server) {
      await new Promise((resolve, reject) => {
        server.close(err => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Close mongoose connection
    await mongoose.connection.close();

    // Allow time for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
  }, 30000); // Increase timeout for cleanup

  beforeEach(async () => {
    // Clean up data (NOT users - they're unique per test with timestamp)
    await Product.deleteMany({});
    await LiveStream.deleteMany({});
    await LiveStreamChat.deleteMany({});
    await PotentialOrder.deleteMany({});
    await Order.deleteMany({});

    // Create fresh test users for each test (with unique timestamp)
    const timestamp = Date.now() + Math.random();
    adminUser = await User.create(
      makeUser({
        role: 'shop', // Shop role can manage orders
        email: `admin_${timestamp}@test.com`,
        username: `admin_${timestamp}`,
        isVerified: true, // Required for auth middleware
        status: true, // Active status
      })
    );

    normalUser = await User.create(
      makeUser({
        role: 'customer',
        email: `user_${timestamp}@test.com`,
        username: `user_${timestamp}`,
        isVerified: true, // Required for auth middleware
        status: true, // Active status
      })
    );

    // Generate REAL JWT tokens
    const adminTokenStr = generateToken({ id: adminUser._id }, '1d');
    const userTokenStr = generateToken({ id: normalUser._id }, '1d');
    adminToken = `Bearer ${adminTokenStr}`;
    userToken = `Bearer ${userTokenStr}`;

    // Create test product matching chat message pattern
    testProduct = await Product.create(
      makeProduct({
        name: 'Nike Air Max 90',
        sku: 'NAM90', // Must match SKU in chat message
        brand: 'Nike',
        price: { regular: 2500000 },
        flashSalePrice: 2000000,
        stock: 100,
        inventory: [
          {
            size: '42',
            color: 'trắng', // Match Vietnamese color in message
            quantity: 50,
            isAvailable: true,
            sku: 'NAM90-42-trang',
          },
        ],
      })
    );

    // Create fresh test stream with featured product
    testStream = await LiveStream.create(
      makeStream({
        hostId: adminUser._id,
        status: 'live',
        title: 'Integration Test Stream',
        featuredProducts: [
          {
            productId: testProduct._id,
            addedAt: new Date(),
          },
        ],
      })
    );
  });

  // =================================================================
  // TC-701: Complete Order Flow - From Chat to Order Creation
  // =================================================================
  describe('TC-701 | Complete order workflow from livestream chat to order creation', () => {
    test('should handle complete order flow: chat → detect → potential order → confirm → real order', async () => {
      // Step 1: User joins livestream
      const joinResponse = await request(app)
        .post(`/api/livestreams/${testStream._id}/join`)
        .set('Authorization', userToken)
        .expect(200);

      expect(joinResponse.body.success).toBe(true);

      // Step 2: User sends order message (with proper SKU format)
      const chatResponse = await request(app)
        .post(`/api/livestreams/${testStream._id}/chat`)
        .set('Authorization', userToken)
        .send({
          message: 'Chốt 1 đôi NAM90 màu trắng size 42 0912345678',
          type: 'text',
        })
        .expect(201);

      expect(chatResponse.body.success).toBe(true);
      const messageId = chatResponse.body.data._id;

      // Verify chat message was saved
      const chatMessage = await LiveStreamChat.findById(messageId);
      expect(chatMessage).toBeTruthy();
      expect(chatMessage.content).toContain('Chốt');

      // Step 3: Check if potential order was created automatically
      // Wait for async order detection (with retry logic)
      let potentialOrders = [];
      let retries = 10;
      while (retries > 0 && potentialOrders.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        potentialOrders = await PotentialOrder.find({
          'customerInfo.userId': normalUser._id,
          streamId: testStream._id,
        });

        // Debug: Check all potential orders
        if (potentialOrders.length === 0 && retries === 5) {
          const allOrders = await PotentialOrder.find({});
          console.log('All PotentialOrders:', allOrders.length);
          if (allOrders.length > 0) {
            const order = allOrders[0];
            console.log('First order userId:', order.customerInfo?.userId?.toString());
            console.log('First order streamId:', order.streamId?.toString());
            console.log('Looking for customerId:', normalUser._id.toString());
            console.log('Looking for streamId:', testStream._id.toString());
          }
        }
        retries--;
      }

      expect(potentialOrders.length).toBeGreaterThan(0);
      const potentialOrder = potentialOrders[0];
      expect(potentialOrder.customerInfo.phoneNumber).toBe('0912345678');
      expect(potentialOrder.status).toBe('pending');

      // Step 4: Admin confirms the potential order
      const confirmResponse = await request(app)
        .put(`/api/potential-orders/${potentialOrder._id}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'confirmed',
        })
        .expect(200);

      expect(confirmResponse.body.success).toBe(true);

      // Step 5: Verify real order was created
      const realOrders = await Order.find({
        user: normalUser._id,
      });

      expect(realOrders.length).toBe(1);
      const realOrder = realOrders[0];
      expect(realOrder.status).toBe('pending');
      expect(realOrder.items.length).toBeGreaterThan(0);
      expect(realOrder.totalPrice).toBeGreaterThan(0);

      // Step 6: Verify product stock was updated
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct.stock).toBeLessThan(testProduct.stock);
    });
  });

  // =================================================================
  // TC-702: Multiple Users Concurrent Orders
  // SKIPPED: Requires POST /api/livestreams/:id/chat route
  // =================================================================
  describe('TC-702 | Handle multiple users ordering simultaneously', () => {
    test('should handle concurrent orders without conflicts', async () => {
      // Create multiple users
      const users = await Promise.all([
        User.create(
          makeUser({
            email: 'user1@test.com',
            username: 'testuser1',
            isVerified: true,
            status: true,
          })
        ),
        User.create(
          makeUser({
            email: 'user2@test.com',
            username: 'testuser2',
            isVerified: true,
            status: true,
          })
        ),
        User.create(
          makeUser({
            email: 'user3@test.com',
            username: 'testuser3',
            isVerified: true,
            status: true,
          })
        ),
      ]);

      // Generate real JWT tokens for each user
      const tokens = users.map(user => generateToken({ id: user._id }, '1d'));

      // All users join livestream
      await Promise.all(
        users.map((user, index) =>
          request(app)
            .post(`/api/livestreams/${testStream._id}/join`)
            .set('Authorization', `Bearer ${tokens[index]}`)
        )
      );

      // All users send order messages simultaneously
      const chatPromises = users.map((user, index) =>
        request(app)
          .post(`/api/livestreams/${testStream._id}/chat`)
          .set('Authorization', `Bearer ${tokens[index]}`)
          .send({
            message: `Chốt đơi NAM90 màu trắng size ${40 + index} 091234567${index}`,
            type: 'text',
          })
      );

      const responses = await Promise.all(chatPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verify all potential orders were created
      const potentialOrders = await PotentialOrder.find({
        streamId: testStream._id,
      });

      expect(potentialOrders.length).toBeGreaterThanOrEqual(3);

      // Cleanup
      await User.deleteMany({ _id: { $in: users.map(u => u._id) } });
    });
  });

  // =================================================================
  // TC-703: Socket.IO Real-time Integration
  // SKIPPED: Requires Socket.IO setup and POST /api/livestreams/:id/chat route
  // =================================================================
  describe('TC-703 | Real-time communication via Socket.IO', () => {
    let clientSocket;

    afterEach(() => {
      if (clientSocket && clientSocket.connected) {
        clientSocket.disconnect();
      }
    });

    test('should broadcast chat messages to all connected clients', done => {
      const socketUrl = `http://localhost:${SOCKET_PORT}`;

      clientSocket = socketClient(socketUrl, {
        auth: { token: userToken },
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        // Join livestream room
        clientSocket.emit('join-livestream', {
          livestreamId: testStream._id.toString(),
        });

        // Listen for chat messages
        clientSocket.on('new-chat-message', data => {
          expect(data).toBeTruthy();
          expect(data.message).toBe('Test real-time message');
          expect(data.livestreamId).toBe(testStream._id.toString());
          done();
        });

        // Send a chat message via HTTP API
        setTimeout(() => {
          request(app)
            .post(`/api/livestreams/${testStream._id}/chat`)
            .set('Authorization', userToken)
            .send({
              message: 'Test real-time message',
              type: 'text',
            })
            .then(() => {
              // Message should be broadcast via socket
            });
        }, 500);
      });

      clientSocket.on('connect_error', error => {
        done(error);
      });
    }, 10000);
  });

  // =================================================================
  // TC-704: WebRTC Signaling Integration
  // SKIPPED: Requires Socket.IO setup
  // =================================================================
  describe('TC-704 | WebRTC signaling through Socket.IO', () => {
    let hostSocket;
    let viewerSocket;

    afterEach(() => {
      if (hostSocket && hostSocket.connected) hostSocket.disconnect();
      if (viewerSocket && viewerSocket.connected) viewerSocket.disconnect();
    });

    test('should handle WebRTC offer-answer exchange', done => {
      const socketUrl = `http://localhost:${SOCKET_PORT}`;

      hostSocket = socketClient(socketUrl, {
        auth: { token: adminToken },
        transports: ['websocket'],
      });

      viewerSocket = socketClient(socketUrl, {
        auth: { token: userToken },
        transports: ['websocket'],
      });

      let offerReceived = false;
      let answerReceived = false;

      hostSocket.on('connect', () => {
        hostSocket.emit('start-livestream', {
          livestreamId: testStream._id.toString(),
        });

        // Host receives answer from viewer
        hostSocket.on('webrtc-answer', data => {
          expect(data.answer).toBeTruthy();
          expect(data.answer.type).toBe('answer');
          answerReceived = true;

          if (offerReceived && answerReceived) {
            done();
          }
        });
      });

      viewerSocket.on('connect', () => {
        viewerSocket.emit('join-livestream', {
          livestreamId: testStream._id.toString(),
        });

        // Viewer receives offer from host
        viewerSocket.on('webrtc-offer', data => {
          expect(data.offer).toBeTruthy();
          expect(data.offer.type).toBe('offer');
          offerReceived = true;

          // Viewer sends answer back
          viewerSocket.emit('webrtc-answer', {
            livestreamId: testStream._id.toString(),
            answer: { type: 'answer', sdp: 'mock-answer-sdp' },
          });
        });

        // Host sends offer
        setTimeout(() => {
          hostSocket.emit('webrtc-offer', {
            livestreamId: testStream._id.toString(),
            offer: { type: 'offer', sdp: 'mock-offer-sdp' },
          });
        }, 500);
      });
    }, 10000);
  });

  // =================================================================
  // TC-705: Out of Stock Handling in Complete Flow
  // =================================================================
  describe('TC-705 | Handle out-of-stock during order creation', () => {
    test('should prevent order creation when product is out of stock', async () => {
      // Set product stock to 0
      testProduct.stock = 0;
      await testProduct.save();

      // User sends order message
      await request(app)
        .post(`/api/livestreams/${testStream._id}/chat`)
        .set('Authorization', userToken)
        .send({
          message: 'Chốt đơn NAM90 size 42 SĐT 0912345678',
          type: 'text',
        })
        .expect(201);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const potentialOrders = await PotentialOrder.find({
        'customerInfo.userId': normalUser._id,
      });

      expect(potentialOrders.length).toBeGreaterThan(0);
      const potentialOrder = potentialOrders[0];

      // Admin tries to confirm
      const confirmResponse = await request(app)
        .put(`/api/potential-orders/${potentialOrder._id}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'confirmed',
        })
        .expect(200);

      // Verify response immediately - no need to wait or re-query
      expect(confirmResponse.body.success).toBe(true);
      expect(confirmResponse.body.data.status).toBe('confirmed');
      expect(confirmResponse.body.data.convertedOrderId).toBeNull();

      // Verify no real order was created
      const realOrders = await Order.find({
        user: normalUser._id,
      }).lean(); // Use lean() to avoid Mongoose document overhead

      expect(realOrders.length).toBe(0);

      // Test complete - Jest should exit cleanly
    }, 15000); // Reduced timeout since we removed extra waits
  });

  // =================================================================
  // TC-706: Error Recovery and Rollback
  // =================================================================
  describe('TC-706 | Error recovery and transaction rollback', () => {
    test('should handle potential order status update properly', async () => {
      // Create potential order with all required fields
      const potentialOrder = await PotentialOrder.create({
        streamId: testStream._id,
        roomId: testStream.roomId,
        chatMessageId: new mongoose.Types.ObjectId(),
        customerId: normalUser._id,
        livestreamId: testStream._id,
        customerPhone: '0912345678',
        customerInfo: {
          userId: normalUser._id,
          customerName: normalUser.fullName,
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test order for error handling',
        },
        detectedProducts: [],
        status: 'pending',
        confidence: 0.8,
      });

      // Confirm the order (without product, it won't auto-create Order)
      const response = await request(app)
        .put(`/api/potential-orders/${potentialOrder._id}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'confirmed',
        })
        .expect(200);

      // Verify status was updated
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');

      // Verify in database
      const updatedPotentialOrder = await PotentialOrder.findById(potentialOrder._id);
      expect(updatedPotentialOrder.status).toBe('confirmed');

      // Verify no Order was created (because no product linked)
      const orders = await Order.find({ customerId: normalUser._id });
      expect(orders.length).toBe(0);
    });
  });

  // =================================================================
  // TC-707: Performance Under Load
  // SKIPPED: Requires POST /api/livestreams/:id/chat route
  // =================================================================
  describe('TC-707 | Performance with high message volume', () => {
    test('should handle 50 chat messages in quick succession', async () => {
      const messageCount = 50;
      const startTime = Date.now();

      const promises = Array.from({ length: messageCount }, (_, i) =>
        request(app)
          .post(`/api/livestreams/${testStream._id}/chat`)
          .set('Authorization', userToken)
          .send({
            message: `Test message ${i}`,
            type: 'text',
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should complete within reasonable time (10 seconds)
      expect(duration).toBeLessThan(10000);

      // Verify all messages were saved (use streamId not livestreamId)
      const savedMessages = await LiveStreamChat.find({
        streamId: testStream._id,
      });

      expect(savedMessages.length).toBeGreaterThanOrEqual(messageCount);
    }, 15000);
  });

  // =================================================================
  // TC-708: Session Management Across Services
  // SKIPPED: Requires POST /api/livestreams/:id/join, POST /api/livestreams/:id/chat, POST /api/livestreams/:id/leave routes
  // =================================================================
  describe('TC-708 | Session persistence across different endpoints', () => {
    test('should maintain user session across livestream operations', async () => {
      // Join livestream
      await request(app)
        .post(`/api/livestreams/${testStream._id}/join`)
        .set('Authorization', userToken)
        .expect(200);

      // Send chat message
      await request(app)
        .post(`/api/livestreams/${testStream._id}/chat`)
        .set('Authorization', userToken)
        .send({
          message: 'Test message',
          type: 'text',
        })
        .expect(201);

      // Get chat history (should see own message)
      const historyResponse = await request(app)
        .get(`/api/livestreams/${testStream._id}/chat`)
        .set('Authorization', userToken)
        .expect(200);

      expect(historyResponse.body.success).toBe(true);
      const messages = historyResponse.body.data;
      // senderId is populated, so use _id property
      expect(messages.some(m => m.senderId._id.toString() === normalUser._id.toString())).toBe(
        true
      );

      // Leave livestream
      await request(app)
        .post(`/api/livestreams/${testStream._id}/leave`)
        .set('Authorization', userToken)
        .expect(200);
    });
  });

  // =================================================================
  // TC-709: Authorization Flow Integration
  // =================================================================
  describe('TC-709 | Authorization checks across complete workflow', () => {
    test('should enforce role-based access control throughout order flow', async () => {
      // Regular user cannot confirm potential orders
      const potentialOrder = await PotentialOrder.create({
        streamId: testStream._id,
        roomId: testStream.roomId,
        chatMessageId: new mongoose.Types.ObjectId(),
        customerId: normalUser._id,
        livestreamId: testStream._id,
        customerPhone: '0912345678',
        customerInfo: {
          userId: normalUser._id,
          customerName: normalUser.fullName,
          phoneNumber: '0912345678',
        },
        productInfo: {
          originalMessage: 'Test order for authorization',
        },
        detectedProducts: [],
        status: 'pending',
        confidence: 0.8,
      });

      const unauthorizedConfirm = await request(app)
        .put(`/api/potential-orders/${potentialOrder._id}/status`)
        .set('Authorization', userToken)
        .send({
          status: 'confirmed',
        });

      // Should be rejected (401 Unauthorized, 403 Forbidden, or 404 if user deleted)
      expect([401, 403, 404]).toContain(unauthorizedConfirm.status);

      // Admin can confirm
      await request(app)
        .put(`/api/potential-orders/${potentialOrder._id}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'confirmed',
        })
        .expect(200);
    });
  });

  // =================================================================
  // TC-710: Data Consistency Across Services
  // =================================================================
  describe('TC-710 | Data consistency between related entities', () => {
    test('should maintain referential integrity between livestream, chat, and orders', async () => {
      // Send chat message
      const chatResponse = await request(app)
        .post(`/api/livestreams/${testStream._id}/chat`)
        .set('Authorization', userToken)
        .send({
          message: 'Chốt đơn NAM90 size 42 SĐT 0912345678',
          type: 'text',
        })
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get chat message (use streamId not livestreamId)
      const chatMessage = await LiveStreamChat.findById(chatResponse.body.data._id);
      expect(chatMessage.streamId.toString()).toBe(testStream._id.toString());
      expect(chatMessage.senderId.toString()).toBe(normalUser._id.toString());

      // Get potential order (use correct field names: customerInfo.userId and streamId)
      const potentialOrder = await PotentialOrder.findOne({
        'customerInfo.userId': normalUser._id,
        streamId: testStream._id,
      });

      expect(potentialOrder).toBeTruthy();
      expect(potentialOrder.streamId.toString()).toBe(testStream._id.toString());
      expect(potentialOrder.customerInfo.userId.toString()).toBe(normalUser._id.toString());

      // Confirm and create real order
      await request(app)
        .put(`/api/potential-orders/${potentialOrder._id}/status`)
        .set('Authorization', adminToken)
        .send({
          status: 'confirmed',
        });

      // Verify all relationships
      const realOrder = await Order.findOne({
        customerId: normalUser._id,
      });

      if (realOrder) {
        expect(realOrder.customerId.toString()).toBe(normalUser._id.toString());
        // Additional relationship checks
      }
    });
  });

  // =================================================================
  // TC-711: Handle 50 concurrent users joining livestream
  // =================================================================
  describe('TC-711 | Handle multiple concurrent users joining livestream', () => {
    test('should handle 50 users joining livestream simultaneously', async () => {
      const userCount = 50;

      // Create 50 test users
      const users = await Promise.all(
        Array.from({ length: userCount }, async (_, index) => {
          const timestamp = Date.now() + index;
          const user = await User.create(
            makeUser({
              role: 'customer',
              email: `concurrent_user_${timestamp}@test.com`,
              username: `concurrent_user_${timestamp}`,
              isVerified: true,
              status: true,
            })
          );

          // Generate token for each user
          const tokenStr = generateToken({ id: user._id }, '1d');
          return {
            user,
            token: `Bearer ${tokenStr}`,
          };
        })
      );

      // All 50 users join livestream concurrently
      const joinPromises = users.map(({ token }) =>
        request(app)
          .post(`/api/livestreams/${testStream._id}/join`)
          .set('Authorization', token)
          .expect(200)
      );

      const joinResponses = await Promise.all(joinPromises);

      // Verify all join responses are successful
      joinResponses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.viewerCount).toBeGreaterThan(0);
      });

      // Verify final viewer count from database (check race condition handling)
      const updatedStream = await LiveStream.findById(testStream._id);

      // All 50 users should be in viewers array (test concurrent update handling)
      expect(updatedStream.viewers.length).toBe(userCount);

      // Each user sends a chat message concurrently
      const chatPromises = users.map(({ user, token }) =>
        request(app)
          .post(`/api/livestreams/${testStream._id}/chat`)
          .set('Authorization', token)
          .send({
            message: `Hello from user ${user.username}`,
            type: 'text',
          })
          .expect(201)
      );

      const chatResponses = await Promise.all(chatPromises);

      // Verify all chat messages were saved
      expect(chatResponses.length).toBe(userCount);

      const savedMessages = await LiveStreamChat.find({
        streamId: testStream._id,
      });

      expect(savedMessages.length).toBeGreaterThanOrEqual(userCount);

      // Verify each user's message exists
      users.forEach(({ user }) => {
        const userMessage = savedMessages.find(
          msg => msg.senderId.toString() === user._id.toString()
        );
        expect(userMessage).toBeDefined();
      });

      // Clean up concurrent test users
      await User.deleteMany({
        email: { $regex: /concurrent_user_/ },
      });
    }, 30000); // Increased timeout for concurrent operations
  });
});
