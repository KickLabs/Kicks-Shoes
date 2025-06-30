import { VNP_DEFAULT_COMMAND, VNP_VERSION } from '../constants/index.js';
import { ProductCode, VnpCurrCode, VnpLocale } from '../enums/index.js';
import { dateFormat, getDateInGMT7, isValidVnpayDateFormat } from '../utils/common.js';
import {
  buildPaymentUrlSearchParams,
  calculateSecureHash,
  createPaymentUrl,
} from '../utils/payment.util.js';

/**
 * Dịch vụ xử lý thanh toán của VNPay
 * @en Payment service for VNPay
 */
export class PaymentService {
  /**
   * Khởi tạo dịch vụ thanh toán
   * @en Initialize payment service
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
    this.hashAlgorithm = hashAlgorithm;
    this.logger = logger;
    this.bufferEncode = 'utf-8';

    this.defaultConfig = {
      vnp_TmnCode: config.tmnCode,
      vnp_Version: config.vnp_Version,
      vnp_CurrCode: config.vnp_CurrCode,
      vnp_Locale: config.vnp_Locale,
      vnp_Command: config.vnp_Command,
      vnp_OrderType: config.vnp_OrderType,
    };
  }

  /**
   * Phương thức xây dựng, tạo thành url thanh toán của VNPay
   * @en Build the payment url
   *
   * @param {BuildPaymentUrl} data - Thông tin thanh toán
   * @en @param {BuildPaymentUrl} data - Payment information
   *
   * @param {BuildPaymentUrlOptions<LoggerFields>} options - Tùy chọn
   * @en @param {BuildPaymentUrlOptions<LoggerFields>} options - Options
   *
   * @returns {string} - URL thanh toán
   * @en @returns {string} - Payment URL
   */
  buildPaymentUrl(data, options) {
    const dataToBuild = {
      ...this.defaultConfig,
      ...data,

      // Multiply by 100 to follow VNPay standard
      vnp_Amount: data.vnp_Amount * 100,
    };

    if (dataToBuild?.vnp_ExpireDate && !isValidVnpayDateFormat(dataToBuild.vnp_ExpireDate)) {
      throw new Error(
        'Invalid vnp_ExpireDate format. Use `dateFormat` utility function to format it'
      );
    }

    if (!isValidVnpayDateFormat(dataToBuild?.vnp_CreateDate ?? 0)) {
      const timeGMT7 = getDateInGMT7();
      dataToBuild.vnp_CreateDate = dateFormat(timeGMT7, 'yyyyMMddHHmmss');
    }

    const redirectUrl = createPaymentUrl({
      config: this.config,
      data: dataToBuild,
    });

    const signed = calculateSecureHash({
      secureSecret: this.config.secureSecret,
      data: redirectUrl.search.slice(1).toString(),
      hashAlgorithm: this.hashAlgorithm,
      bufferEncode: this.bufferEncode,
    });
    redirectUrl.searchParams.append('vnp_SecureHash', signed);

    // Log if enabled
    const data2Log = {
      createdAt: new Date(),
      method: 'buildPaymentUrl',
      paymentUrl: options?.withHash
        ? redirectUrl.toString()
        : (() => {
            const cloneUrl = new URL(redirectUrl.toString());
            cloneUrl.searchParams.delete('vnp_SecureHash');
            return cloneUrl.toString();
          })(),
      ...dataToBuild,
    };

    this.logger.log(data2Log, options, 'buildPaymentUrl');

    return redirectUrl.toString();
  }
}
