import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { toObjectIdString } from '../../common/utils/mongoose.util';
import { CompaniesService } from '../companies/companies.service';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { ActivateInviteDto } from './dto/activate-invite.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendInviteOtpDto } from './dto/send-invite-otp.dto';

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

  async sendInviteOtp(sendInviteOtpDto: SendInviteOtpDto) {
    return this.companiesService.sendInviteOtp(sendInviteOtpDto.identifier);
  }

  async activateInvite(activateInviteDto: ActivateInviteDto) {
    const invite = await this.companiesService.findPendingInviteByIdentifier(
      activateInviteDto.identifier,
      true,
    );

    await this.companiesService.verifyInviteOtp(invite, activateInviteDto.otp);

    const companyId = toObjectIdString(invite.company);
    let existingUser =
      (await this.usersService.findByInviteContact(
        invite.email,
        invite.phone,
      )) ??
      (await this.usersService.findByIdentifier(activateInviteDto.identifier));
    const existingUserId = existingUser?._id.toString();

    const contact = await this.usersService.resolveAvailableInviteContact(
      invite.email,
      invite.phone,
      existingUserId,
    );

    if (!contact.email && !contact.phone) {
      throw new ConflictException(
        'This invite contact is already linked to another account. Please sign in instead.',
      );
    }

    const activationPayload = {
      fullName: activateInviteDto.fullName,
      password: activateInviteDto.password,
      role: invite.role,
      company: companyId,
      email: contact.email,
      phone: contact.phone,
    };

    if (existingUser) {
      this.assertExistingUserCanCompleteInvite(existingUser, companyId);

      const user = await this.usersService.completeStaffInviteActivation(
        existingUserId!,
        activationPayload,
      );

      await this.companiesService.markInviteAccepted(invite);
      return this.buildAuthResponse(user);
    }

    const user = await this.usersService.create(activationPayload);

    await this.companiesService.markInviteAccepted(invite);
    return this.buildAuthResponse(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    return this.usersService.sanitizeUser(user);
  }

  private assertExistingUserCanCompleteInvite(
    user: UserDocument,
    companyId: string,
  ): void {
    if (user.role === UserRole.CUSTOMER) {
      throw new ConflictException(
        'This email or phone is already registered as a customer account.',
      );
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ConflictException(
        'This contact belongs to a platform administrator.',
      );
    }

    const userCompanyId = user.company?.toString() ?? null;
    if (userCompanyId && userCompanyId !== companyId) {
      throw new ConflictException(
        'This contact is already linked to another company.',
      );
    }
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
