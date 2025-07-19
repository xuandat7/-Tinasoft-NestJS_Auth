import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { VerifyService } from './verify.service';

@Controller('auth')
export class VerifyController {
  constructor(private verifyService: VerifyService) {}

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.verifyService.verifyEmailToken(token);
  }

  // @Post('verify-otp')
  // verifyOtp(@Body() body: { email: string; code: string }) {
  //   const valid = this.verifyService.verifyOtp(body.email, body.code);
  //   if (!valid) return { success: false, message: 'OTP không hợp lệ hoặc đã hết hạn' };
  //   return { success: true, message: 'Xác minh OTP thành công' };
  // }
}