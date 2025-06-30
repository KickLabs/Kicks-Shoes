import {
  QUERY_DR_REFUND_ENDPOINT,
  QUERY_DR_RESPONSE_MAP,
  REFUND_RESPONSE_MAP,
  VNP_VERSION,
  WRONG_CHECKSUM_KEY,
} from '../constants/index.js';
import { getResponseByStatusCode, hash, resolveUrlString } from '../utils/common.js';

/**
 * Dịch vụ truy vấn kết quả và hoàn tiền VNPay
 * @en Query and refund service for VNPay
 */
export class QueryService {
  /**
   * Khởi tạo dịch vụ truy vấn
   * @en Initialize query service
   *
   * @param config - Cấu hình VNPay
   * @en @param config - VNPay configuration
   *
   * @param logger - Dịch vụ logger
   * @en @param logger - Logger service
   *
   * @param hashAlgorithm - Thuật toán băm
   * @en @param hashAlgorithm - Hash algorithm
   */
  constructor(config, logger, hashAlgorithm) {
    this.config = config;
    this.logger = logger;
    this.hashAlgorithm = hashAlgorithm;
    this.bufferEncode = 'utf-8';
  }

  /**
   * Đây là API để hệ thống merchant truy vấn kết quả thanh toán của giao dịch tại hệ thống VNPAY.
   * @en This is the API for the merchant system to query the payment result of the transaction at the VNPAY system.
   *
   * @param {QueryDr} query - Dữ liệu truy vấn kết quả thanh toán
   * @en @param {QueryDr} query - The data to query payment result
   *
   * @param {QueryDrResponseOptions<LoggerFields>} options - Tùy chọn
   * @en @param {QueryDrResponseOptions<LoggerFields>} options - Options
   *
   * @returns {Promise<QueryDrResponse>} Kết quả truy vấn
   * @en @returns {Promise<QueryDrResponse>} The query result
   */
  async queryDr(query, options) {
    const command = 'querydr';
    const dataQuery = {
      vnp_Version: this.config.vnp_Version ?? VNP_VERSION,
      ...query,
    };

    const queryEndpoint = this.config.endpoints.queryDrRefundEndpoint || QUERY_DR_REFUND_ENDPOINT;
    const url = new URL(
      resolveUrlString(this.config.queryDrAndRefundHost || this.config.vnpayHost, queryEndpoint)
    );

    const stringToCreateHash = [
      dataQuery.vnp_RequestId,
      dataQuery.vnp_Version,
      command,
      this.config.tmnCode,
      dataQuery.vnp_TxnRef,
      dataQuery.vnp_TransactionDate,
      dataQuery.vnp_CreateDate,
      dataQuery.vnp_IpAddr,
      dataQuery.vnp_OrderInfo,
    ]
      .map(String)
      .join('|')
      .replace(/undefined/g, '');

    const requestHashed = hash(
      this.config.secureSecret,
      Buffer.from(stringToCreateHash, this.bufferEncode),
      this.hashAlgorithm
    );

    const body = {
      ...dataQuery,
      vnp_Command: command,
      vnp_TmnCode: this.config.tmnCode,
      vnp_SecureHash: requestHashed,
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    const message = getResponseByStatusCode(
      responseData.vnp_ResponseCode?.toString() ?? '',
      this.config.vnp_Locale,
      QUERY_DR_RESPONSE_MAP
    );

    let outputResults = {
      isVerified: true,
      isSuccess: responseData.vnp_ResponseCode === '00' || responseData.vnp_ResponseCode === 0,
      message,
      ...responseData,
      vnp_Message: message,
    };

    const stringToCreateHashOfResponse = [
      responseData.vnp_ResponseId,
      responseData.vnp_Command,
      responseData.vnp_ResponseCode,
      responseData.vnp_Message,
      this.config.tmnCode,
      responseData.vnp_TxnRef,
      responseData.vnp_Amount,
      responseData.vnp_BankCode,
      responseData.vnp_PayDate,
      responseData.vnp_TransactionNo,
      responseData.vnp_TransactionType,
      responseData.vnp_TransactionStatus,
      responseData.vnp_OrderInfo,
      responseData.vnp_PromotionCode,
      responseData.vnp_PromotionAmount,
    ]
      .map(String)
      .join('|')
      .replace(/undefined/g, '');

    const responseHashed = hash(
      this.config.secureSecret,
      Buffer.from(stringToCreateHashOfResponse, this.bufferEncode),
      this.hashAlgorithm
    );

    if (responseData?.vnp_SecureHash && responseHashed !== responseData.vnp_SecureHash) {
      outputResults = {
        ...outputResults,
        isVerified: false,
        message: getResponseByStatusCode(
          WRONG_CHECKSUM_KEY,
          this.config.vnp_Locale,
          QUERY_DR_RESPONSE_MAP
        ),
      };
    }

    const data2Log = {
      createdAt: new Date(),
      method: 'queryDr',
      ...outputResults,
    };

    this.logger.log(data2Log, options, 'queryDr');

    return outputResults;
  }

  /**
   * Đây là API để hệ thống merchant gửi yêu cầu hoàn tiền cho giao dịch qua hệ thống Cổng thanh toán VNPAY.
   * @en This is the API for the merchant system to refund the transaction at the VNPAY system.
   *
   * @param {Refund} data - Dữ liệu yêu cầu hoàn tiền
   * @en @param {Refund} data - The data to request refund
   *
   * @param {RefundOptions<LoggerFields>} options - Tùy chọn
   * @en @param {RefundOptions<LoggerFields>} options - Options
   *
   * @returns {Promise<RefundResponse>} Kết quả hoàn tiền
   * @en @returns {Promise<RefundResponse>} The refund result
   */
  async refund(data, options) {
    const command = 'refund';
    const dataRefund = {
      vnp_Version: this.config.vnp_Version ?? VNP_VERSION,
      ...data,
    };

    const refundEndpoint = this.config.endpoints.queryDrRefundEndpoint || QUERY_DR_REFUND_ENDPOINT;
    const url = new URL(
      resolveUrlString(this.config.queryDrAndRefundHost || this.config.vnpayHost, refundEndpoint)
    );

    const stringToCreateHash = [
      dataRefund.vnp_RequestId,
      dataRefund.vnp_Version,
      command,
      this.config.tmnCode,
      dataRefund.vnp_TransactionType,
      dataRefund.vnp_TxnRef,
      dataRefund.vnp_Amount,
      dataRefund.vnp_TransactionDate,
      dataRefund.vnp_CreateDate,
      dataRefund.vnp_IpAddr,
      dataRefund.vnp_OrderInfo,
      dataRefund.vnp_TransactionNo,
    ]
      .map(String)
      .join('|')
      .replace(/undefined/g, '');

    const requestHashed = hash(
      this.config.secureSecret,
      Buffer.from(stringToCreateHash, this.bufferEncode),
      this.hashAlgorithm
    );

    const body = {
      ...dataRefund,
      vnp_Command: command,
      vnp_TmnCode: this.config.tmnCode,
      vnp_SecureHash: requestHashed,
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    const message = getResponseByStatusCode(
      responseData.vnp_ResponseCode?.toString() ?? '',
      this.config.vnp_Locale,
      REFUND_RESPONSE_MAP
    );

    let outputResults = {
      isVerified: true,
      isSuccess: responseData.vnp_ResponseCode === '00' || responseData.vnp_ResponseCode === 0,
      message,
      ...responseData,
      vnp_Message: message,
    };

    const stringToCreateHashOfResponse = [
      responseData.vnp_ResponseId,
      responseData.vnp_Command,
      responseData.vnp_ResponseCode,
      responseData.vnp_Message,
      this.config.tmnCode,
      responseData.vnp_TxnRef,
      responseData.vnp_Amount,
      responseData.vnp_TransactionDate,
      responseData.vnp_TransactionNo,
      responseData.vnp_OrderInfo,
    ]
      .map(String)
      .join('|')
      .replace(/undefined/g, '');

    const responseHashed = hash(
      this.config.secureSecret,
      Buffer.from(stringToCreateHashOfResponse, this.bufferEncode),
      this.hashAlgorithm
    );

    if (responseData?.vnp_SecureHash && responseHashed !== responseData.vnp_SecureHash) {
      outputResults = {
        ...outputResults,
        isVerified: false,
        message: getResponseByStatusCode(
          WRONG_CHECKSUM_KEY,
          this.config.vnp_Locale,
          REFUND_RESPONSE_MAP
        ),
      };
    }

    const data2Log = {
      createdAt: new Date(),
      method: 'refund',
      ...outputResults,
    };

    this.logger.log(data2Log, options, 'refund');

    return outputResults;
  }
}
