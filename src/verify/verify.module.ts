import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VerifyService } from './verify.service';
import { VerifyController } from './verify.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mysecret',
      signOptions: { expiresIn: '15m' },
    }),
    UsersModule,
  ],
  controllers: [VerifyController],
  providers: [VerifyService],
  exports: [VerifyService],
})
export class VerifyModule {}
