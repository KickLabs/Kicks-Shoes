import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { validateEmail, validatePhone } from '../utils/validation.js';
import EmailService from './email.service.js';

export class OtpService {
  /**
   * Đăng ký tài khoản mới và gửi mã OTP
   */
  static async registerApp(userData) {
    const { fullName, email, phone, password, address } = userData;

    if (!fullName || !email || !phone || !password) {
      throw new Error('Missing required fields: fullName, email, phone, password');
    }

    if (!validateEmail(email)) throw new Error('Invalid email format');
    if (!validatePhone(phone)) throw new Error('Invalid phone format');

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = OtpService.generateOtp();

    const user = new User({
      fullName,
      username: email.split('@')[0],
      email,
      phone,
      password: hashedPassword,
      address,
      isVerified: false,
      verificationToken: otpCode,
      verificationTokenExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    });

    await user.save();

    await EmailService.sendTemplatedEmail(email, emailTemplates.OTP, {
      name: user.fullName,
      otp: otpCode,
    });

    return {
      message: 'Registered successfully. Please verify OTP sent to your email.',
    };
  }

  /**
   * Xác minh OTP
   */
  static async verifyOtp(email, otpInput) {
    const user = await User.findOne({ email }).select(
      '+verificationToken +verificationTokenExpires'
    );

    if (!user) throw new Error('User not found');
    if (user.isVerified) throw new Error('User is already verified');

    if (user.verificationToken !== otpInput || user.verificationTokenExpires < Date.now()) {
      throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    const token = OtpService.generateToken(user._id);
    const refreshToken = OtpService.generateRefreshToken(user._id);

    return {
      user: OtpService.formatUserResponse(user),
      token,
      refreshToken,
    };
  }

  /**
   * Gửi lại mã OTP
   */
  static async resendOtp(email) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');
    if (user.isVerified) throw new Error('User is already verified');

    const newOtp = OtpService.generateOtp();
    user.verificationToken = newOtp;
    user.verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await EmailService.sendTemplatedEmail(email, emailTemplates.OTP, {
      name: user.fullName,
      otp: newOtp,
    });

    return { message: 'OTP has been resent to your email.' };
  }

  /**
   * Sinh mã OTP 6 chữ số
   */
  static generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sinh JWT token truy cập
   */
  static generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  }

  /**
   * Sinh JWT refresh token
   */
  static generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  /**
   * Format thông tin user trả về client
   */
  static formatUserResponse(user) {
    return {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
