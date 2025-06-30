import crypto from 'crypto';
import { resolveUrlString } from './common.js';

/**
 * Function to build payment URL search parameters
 * @en Function to build payment URL search parameters
 */
function buildPaymentUrlSearchParams(data) {
  const params = new URLSearchParams();

  // Sort keys
  const sortedKeys = Object.keys(data).sort();

  // Add sorted parameters
  for (const key of sortedKeys) {
    if (data[key] !== undefined && data[key] !== null) {
      params.append(key, String(data[key]));
    }
  }

  return params;
}

/**
 * Function to create payment URL based on config and data
 * @en Function to create payment URL based on config and data
 */
function createPaymentUrl({ config, data }) {
  // Use the endpoints.paymentEndpoint if available, or fall back to config.paymentEndpoint for backward compatibility
  const paymentEndpoint = config.endpoints?.paymentEndpoint || config.paymentEndpoint;

  const redirectUrl = new URL(resolveUrlString(config.vnpayHost, paymentEndpoint));

  const searchParams = buildPaymentUrlSearchParams(data);
  redirectUrl.search = searchParams.toString();

  return redirectUrl;
}

/**
 * Function to calculate secure hash
 * @en Function to calculate secure hash
 */
function calculateSecureHash({ secureSecret, data, hashAlgorithm, bufferEncode }) {
  return crypto
    .createHmac(hashAlgorithm, secureSecret)
    .update(Buffer.from(data, bufferEncode))
    .digest('hex');
}

/**
 * Function to verify secure hash
 * @en Function to verify secure hash
 */
function verifySecureHash({ secureSecret, data, hashAlgorithm, receivedHash }) {
  const calculatedHash = crypto
    .createHmac(hashAlgorithm, secureSecret)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');

  return calculatedHash === receivedHash;
}

export { buildPaymentUrlSearchParams, createPaymentUrl, calculateSecureHash, verifySecureHash };
