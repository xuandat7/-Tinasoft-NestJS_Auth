import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
}
bootstrap();
