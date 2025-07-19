import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email of the user to verify' })
  email: string;

  @ApiProperty({ example: '123456', description: 'OTP code sent to the user email' })
  code: string;
}
