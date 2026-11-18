import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Keerthana N' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 'keerthana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass#2026', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
