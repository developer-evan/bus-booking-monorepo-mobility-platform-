import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class RecordCashPaymentDto {
  @ApiProperty({ example: '665f1c2d3e4a5b6c7d8e9f03' })
  @IsMongoId()
  bookingId: string;

  @ApiPropertyOptional({ example: 'Paid at Nairobi terminal counter' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
