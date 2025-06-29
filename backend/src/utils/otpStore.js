// utils/otpStore.js

const otpStore = new Map();

export const saveOtp = (email, otp, expiresAt) => {
  otpStore.set(email, { otp, expiresAt });
};

export const verifyOtpCode = (email, inputOtp) => {
  const record = otpStore.get(email);
  if (!record) return false;
  if (record.expiresAt < new Date()) return false;
  return record.otp === inputOtp;
};

export const deleteOtp = email => {
  otpStore.delete(email);
};
