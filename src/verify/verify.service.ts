import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class VerifyService {
  private otpStorage = new Map<string, { code: string; expiresAt: number }>();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async generateEmailToken(email: string): Promise<string> {
    return this.jwtService.sign({ email }, { expiresIn: '15m' });
  }

  async verifyEmailToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const email = payload.email;
      await this.usersService.markAsVerified(email);
      return { message: 'Xác minh thành công' };
    } catch (err) {
      throw new BadRequestException('Token không hợp lệ hoặc hết hạn');
    }
  }

  generateOtp(email: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStorage.set(email, {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 phút
    });
    return otp;
  }

  verifyOtp(email: string, code: string): boolean {
    const record = this.otpStorage.get(email);
    if (!record) return false;
    const isValid = record.code === code && record.expiresAt > Date.now();
    if (isValid) this.otpStorage.delete(email);
    return isValid;
  }
}