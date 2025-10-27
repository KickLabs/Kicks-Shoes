/**
 * @fileoverview User Service Mock Module
 * @module tests/mocks/userService.mock
 * @description In-memory mock for User database operations
 */

class UserServiceMock {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  findByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User object or null
   */
  findById(id) {
    return this.users.get(id) || null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Object|null} User object or null
   */
  findByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return null;
  }

  /**
   * Save new user
   * @param {Object} userData - User data
   * @returns {Object} Saved user with ID
   */
  save(userData) {
    const id = `user${this.nextId++}`;
    const user = {
      _id: id,
      ...userData,
      email: userData.email.toLowerCase(),
      status: userData.status !== undefined ? userData.status : true,
      isVerified: userData.isVerified !== undefined ? userData.isVerified : false,
      reward_point: userData.reward_point !== undefined ? userData.reward_point : 0,
      role: userData.role || 'customer',
      avatar:
        userData.avatar ||
        'https://static.vecteezy.com/system/resources/previews/019/896/008/original/male-user-avatar-icon-in-flat-design-style-person-signs-illustration-png.png',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  /**
   * Update user by ID
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Object|null} Updated user or null
   */
  update(id, updates) {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  /**
   * Delete user by ID
   * @param {string} id - User ID
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    return this.users.delete(id);
  }

  /**
   * Get all users
   * @returns {Array} Array of all users
   */
  getAll() {
    return Array.from(this.users.values());
  }

  /**
   * Find users with filters
   * @param {Object} filter - Query filter
   * @returns {Array} Matching users
   */
  find(filter = {}) {
    const users = Array.from(this.users.values());
    return users.filter(user => {
      for (const [key, value] of Object.entries(filter)) {
        if (user[key] !== value) return false;
      }
      return true;
    });
  }

  /**
   * Count users with filter
   * @param {Object} filter - Query filter
   * @returns {number} Count of matching users
   */
  count(filter = {}) {
    return this.find(filter).length;
  }

  /**
   * Set mock data (for testing)
   * @param {Array} users - Array of user objects
   */
  __setData(users) {
    this.users.clear();
    users.forEach(user => {
      this.users.set(user._id, user);
    });
  }

  /**
   * Clear all mock data
   */
  __clear() {
    this.users.clear();
    this.nextId = 1;
  }

  /**
   * Get current size
   * @returns {number} Number of users in mock
   */
  __size() {
    return this.users.size;
  }
}

module.exports = new UserServiceMock();
