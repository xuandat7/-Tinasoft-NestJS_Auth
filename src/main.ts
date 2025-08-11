import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('NestJS Practice API')
    .setDescription('API thực hành: Auth, User CRUD, Upload, Mail, Cron...')
    .setVersion('1.0')
    .addBearerAuth() // Cho phép nhập JWT Bearer Token
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Truy cập ở /api

  await app.listen(3000);
  
  // Display API endpoints
  console.log('🚀 Server running at: http://localhost:3000');
  console.log('📚 Swagger UI: http://localhost:3000/api');
  console.log('🔧 Available endpoints:');
  console.log('   - POST http://localhost:3000/auth/register');
  console.log('   - POST http://localhost:3000/auth/register-admin (Admin)');
  console.log('   - POST http://localhost:3000/auth/login');
  console.log('   - POST http://localhost:3000/auth/verify-otp');
  console.log('   - POST http://localhost:3000/auth/forgot-password');
  console.log('   - POST http://localhost:3000/auth/reset-password');
  console.log('   - POST http://localhost:3000/auth/unlock-account (Admin)');
  console.log('   - GET  http://localhost:3000/users');
  console.log('   - POST http://localhost:3000/users/:id/avatar');
}
bootstrap();
