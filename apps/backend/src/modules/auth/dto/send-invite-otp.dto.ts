import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendInviteOtpDto {
  @ApiProperty({
    example: 'admin@coastal.com',
    description: 'Email address or phone number tied to the invite',
  })
  @IsString()
  identifier: string;
}
