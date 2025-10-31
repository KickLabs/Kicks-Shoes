import { jest } from '@jest/globals';

describe('Email Configuration (email.config.js)', () => {
  let originalEnv;

  beforeEach(() => {
    // Lưu trữ env gốc
    originalEnv = { ...process.env };
    // Reset module cache để file config được load lại
    jest.resetModules();
  });

  afterEach(() => {
    // Khôi phục env gốc
    process.env = originalEnv;
  });

  it('should load default values when env variables are not set', async () => {
    // Đảm bảo các biến env này không được set
    delete process.env.ADMIN_EMAIL_ADDRESS;
    delete process.env.FROM_NAME;
    delete process.env.EMAIL_MAX_RETRIES;

    // Import file config SAU KHI đã set env
    const { emailConfig } = await import('../src/config/email.config.js'); // <-- Cập nhật đường dẫn

    expect(emailConfig.adminEmailAddress).toBe('admin@kicksshoes.com');
    expect(emailConfig.fromName).toBe('Kicks Shoes');
    expect(emailConfig.maxRetries).toBe(3);
  });

  it('should load values from process.env when set', async () => {
    // Set các biến env
    process.env.GOOGLE_MAILER_CLIENT_ID = 'test-client-id';
    process.env.ADMIN_EMAIL_ADDRESS = 'my-admin@test.com';
    process.env.FROM_NAME = 'My Test Shop';
    process.env.EMAIL_MAX_RETRIES = '5';
    process.env.SMTP_HOST = 'smtp.test.com';

    const { emailConfig } = await import('../src/config/email.config.js'); // <-- Cập nhật đường dẫn

    expect(emailConfig.googleMailerClientId).toBe('test-client-id');
    expect(emailConfig.adminEmailAddress).toBe('my-admin@test.com');
    expect(emailConfig.fromName).toBe('My Test Shop');
    expect(emailConfig.maxRetries).toBe(5); // Kiểm tra parse int
    expect(emailConfig.smtp.host).toBe('smtp.test.com');
  });

  it('should NOT throw error when in "test" environment (default)', async () => {
    // Jest tự động set NODE_ENV = 'test'
    process.env.NODE_ENV = 'test';

    // Xóa các biến bắt buộc
    delete process.env.GOOGLE_MAILER_CLIENT_ID;

    // Dùng async/await để import
    await expect(
      import('../src/config/email.config.js') // <-- Cập nhật đường dẫn
    ).resolves.toBeDefined();
  });

  it('should throw error if required env vars are missing in non-test env', async () => {
    // Giả lập môi trường production
    process.env.NODE_ENV = 'production';

    // Xóa một biến bắt buộc
    delete process.env.GOOGLE_MAILER_CLIENT_ID;

    // Phải dùng async import và .rejects.toThrow
    await expect(
      import('../src/config/email.config.js') // <-- Cập nhật đường dẫn
    ).rejects.toThrow('Missing required email configuration');
  });
});
