import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, MinLength } from 'class-validator';

export class ActivateInviteDto {
  @ApiProperty({
    example: 'admin@coastal.com',
    description: 'Email address or phone number tied to the invite',
  })
  @IsString()
  identifier: string;

  @ApiProperty({ example: '483921', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ example: 'Jane Admin' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'SecurePass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
