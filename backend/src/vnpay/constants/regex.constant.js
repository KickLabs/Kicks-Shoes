export const numberRegex = /^[0-9]+$/;

export const VNP_REGEX = {
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: numberRegex,
  DATE: /^\d{8}$/,
  TIME: /^\d{6}$/,
  DATETIME: /^\d{14}$/,
};
