import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'demo@taskflow.dev' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Demo#2026' })
  @IsString()
  password: string;
}
