import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';
import { RequireEmailOrPhone } from '../../../common/validators/require-email-or-phone.validator';

export class CreateInviteDto {
  @ApiPropertyOptional({ example: 'admin@coastal.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  @RequireEmailOrPhone()
  phone?: string;

  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.OPERATOR] })
  @IsIn([UserRole.ADMIN, UserRole.OPERATOR])
  role: UserRole.ADMIN | UserRole.OPERATOR;
}
