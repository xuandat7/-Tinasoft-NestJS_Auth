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

  async sendPasswordResetLink(email: string, token: string) {
    const url = `http://localhost:3000/reset-password?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Đặt lại mật khẩu',
        template: 'reset-password',
        context: { 
          url, 
          email,
          expiryTime: '15 phút'
        },
      });
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send password reset email:', error.message);
      // As a fallback, send a simple HTML email without using templates
      if (error.code === 'ENOENT') {
        await this.mailerService.sendMail({
          to: email,
          subject: 'Đặt lại mật khẩu',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Đặt lại mật khẩu</h2>
              <p>Chào bạn,</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.</p>
              <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
              </div>
              <p><strong>Lưu ý:</strong> Link này sẽ hết hạn sau 15 phút.</p>
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">Email này được gửi tự động. Vui lòng không trả lời email này.</p>
            </div>
          `,
        });
        console.log(`Fallback password reset email sent to ${email}`);
      } else {
        throw error;
      }
    }
  }
}