import { ApiProperty } from '@nestjs/swagger';

export class EmailDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email: string;
}
