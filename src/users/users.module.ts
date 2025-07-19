import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import * as multerS3 from 'multer-s3';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // Debug env values
        console.log('S3 ENV:', {
          AWS_ACCESS_KEY_ID: configService.get<string>('AWS_ACCESS_KEY_ID'),
          AWS_SECRET_ACCESS_KEY: configService.get<string>('AWS_SECRET_ACCESS_KEY')?.slice(-4),
          AWS_REGION: configService.get<string>('AWS_REGION'),
          AWS_S3_BUCKET: configService.get<string>('AWS_S3_BUCKET'),
        });
        return {
          storage: multerS3({
            s3: new S3Client({
              region: configService.get<string>('AWS_REGION', 'us-east-1'),
              credentials: {
                accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID') ?? '',
                secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY') ?? '',
              },
            }),
            bucket: configService.get<string>('AWS_S3_BUCKET'),
            // acl removed: bucket has ACLs disabled (Bucket Owner Enforced)
            contentType: multerS3.AUTO_CONTENT_TYPE,
            key: (req, file, cb) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = file.originalname.split('.').pop();
              cb(null, `avatars/${file.fieldname}-${uniqueSuffix}.${ext}`);
            },
          }),
        };
      },
    }),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
