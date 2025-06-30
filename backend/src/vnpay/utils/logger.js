import fs from 'fs';

/**
 * Pass to `loggerFn` for ignoring logger
 *
 * @en Pass to `loggerFn` for ignoring logger
 * @returns {void}
 */
function ignoreLogger() {}

/**
 * Log data to console
 *
 * @en Log data to console
 * @param data - Data to be logged
 */
function consoleLogger(data, symbol = 'log') {
  if (typeof console[symbol] === 'function') {
    console[symbol](data);
  }
}

/**
 * Log data to file
 *
 * @en Log data to file
 * @param data Data to be logged
 * @param filePath File path to be written
 * @param errorCallback Error callback function
 */
function fileLogger(data, filePath, errorCallback) {
  const dataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
  fs.appendFile(filePath, `${dataString}\n`, err => {
    if (err && typeof errorCallback === 'function') {
      return errorCallback(err);
    }

    if (err) {
      console.error('Failed to write to file:', err);
      throw err;
    }
  });
}

export { ignoreLogger, consoleLogger, fileLogger };
