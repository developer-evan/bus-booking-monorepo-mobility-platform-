import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { ActivateInviteDto } from './dto/activate-invite.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendInviteOtpDto } from './dto/send-invite-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a customer with email and/or phone' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email or phone plus password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('invite/send-otp')
  @ApiOperation({
    summary: 'Send OTP for a pending staff invite (OTP returned for testing)',
  })
  sendInviteOtp(@Body() sendInviteOtpDto: SendInviteOtpDto) {
    return this.authService.sendInviteOtp(sendInviteOtpDto);
  }

  @Public()
  @Post('invite/activate')
  @ApiOperation({ summary: 'Verify OTP and activate a staff invite' })
  activateInvite(@Body() activateInviteDto: ActivateInviteDto) {
    return this.authService.activateInvite(activateInviteDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.userId);
  }
}
