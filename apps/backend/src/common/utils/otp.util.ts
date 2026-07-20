import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';

const OTP_TTL_MS = 10 * 60 * 1000;

export function generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function buildInviteOtpResponse(otp: string, otpExpiresAt: Date) {
  return {
    message:
      'OTP generated for testing. SMS/email delivery is not configured yet.',
    otp,
    otpExpiresAt,
  };
}
