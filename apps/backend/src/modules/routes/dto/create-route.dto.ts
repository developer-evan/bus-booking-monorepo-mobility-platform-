import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateRouteDto {
  @ApiProperty({ example: 'Nairobi' })
  @IsString()
  origin: string;

  @ApiProperty({ example: 'Mombasa' })
  @IsString()
  destination: string;

  @ApiProperty({ example: 'River Road Terminal' })
  @IsString()
  originStation: string;

  @ApiProperty({ example: 'Mombasa Bus Station' })
  @IsString()
  destinationStation: string;

  @ApiProperty({ example: 480, minimum: 0 })
  @IsNumber()
  @Min(0)
  distanceKm: number;

  @ApiProperty({ example: 540, minimum: 1 })
  @IsNumber()
  @Min(1)
  estimatedDurationMinutes: number;

  @ApiPropertyOptional({ example: ['Voi', 'Mariakani'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  intermediateStops?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
