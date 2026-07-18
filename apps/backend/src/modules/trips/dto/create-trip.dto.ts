import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { TripStatus } from '../schemas/trip.schema';

export class CreateTripDto {
  @ApiProperty({ example: '665f1c2d3e4a5b6c7d8e9f01' })
  @IsMongoId()
  route: string;

  @ApiProperty({ example: '665f1c2d3e4a5b6c7d8e9f02' })
  @IsMongoId()
  bus: string;

  @ApiProperty({ example: '2026-08-01T06:00:00.000Z' })
  @IsDateString()
  departureTime: string;

  @ApiProperty({ example: '2026-08-01T15:00:00.000Z' })
  @IsDateString()
  arrivalTime: string;

  @ApiProperty({ example: 2500, minimum: 0 })
  @IsNumber()
  @Min(0)
  pricePerSeat: number;

  @ApiPropertyOptional({ example: 45, minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  availableSeats?: number;

  @ApiPropertyOptional({ enum: TripStatus, default: TripStatus.SCHEDULED })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;
}
