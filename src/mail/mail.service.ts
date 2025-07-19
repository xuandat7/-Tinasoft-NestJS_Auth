import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AppMailService {
  constructor(private mailerService: MailerService) {}

  async sendVerificationLink(email: string, token: string) {
    const url = `http://localhost:3000/auth/verify-email?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Xác minh tài khoản',
        template: 'verify-link',
        context: { url },
      });
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error.message);
      // As a fallback, send a simple HTML email without using templates
      if (error.code === 'ENOENT') {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Xác minh tài khoản',
          html: `
            <h2>Chào bạn,</h2>
            <p>Vui lòng nhấn vào link dưới đây để xác minh tài khoản:</p>
            <p><a href="${url}">Xác minh tài khoản</a></p>
          `,
        });
        console.log(`Fallback verification email sent to ${email}`);
      } else {
        throw error;
      }
    }
  }

  async sendOtp(email: string, otpCode: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Mã xác thực OTP',
        template: 'otp',
        context: { otpCode },
      });
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send OTP email:', error.message);
      // As a fallback, send a simple HTML email without using templates
      if (error.code === 'ENOENT') {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Mã xác thực OTP',
          html: `
            <h2>Chào bạn,</h2>
            <p>Mã OTP của bạn là: <strong>${otpCode}</strong></p>
            <p>Hãy nhập mã này để hoàn tất đăng ký.</p>
          `,
        });
        console.log(`Fallback OTP email sent to ${email}`);
      } else {
        throw error;
      }
    }
  }
}