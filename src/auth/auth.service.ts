import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppMailService } from 'src/mail/mail.service';
import { UsersService } from 'src/users/users.service';
import { VerifyService } from 'src/verify/verify.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private verifyService: VerifyService,
    private mailService: AppMailService,
  ) {}

  async register(dto: any) {
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
  }

  async login(dto: any) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    if (!user.isVerified) {
      throw new BadRequestException('Vui lòng xác minh email trước khi đăng nhập');
    }
    if (!(await bcrypt.compare(dto.password, user.password))) {
      throw new BadRequestException('Sai email hoặc mật khẩu');
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
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
}
