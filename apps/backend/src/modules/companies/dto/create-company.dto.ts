import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Coastal Express' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'contact@coastal.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+254712345678' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'coastal-express' })
  @IsOptional()
  @IsString()
  slug?: string;
}
