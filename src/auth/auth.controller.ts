import { Controller, Post, Body, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailDto } from './dto/email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'abc@gmail.com' },
        password: { type: 'string', example: '123456' },
      },
    },
  })
  register(@Body() dto: any) {
    return this.authService.register(dto);
  }

  // Admin registration endpoint
  @Post('register-admin')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@gmail.com' },
        password: { type: 'string', example: '123456' },
        adminSecret: { type: 'string', example: 'super-secret-admin-key' },
      },
      required: ['email', 'password', 'adminSecret'],
    },
  })
  registerAdmin(@Body() dto: any) {
    const { adminSecret, ...userData } = dto;
    return this.authService.registerAdmin(userData, adminSecret);
  }

  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'abc@gmail.com' },
        password: { type: 'string', example: '123456' },
      },
    },
  })
  login(@Body() dto: any) {
    return this.authService.login(dto);
  }

  @Post('resend-link')
  @ApiConsumes('application/json')
  @ApiBody({ type: EmailDto })
  resendLink(@Body() dto: EmailDto) {
    return this.authService.resendLink(dto.email);
  }

  @Post('send-otp')
  @ApiConsumes('application/json')
  @ApiBody({ type: EmailDto })
  sendOtp(@Body() dto: EmailDto) {
    return this.authService.sendOtpRequest(dto.email);
  }

  @Post('verify-otp')
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        code: { type: 'string', example: '123456' },
      },
      required: ['email', 'code'],
    },
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.code);
  }

  // Admin endpoint to unlock account
  @Post('unlock-account')
  @ApiConsumes('application/json')
  @ApiBody({ type: EmailDto })
  @ApiResponse({ status: 200, description: 'Tài khoản đã được mở khóa thành công' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  unlockAccount(@Body() dto: EmailDto) {
    return this.authService.unlockAccount(dto.email);
  }

  // Forgot password endpoint
  @Post('forgot-password')
  @ApiConsumes('application/json')
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Email reset password đã được gửi' })
  @ApiResponse({ status: 404, description: 'Email không tồn tại trong hệ thống' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // Reset password endpoint
  @Post('reset-password')
  @ApiConsumes('application/json')
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Đặt lại mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 404, description: 'Người dùng không tồn tại' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  // GET endpoint to display reset password form
  @Get('/reset-password')
  @ApiResponse({ status: 200, description: 'Hiển thị form reset password' })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc đã hết hạn' })
  showResetPasswordForm(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Lỗi - Token không hợp lệ</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 50px; text-align: center; }
              .error { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1 class="error">Token không hợp lệ</h1>
            <p>Vui lòng yêu cầu reset password lại.</p>
          </body>
        </html>
      `);
    }

    // Return HTML form for password reset
    return res.send(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Đặt lại mật khẩu</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
          }
          h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: bold;
          }
          input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
          }
          input[type="password"]:focus {
            border-color: #667eea;
            outline: none;
          }
          .btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
          }
          .btn:hover {
            transform: translateY(-1px);
          }
          .message {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
          }
          .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Đặt lại mật khẩu</h1>
          <form id="resetForm">
            <div class="form-group">
              <label for="newPassword">Mật khẩu mới:</label>
              <input type="password" id="newPassword" name="newPassword" required minlength="6" placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)">
            </div>
            <div class="form-group">
              <label for="confirmPassword">Xác nhận mật khẩu:</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" placeholder="Nhập lại mật khẩu mới">
            </div>
            <button type="submit" class="btn">Đặt lại mật khẩu</button>
          </form>
          <div id="message"></div>
        </div>

        <script>
          document.getElementById('resetForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const messageDiv = document.getElementById('message');
            
            if (newPassword !== confirmPassword) {
              messageDiv.innerHTML = '<div class="message error">Mật khẩu xác nhận không khớp!</div>';
              return;
            }
            
            if (newPassword.length < 6) {
              messageDiv.innerHTML = '<div class="message error">Mật khẩu phải có ít nhất 6 ký tự!</div>';
              return;
            }
            
            try {
              const response = await fetch('/auth/reset-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  token: '${token}',
                  newPassword: newPassword
                })
              });
              
              const result = await response.json();
              
              if (response.ok) {
                messageDiv.innerHTML = '<div class="message success">' + result.message + '<br><br>Bạn có thể đóng trang này và đăng nhập với mật khẩu mới.</div>';
                document.getElementById('resetForm').style.display = 'none';
              } else {
                messageDiv.innerHTML = '<div class="message error">' + (result.message || 'Có lỗi xảy ra!') + '</div>';
              }
            } catch (error) {
              messageDiv.innerHTML = '<div class="message error">Có lỗi xảy ra. Vui lòng thử lại!</div>';
            }
          });
        </script>
      </body>
      </html>
    `);
  }
}
