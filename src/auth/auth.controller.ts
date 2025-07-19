import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailDto } from './dto/email.dto';

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
}
