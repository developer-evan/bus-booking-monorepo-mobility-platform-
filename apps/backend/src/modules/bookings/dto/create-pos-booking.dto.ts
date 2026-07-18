import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';
import { RequireEmailOrPhone } from '../../../common/validators/require-email-or-phone.validator';
import { CreateBookingDto } from './create-booking.dto';

export class CreatePosBookingDto extends CreateBookingDto {
  @ApiProperty({ example: 'Mary Wanjiku' })
  @IsString()
  passengerName: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  passengerPhone?: string;

  @ApiPropertyOptional({ example: 'mary@example.com' })
  @IsOptional()
  @IsEmail()
  @RequireEmailOrPhone()
  passengerEmail?: string;
}
