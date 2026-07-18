import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BusStatus, BusType } from '../schemas/bus.schema';

export class CreateBusDto {
  @ApiProperty({ example: 'KAA 123A' })
  @IsString()
  plateNumber: string;

  @ApiProperty({ example: 'Mercedes-Benz Travego' })
  @IsString()
  model: string;

  @ApiProperty({ example: 45, minimum: 1 })
  @IsInt()
  @Min(1)
  seatCapacity: number;

  @ApiPropertyOptional({ enum: BusType, default: BusType.STANDARD })
  @IsOptional()
  @IsEnum(BusType)
  busType?: BusType;

  @ApiPropertyOptional({ example: ['wifi', 'ac'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ enum: BusStatus, default: BusStatus.ACTIVE })
  @IsOptional()
  @IsEnum(BusStatus)
  status?: BusStatus;
}
