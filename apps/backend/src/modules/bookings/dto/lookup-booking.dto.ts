import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LookupBookingDto {
  @ApiProperty({ example: 'BB-A1B2C3' })
  @IsString()
  reference: string;

  @ApiPropertyOptional({ example: '+254712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'mary@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
