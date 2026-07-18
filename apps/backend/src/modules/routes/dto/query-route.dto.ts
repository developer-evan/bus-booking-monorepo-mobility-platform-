import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class QueryRouteDto {
  @ApiPropertyOptional({ example: 'Nairobi' })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: 'Mombasa' })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '665f1c2d3e4a5b6c7d8e9f01' })
  @IsOptional()
  @IsMongoId()
  company?: string;
}
