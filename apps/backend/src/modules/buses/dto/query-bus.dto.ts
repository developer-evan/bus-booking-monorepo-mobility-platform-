import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { BusStatus, BusType } from '../schemas/bus.schema';

export class QueryBusDto {
  @ApiPropertyOptional({ enum: BusStatus })
  @IsOptional()
  @IsEnum(BusStatus)
  status?: BusStatus;

  @ApiPropertyOptional({ enum: BusType })
  @IsOptional()
  @IsEnum(BusType)
  busType?: BusType;

  @ApiPropertyOptional({ example: '665f1c2d3e4a5b6c7d8e9f01' })
  @IsOptional()
  @IsMongoId()
  company?: string;
}
