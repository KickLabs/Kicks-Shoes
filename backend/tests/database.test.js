import { jest } from '@jest/globals';
import dotenv from 'dotenv';

// Cần MOCK process.exit TRƯỚC MỌI THỨ để worker không bị Jest kill sớm
const realProcessExit = process.exit;
beforeAll(() => {
  process.exit = jest.fn(code => {
    throw new Error(`Process exited with code ${code}`);
  });
});
afterAll(() => {
  process.exit = realProcessExit;
});

describe('Database Configuration (database.js)', () => {
  let connectDB;
  let consoleLogSpy;
  let consoleErrorSpy;
  let originalMongoUri;

  const mockConnect = jest.fn();
  const mockConnection = { host: 'localhost' };

  beforeAll(async () => {
    // Load environment
    dotenv.config();
    originalMongoUri = process.env.MONGODB_URI;
    // Mock mongoose BEFORE importing database.js
    jest.unstable_mockModule('mongoose', () => ({
      default: {
        connect: mockConnect,
        connection: mockConnection,
      },
    }));

    // Import database module (will use mocked mongoose)
    const dbModule = await import('../src/config/database.js');
    connectDB = dbModule.default;
  });

  beforeEach(() => {
    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Clear mock history
    mockConnect.mockClear();
  });

  afterEach(() => {
    // Restore spies
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  afterAll(() => {
    // Restore original env và exit mock
    if (originalMongoUri !== undefined) {
      process.env.MONGODB_URI = originalMongoUri;
    } else {
      delete process.env.MONGODB_URI;
    }
  });

  describe('Successful Connection', () => {
    it('should connect successfully using MONGODB_URI env variable', async () => {
      mockConnection.host = 'env-host';
      // Đảm bảo connect trả về object đúng code
      mockConnect.mockResolvedValueOnce({ connection: mockConnection });
      process.env.MONGODB_URI = 'mongodb://env-uri/test-db';
      await connectDB();
      expect(mockConnect).toHaveBeenCalledWith('mongodb://env-uri/test-db');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
    it('should use default URI if MONGODB_URI is not set', async () => {
      mockConnection.host = 'default-host';
      mockConnect.mockResolvedValueOnce({ connection: mockConnection });
      delete process.env.MONGODB_URI;
      await connectDB();
      expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/kicks-shoes');
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Connection Failure', () => {
    it('should log an error and exit process on connection failure', async () => {
      const mockError = new Error('Connection Failed');
      mockConnect.mockRejectedValueOnce(mockError);

      try {
        await connectDB();
      } catch (error) {
        // Expect process.exit to throw
        expect(error.message).toContain('Process exited with code 1');
      }

      expect(mockConnect).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${mockError.message}`);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('ECONNREFUSED');
      mockConnect.mockRejectedValueOnce(networkError);

      try {
        await connectDB();
      } catch (error) {
        expect(error.message).toContain('Process exited with code 1');
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: ${networkError.message}`);
    });
  });
});
