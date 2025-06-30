import { consoleLogger, ignoreLogger } from '../utils/index.js';

/**
 * Lớp dịch vụ xử lý log cho VNPay
 * @en Logger service class for VNPay
 */
class LoggerService {
  constructor(isEnabled = false, customLoggerFn) {
    this.isEnabled = isEnabled;
    this.loggerFn = customLoggerFn || (isEnabled ? consoleLogger : ignoreLogger);
  }

  /**
   * Ghi log dữ liệu
   * @en Log data
   *
   * @param data - Dữ liệu cần log
   * @en @param data - Data to log
   *
   * @param options - Tùy chọn log
   * @en @param options - Logging options
   *
   * @param methodName - Tên phương thức gọi log
   * @en @param methodName - Method name that calls the log
   */
  log(data, options, methodName) {
    if (!this.isEnabled) return;

    const logData = { ...data };

    if (methodName) {
      Object.assign(logData, { method: methodName, createdAt: new Date() });
    }

    if (options?.logger && 'fields' in options.logger) {
      const { type, fields } = options.logger;

      for (const key of Object.keys(logData)) {
        if (
          (type === 'omit' && fields.includes(key)) ||
          (type === 'pick' && !fields.includes(key))
        ) {
          delete logData[key];
        }
      }
    }

    // Execute logger function
    (options?.logger?.loggerFn || this.loggerFn)(logData);
  }
}

export { LoggerService };
