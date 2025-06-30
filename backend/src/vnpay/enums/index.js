export * from './product-code.enum.js';

export const UrlService = {
  sandbox: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
};

export const HashAlgorithm = {
  SHA256: 'SHA256',
  SHA512: 'SHA512',
  MD5: 'MD5',
};

export const VnpCurrCode = {
  VND: 'VND',
};

export const VnpLocale = {
  VN: 'vn',
  EN: 'en',
};

export const VnpCardType = {
  ATM: 'ATM',
  QRCODE: 'QRCODE',
};

export const VnpTransactionType = {
  PAYMENT: '01',
  FULL_REFUND: '02',
  PARTIAL_REFUND: '03',
};

export const RefundTransactionType = {
  FULL_REFUND: '02',
  PARTIAL_REFUND: '03',
};
