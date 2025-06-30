import {
  GET_BANK_LIST_ENDPOINT,
  PAYMENT_ENDPOINT,
  QUERY_DR_REFUND_ENDPOINT,
  VNPAY_GATEWAY_SANDBOX_HOST,
  VNP_DEFAULT_COMMAND,
  VNP_VERSION,
} from './constants/index.js';
import { HashAlgorithm, ProductCode, VnpCurrCode, VnpLocale } from './enums/index.js';
import { LoggerService } from './services/logger.service.js';
import { PaymentService } from './services/payment.service.js';
import { QueryService } from './services/query.service.js';
import { VerificationService } from './services/verification.service.js';
import { resolveUrlString } from './utils/common.js';

/**
 * VNPay class to support VNPay payment
 * @en VNPay class to support VNPay payment
 * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 *
 * @example
 * import { VNPay } from './vnpay.js';
 *
 * const vnpay = new VNPay({
 *     vnpayHost: 'https://sandbox.vnpayment.vn',
 *     tmnCode: 'TMNCODE',
 *     secureSecret: 'SERCRET',
 *     testMode: true, // optional
 *     hashAlgorithm: 'SHA512', // optional
 *     // Using new endpoints configuration
 *     endpoints: {
 *       paymentEndpoint: 'paymentv2/vpcpay.html',
 *       queryDrRefundEndpoint: 'merchant_webapi/api/transaction',
 *       getBankListEndpoint: 'qrpayauth/api/merchant/get_bank_list',
 *     }
 * });
 *
 * const tnx = '12345678'; // Generate your own transaction code
 * const urlString = vnpay.buildPaymentUrl({
 *     vnp_Amount: 100000,
 *     vnp_IpAddr: '192.168.0.1',
 *     vnp_ReturnUrl: 'http://localhost:8888/order/vnpay_return',
 *     vnp_TxnRef: tnx,
 *     vnp_OrderInfo: `Payment for transaction: ${tnx}`,
 * }),
 *
 */
class VNPay {
  /**
   * Initialize VNPay instance
   * @en Initialize VNPay instance
   *
   * @param {VNPayConfig} config - VNPay configuration
   */
  constructor({
    vnpayHost = VNPAY_GATEWAY_SANDBOX_HOST,
    queryDrAndRefundHost = VNPAY_GATEWAY_SANDBOX_HOST,
    vnp_Version = VNP_VERSION,
    vnp_CurrCode = VnpCurrCode.VND,
    vnp_Locale = VnpLocale.VN,
    testMode = false,
    paymentEndpoint = PAYMENT_ENDPOINT,
    endpoints = {},
    ...config
  }) {
    if (testMode) {
      vnpayHost = VNPAY_GATEWAY_SANDBOX_HOST;
      queryDrAndRefundHost = VNPAY_GATEWAY_SANDBOX_HOST;
    }

    this.hashAlgorithm = config?.hashAlgorithm ?? HashAlgorithm.SHA512;

    // Initialize endpoints with defaults and overrides
    const initializedEndpoints = {
      paymentEndpoint: endpoints.paymentEndpoint || paymentEndpoint,
      queryDrRefundEndpoint: endpoints.queryDrRefundEndpoint || QUERY_DR_REFUND_ENDPOINT,
      getBankListEndpoint: endpoints.getBankListEndpoint || GET_BANK_LIST_ENDPOINT,
    };

    this.globalConfig = {
      vnpayHost,
      vnp_Version,
      vnp_CurrCode,
      vnp_Locale,
      vnp_OrderType: ProductCode.Other,
      vnp_Command: VNP_DEFAULT_COMMAND,
      paymentEndpoint: initializedEndpoints.paymentEndpoint,
      endpoints: initializedEndpoints,
      queryDrAndRefundHost,
      ...config,
    };

    this.loggerService = new LoggerService(config?.enableLog ?? false, config?.loggerFn);

    this.paymentService = new PaymentService(
      this.globalConfig,
      this.loggerService,
      this.hashAlgorithm
    );

    this.verificationService = new VerificationService(
      this.globalConfig,
      this.loggerService,
      this.hashAlgorithm
    );

    this.queryService = new QueryService(this.globalConfig, this.loggerService, this.hashAlgorithm);
  }

  /**
   * Get default config of VNPay
   * @en Get default config of VNPay
   *
   * @returns {DefaultConfig} Default configuration
   * @en @returns {DefaultConfig} Default configuration
   */
  get defaultConfig() {
    return {
      vnp_TmnCode: this.globalConfig.tmnCode,
      vnp_Version: this.globalConfig.vnp_Version,
      vnp_CurrCode: this.globalConfig.vnp_CurrCode,
      vnp_Locale: this.globalConfig.vnp_Locale,
      vnp_Command: this.globalConfig.vnp_Command,
      vnp_OrderType: this.globalConfig.vnp_OrderType,
    };
  }

  /**
   * Get list of banks supported by VNPay
   * @en Get list of banks supported by VNPay
   *
   * @returns {Promise<Bank[]>} List of banks
   * @en @returns {Promise<Bank[]>} List of banks
   */
  async getBankList() {
    const response = await fetch(
      resolveUrlString(
        this.globalConfig.vnpayHost ?? VNPAY_GATEWAY_SANDBOX_HOST,
        this.globalConfig.endpoints.getBankListEndpoint
      ),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `tmn_code=${this.globalConfig.tmnCode}`,
      }
    );

    const bankList = await response.json();

    for (const bank of bankList) {
      bank.logo_link = resolveUrlString(
        this.globalConfig.vnpayHost ?? VNPAY_GATEWAY_SANDBOX_HOST,
        bank.logo_link.slice(1)
      );
    }

    return bankList;
  }

  /**
   * Build the payment url
   * @en Build the payment url
   *
   * @param {BuildPaymentUrl} data - Payment data required to create URL
   * @en @param {BuildPaymentUrl} data - Payment data required to create URL
   *
   * @param {BuildPaymentUrlOptions<LoggerFields>} options - Additional options
   * @en @param {BuildPaymentUrlOptions<LoggerFields>} options - Additional options
   *
   * @returns {string} Payment URL
   * @en @returns {string} Payment URL
   * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html#tao-url-thanh-toan
   */
  buildPaymentUrl(data, options) {
    return this.paymentService.buildPaymentUrl(data, options);
  }

  /**
   * Method to verify the return url from VNPay
   * @en Method to verify the return url from VNPay
   *
   * @param {ReturnQueryFromVNPay} query - The object of data returned from VNPay
   * @en @param {ReturnQueryFromVNPay} query - The object of data returned from VNPay
   *
   * @param {VerifyReturnUrlOptions<LoggerFields>} options - Options for verification
   * @en @param {VerifyReturnUrlOptions<LoggerFields>} options - Options for verification
   *
   * @returns {VerifyReturnUrl} Verification result
   * @en @returns {VerifyReturnUrl} Verification result
   * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html#code-returnurl
   */
  verifyReturnUrl(query, options) {
    return this.verificationService.verifyReturnUrl(query, options);
  }

  /**
   * Method to verify the ipn call from VNPay
   *
   * After receiving the call, the merchant system needs to verify the data received from VNPay,
   * check if the order is valid, check if the payment amount is correct.
   *
   * Then respond to VNPay the verification result through `IpnResponse`
   *
   * @en Method to verify the ipn call from VNPay
   *
   * After receiving the call, the merchant system needs to verify the data received from VNPay,
   * check if the order is valid, check if the payment amount is correct.
   *
   * Then respond to VNPay the verification result through `IpnResponse`
   *
   * @param {ReturnQueryFromVNPay} query - The object of data returned from VNPay
   * @en @param {ReturnQueryFromVNPay} query - The object of data returned from VNPay
   *
   * @param {VerifyIpnCallOptions<LoggerFields>} options - Options for verification
   * @en @param {VerifyIpnCallOptions<LoggerFields>} options - Options for verification
   *
   * @returns {VerifyIpnCall} Verification result
   * @en @returns {VerifyIpnCall} Verification result
   * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html#code-ipn
   */
  verifyIpnCall(query, options) {
    return this.verificationService.verifyIpnCall(query, options);
  }

  /**
   * Method to query payment result
   * @en Method to query payment result
   *
   * @param {QueryDr} query - Query data
   * @en @param {QueryDr} query - Query data
   *
   * @param {QueryDrResponseOptions<LoggerFields>} options - Options
   * @en @param {QueryDrResponseOptions<LoggerFields>} options - Options
   *
   * @returns {Promise<QueryDrResponse>} Query result
   * @en @returns {Promise<QueryDrResponse>} Query result
   * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html#truy-van-ket-qua-thanh-toan
   */
  async queryDr(query, options) {
    return this.queryService.queryDr(query, options);
  }

  /**
   * Method to refund
   * @en Method to refund
   *
   * @param {Refund} data - Refund data
   * @en @param {Refund} data - Refund data
   *
   * @param {RefundOptions<LoggerFields>} options - Options
   * @en @param {RefundOptions<LoggerFields>} options - Options
   *
   * @returns {Promise<RefundResponse>} Refund result
   * @en @returns {Promise<RefundResponse>} Refund result
   * @see https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html#hoan-tien
   */
  async refund(data, options) {
    return this.queryService.refund(data, options);
  }
}

export { VNPay };
