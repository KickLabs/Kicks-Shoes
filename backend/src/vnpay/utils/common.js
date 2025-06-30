import crypto from 'crypto';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

// Setup plugins
dayjs.extend(utc);
dayjs.extend(timezone);

function getDateInGMT7(date) {
  const inputDate = date ?? new Date();
  const utcDate = dayjs.utc(inputDate);
  return new Date(utcDate.add(7, 'hour').valueOf());
}

function dateFormat(date, format = 'yyyyMMddHHmmss') {
  const pad = n => (n < 10 ? `0${n}` : n).toString();
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());

  return Number(
    format
      .replace('yyyy', year.toString())
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second)
  );
}

function parseDate(dateNumber, tz = 'local') {
  const dateString = dateNumber.toString();
  const _parseInt = Number.parseInt;

  const year = _parseInt(dateString.slice(0, 4));
  const month = _parseInt(dateString.slice(4, 6)) - 1;
  const day = _parseInt(dateString.slice(6, 8));
  const hour = _parseInt(dateString.slice(8, 10));
  const minute = _parseInt(dateString.slice(10, 12));
  const second = _parseInt(dateString.slice(12, 14));

  const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

  switch (tz) {
    case 'utc':
      return dayjs.utc(formattedDate).toDate();
    case 'gmt7':
      const localDate = new Date(year, month, day, hour, minute, second);
      const utcTime = dayjs.utc(localDate);
      return utcTime.add(7, 'hour').toDate();
    case 'local':
    default:
      return new Date(year, month, day, hour, minute, second);
  }
}

function isValidVnpayDateFormat(date) {
  const dateString = date.toString();
  const regex =
    /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])([01][0-9]|2[0-3])[0-5][0-9][0-5][0-9]$/;
  return regex.test(dateString);
}

function generateRandomString(length, options = {}) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  if (options?.onlyNumber) {
    characters = '0123456789';
  }
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += `${characters[(Math.random() * charactersLength) | 0]}`;
  }
  return result;
}

function getResponseByStatusCode(responseCode = '', locale = 'vn', responseMap) {
  const respondText = responseMap.get(responseCode) ?? responseMap.get('default');
  return respondText[locale];
}

function resolveUrlString(host, path) {
  let trimmedHost = host.trim();
  let trimmedPath = path.trim();

  while (trimmedHost.endsWith('/') || trimmedHost.endsWith('\\')) {
    trimmedHost = trimmedHost.slice(0, -1);
  }
  while (trimmedPath.startsWith('/') || trimmedPath.startsWith('\\')) {
    trimmedPath = trimmedPath.slice(1);
  }
  return `${trimmedHost}/${trimmedPath}`;
}

function hash(secret, data, algorithm) {
  return crypto.createHmac(algorithm, secret).update(data.toString()).digest('hex');
}

export {
  getDateInGMT7,
  dateFormat,
  parseDate,
  isValidVnpayDateFormat,
  generateRandomString,
  getResponseByStatusCode,
  resolveUrlString,
  hash,
};
