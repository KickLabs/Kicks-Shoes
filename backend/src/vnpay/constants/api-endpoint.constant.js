export const VNPAY_GATEWAY_SANDBOX_HOST = 'https://sandbox.vnpayment.vn';
export const PAYMENT_ENDPOINT = 'paymentv2/vpcpay.html';
export const QUERY_DR_REFUND_ENDPOINT = 'merchant_webapi/api/transaction';
export const GET_BANK_LIST_ENDPOINT = 'qrpayauth/api/merchant/get_bank_list';

const VNP_API_ENDPOINT = {
  PAYMENT: PAYMENT_ENDPOINT,
  QUERY_DR: QUERY_DR_REFUND_ENDPOINT,
  REFUND: QUERY_DR_REFUND_ENDPOINT,
  GET_BANK_LIST: GET_BANK_LIST_ENDPOINT,
};

const apiEndpoint = {
  VNPAY_GATEWAY_SANDBOX_HOST,
  ...VNP_API_ENDPOINT,
};

export default apiEndpoint;
