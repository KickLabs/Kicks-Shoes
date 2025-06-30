import dotenv from 'dotenv';

dotenv.config();

/**
 * VNPay Configuration
 * Loads configuration from environment variables
 */
const vnpayConfig = {
  // VNPay Merchant Configuration
  tmnCode: process.env.VNPAY_TMN_CODE || 'TMNCODE',
  secureSecret: process.env.VNPAY_SECURE_SECRET || 'SECRET',
  vnpayHost: process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn',
  testMode: process.env.VNPAY_TEST_MODE === 'true',

  // VNPay API Endpoints
  paymentEndpoint: process.env.VNPAY_PAYMENT_ENDPOINT || 'paymentv2/vpcpay.html',
  queryDrRefundEndpoint:
    process.env.VNPAY_QUERY_REFUND_ENDPOINT || 'merchant_webapi/api/transaction',
  getBankListEndpoint:
    process.env.VNPAY_BANK_LIST_ENDPOINT || 'qrpayauth/api/merchant/get_bank_list',

  // VNPay Algorithm and Locale
  hashAlgorithm: process.env.VNPAY_HASH_ALGORITHM || 'SHA512',
  locale: process.env.VNPAY_LOCALE || 'vn',
  currencyCode: process.env.VNPAY_CURRENCY_CODE || 'VND',

  // Logging
  enableLog: process.env.VNPAY_ENABLE_LOG === 'true',

  // Callback URLs
  returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment/return',
  ipnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:5000/api/payment/ipn',

  // Custom logger function (optional)
  loggerFn: undefined, // Will be set dynamically if needed
};

/**
 * Validate required VNPay configuration
 */
const validateVNPayConfig = () => {
  const requiredFields = ['tmnCode', 'secureSecret'];
  const missingFields = requiredFields.filter(field => !vnpayConfig[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required VNPay configuration: ${missingFields.join(', ')}`);
  }

  // Validate hash algorithm
  const validAlgorithms = ['SHA256', 'SHA512', 'MD5'];
  if (!validAlgorithms.includes(vnpayConfig.hashAlgorithm)) {
    throw new Error(`Invalid VNPay hash algorithm. Must be one of: ${validAlgorithms.join(', ')}`);
  }

  // Validate locale
  const validLocales = ['vn', 'en'];
  if (!validLocales.includes(vnpayConfig.locale)) {
    throw new Error(`Invalid VNPay locale. Must be one of: ${validLocales.join(', ')}`);
  }

  return true;
};

/**
 * Get VNPay configuration for different environments
 */
const getVNPayConfig = (environment = 'development') => {
  const config = { ...vnpayConfig };

  if (environment === 'production') {
    // Override with production settings
    config.testMode = false;
    config.vnpayHost = process.env.VNPAY_HOST_PROD || config.vnpayHost;
    config.returnUrl = process.env.VNPAY_RETURN_URL_PROD || config.returnUrl;
    config.ipnUrl = process.env.VNPAY_IPN_URL_PROD || config.ipnUrl;
  }

  return config;
};

/**
 * Create VNPay instance with environment configuration
 */
const createVNPayInstance = async (environment = 'development') => {
  const { VNPay } = await import('../vnpay/index.js');
  const config = getVNPayConfig(environment);

  // Validate configuration
  validateVNPayConfig();

  return new VNPay({
    vnpayHost: config.vnpayHost,
    tmnCode: config.tmnCode,
    secureSecret: config.secureSecret,
    testMode: config.testMode,
    hashAlgorithm: config.hashAlgorithm,
    vnp_Locale: config.locale,
    vnp_CurrCode: config.currencyCode,
    enableLog: config.enableLog,
    loggerFn: config.loggerFn,
    endpoints: {
      paymentEndpoint: config.paymentEndpoint,
      queryDrRefundEndpoint: config.queryDrRefundEndpoint,
      getBankListEndpoint: config.getBankListEndpoint,
    },
  });
};

export { vnpayConfig, validateVNPayConfig, getVNPayConfig, createVNPayInstance };
