import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CompaniesService } from '../companies/companies.service';
import { UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly companiesService: CompaniesService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      phone: registerDto.phone,
      password: registerDto.password,
      role: UserRole.CUSTOMER,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByIdentifierWithPassword(
      loginDto.identifier,
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async acceptInvite(acceptInviteDto: AcceptInviteDto) {
    const invite = await this.companiesService.findInviteByToken(
      acceptInviteDto.token,
    );

    const email = acceptInviteDto.email ?? invite.email;
    const phone = acceptInviteDto.phone ?? invite.phone;

    if (!email && !phone) {
      throw new UnauthorizedException(
        'Invite must include email or phone, or provide the missing one',
      );
    }

    const user = await this.usersService.create({
      fullName: acceptInviteDto.fullName,
      email,
      phone,
      password: acceptInviteDto.password,
      role: invite.role,
      company: invite.company.toString(),
    });

    await this.companiesService.markInviteAccepted(invite);
    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.sanitizeUser(user);
  }

  private buildAuthResponse(user: Parameters<UsersService['sanitizeUser']>[0]) {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      phone: user.phone,
      role: user.role,
      companyId: user.company?.toString(),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: this.usersService.sanitizeUser(user),
    };
  }
}
