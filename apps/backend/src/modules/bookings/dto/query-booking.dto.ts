import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { BookingStatus } from '../schemas/booking.schema';

export class QueryBookingDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ example: '665f1c2d3e4a5b6c7d8e9f01' })
  @IsOptional()
  @IsMongoId()
  trip?: string;

  @ApiPropertyOptional({ example: '665f1c2d3e4a5b6c7d8e9f02' })
  @IsOptional()
  @IsMongoId()
  user?: string;
}
