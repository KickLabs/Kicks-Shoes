/**
 * The response must to be sent to VNPAY after receiving the IPN request
 */

const IpnSuccess = {
  RspCode: '00',
  Message: 'Confirm Success',
};

const IpnOrderNotFound = {
  RspCode: '01',
  Message: 'Order not found',
};

const InpOrderAlreadyConfirmed = {
  RspCode: '02',
  Message: 'Order already confirmed',
};

const IpnIpProhibited = {
  RspCode: '03',
  Message: 'IP prohibited',
};

const IpnInvalidAmount = {
  RspCode: '04',
  Message: 'Invalid amount',
};

const IpnFailChecksum = {
  RspCode: '97',
  Message: 'Fail checksum',
};

const IpnUnknownError = {
  RspCode: '99',
  Message: 'Unknown error',
};

const ipnResult = {
  IpnSuccess,
  IpnOrderNotFound,
  InpOrderAlreadyConfirmed,
  IpnIpProhibited,
  IpnInvalidAmount,
  IpnFailChecksum,
  IpnUnknownError,
};

export default ipnResult;
