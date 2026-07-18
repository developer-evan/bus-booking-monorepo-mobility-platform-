import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RequireEmailOrPhone } from '../../../common/validators/require-email-or-phone.validator';

export class AcceptInviteDto {
  @ApiProperty({ example: 'invite-token-from-email-or-sms' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'Jane Admin' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'jane@coastal.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  @RequireEmailOrPhone()
  phone?: string;
}
