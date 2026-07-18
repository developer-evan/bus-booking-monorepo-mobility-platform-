import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsMongoId, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: '665f1c2d3e4a5b6c7d8e9f03' })
  @IsMongoId()
  trip: string;

  @ApiProperty({ example: ['A1', 'A2'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  seatNumbers: string[];
}
