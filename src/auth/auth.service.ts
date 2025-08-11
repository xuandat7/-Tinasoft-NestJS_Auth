import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppMailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { VerifyService } from 'src/verify/verify.service';
import { BadRequestException, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private verifyService: VerifyService,
    private mailService: AppMailService,
  ) {}

  async register(dto: any) {
    try {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = await this.usersService.create({ ...dto, password: hashedPassword });

      // Nếu create trả về mảng, lấy phần tử đầu tiên
      const createdUser = Array.isArray(user) ? user[0] : user;

      // Gửi xác minh bằng LINK
      const token = await this.verifyService.generateEmailToken(createdUser.email);
      await this.mailService.sendVerificationLink(createdUser.email, token);

      // Gửi OTP (bên cạnh link xác minh)
      const otp = this.verifyService.generateOtp(createdUser.email);
      await this.mailService.sendOtp(createdUser.email, otp);

      return {
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh.',
        user: createdUser,
      };
    } catch (error) {
      // Handle duplicate email error
      if (error.code === '23505') {
        throw new ConflictException('Email đã tồn tại');
      }
      // Re-throw other errors
      throw error;
    }
  }

  // Admin registration (only accessible with admin secret)
  async registerAdmin(dto: any, adminSecret: string) {
    // Check admin secret from environment
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'super-secret-admin-key';
    if (adminSecret !== ADMIN_SECRET) {
      throw new UnauthorizedException('Không có quyền tạo tài khoản admin');
    }

    try {
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const adminData = { 
        ...dto, 
        password: hashedPassword, 
        role: 'admin',
        isVerified: true // Admin không cần xác minh email
      };
      
      const admin = await this.usersService.create(adminData);
      const createdAdmin = Array.isArray(admin) ? admin[0] : admin;

      return {
        message: 'Tạo tài khoản admin thành công.',
        user: {
          id: createdAdmin.id,
          email: createdAdmin.email,
          role: createdAdmin.role,
          isVerified: createdAdmin.isVerified,
        },
      };
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email đã tồn tại');
      }
      throw error;
    }
  }

  async login(dto: any) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const timeLeft = Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${timeLeft} phút.`
      );
    }

    if (!user.isVerified) {
      throw new BadRequestException('Vui lòng xác minh email trước khi đăng nhập');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    
    if (!isPasswordValid) {
      // Increment failed attempts
      await this.usersService.incrementFailedAttempts(dto.email);
      
      // Calculate remaining attempts
      const remainingAttempts = Math.max(0, 5 - (user.failedLoginAttempts + 1));
      
      if (remainingAttempts === 0) {
        throw new UnauthorizedException('Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần');
      }
      
      throw new BadRequestException(
        `Sai email hoặc mật khẩu. Còn lại ${remainingAttempts} lần thử.`
      );
    }

    // Login successful - reset failed attempts
    await this.usersService.resetFailedAttempts(dto.email);

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
      },
    };
  }

  async resendLink(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    const token = await this.verifyService.generateEmailToken(email);
    await this.mailService.sendVerificationLink(email, token);
    return { message: 'Đã gửi lại link xác minh' };
  }

  async sendOtpRequest(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    const otp = this.verifyService.generateOtp(email);
    await this.mailService.sendOtp(email, otp);
    return { message: 'Đã gửi mã OTP đến email' };
  }
  
  // Verify OTP and mark user as verified
  async verifyOtp(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    const valid = this.verifyService.verifyOtp(email, code);
    if (!valid) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }
    await this.usersService.markAsVerified(email);
    return { success: true, message: 'Xác minh OTP thành công' };
  }

  // Admin function to unlock account
  async unlockAccount(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return this.usersService.unlockAccount(email);
  }

  // Forgot password - Generate reset token and send email
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Email không tồn tại trong hệ thống');
    }

    // Generate JWT token with 15 minutes expiry
    const payload = { email, type: 'reset' };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    // Send reset password email
    await this.mailService.sendPasswordResetLink(email, token);

    return { 
      message: 'Vui lòng kiểm tra email để reset mật khẩu. Link sẽ hết hạn sau 15 phút.' 
    };
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify JWT token
      const payload = this.jwtService.verify(token);
      
      // Check if token is for password reset
      if (payload.type !== 'reset') {
        throw new BadRequestException('Token không hợp lệ');
      }

      const { email } = payload;
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update user password
      await this.usersService.update(user.id, { password: hashedPassword });

      return { 
        message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới.' 
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token không hợp lệ');
      }
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token đã hết hạn. Vui lòng yêu cầu reset mật khẩu lại');
      }
      throw error;
    }
  }
}
