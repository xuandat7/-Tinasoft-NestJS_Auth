import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  Request,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Users')
@ApiBearerAuth() // Cho biết các route này cần token
@UseGuards(JwtAuthGuard)
@Controller('users')
@UseGuards(JwtAuthGuard) // Áp dụng cho tất cả route trong controller
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Lấy danh sách tất cả người dùng
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    // Exclude password field from response
    return users.map(({ password, ...rest }) => rest);
  }

  // Lấy thông tin người dùng hiện tại (từ JWT payload)
  @Get('me')
  getMe(@Request() req) {
    return req.user; // chứa userId, email từ JwtStrategy
  }

  // Lấy chi tiết người dùng theo ID
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    if (user) {
      const { password, ...rest } = user;
      return rest;
    }
    return null;
  }

  // Cập nhật người dùng
  @Post(':id/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    // file.location contains the S3 URL
    return this.usersService.setAvatar(id, file.location);
  }
}
