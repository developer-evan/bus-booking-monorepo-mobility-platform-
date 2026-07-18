import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { TripStatus } from '../schemas/trip.schema';

export class QueryTripDto {
  @ApiPropertyOptional({ example: '665f1c2d3e4a5b6c7d8e9f01' })
  @IsOptional()
  @IsMongoId()
  route?: string;

  @ApiPropertyOptional({ example: '665f1c2d3e4a5b6c7d8e9f02' })
  @IsOptional()
  @IsMongoId()
  bus?: string;

  @ApiPropertyOptional({ enum: TripStatus })
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: 'Mombasa' })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  departureFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  departureTo?: string;

  @ApiPropertyOptional({ example: '665f1c2d3e4a5b6c7d8e9f03' })
  @IsOptional()
  @IsMongoId()
  company?: string;
}
