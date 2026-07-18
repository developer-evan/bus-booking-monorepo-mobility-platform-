import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
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
}
