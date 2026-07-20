import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { assertCompanyResourceAccess } from '../../common/utils/access.util';
import {
  isEmailIdentifier,
  normalizeEmail,
  normalizePhone,
  slugify,
} from '../../common/utils/identifier.util';
import {
  buildInviteOtpResponse,
  generateOtpCode,
  getOtpExpiryDate,
  hashOtp,
  verifyOtp,
} from '../../common/utils/otp.util';
import { toObjectIdString } from '../../common/utils/mongoose.util';
import { UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company, CompanyDocument } from './schemas/company.schema';
import {
  Invite,
  InviteDocument,
  InviteStatus,
} from './schemas/invite.schema';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Invite.name)
    private readonly inviteModel: Model<InviteDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<CompanyDocument> {
    const slug = createCompanyDto.slug
      ? slugify(createCompanyDto.slug)
      : slugify(createCompanyDto.name);

    try {
      return await this.companyModel.create({
        ...createCompanyDto,
        email: normalizeEmail(createCompanyDto.email),
        phone: normalizePhone(createCompanyDto.phone),
        slug,
      });
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async findAll(): Promise<CompanyDocument[]> {
    return this.companyModel.find().sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findById(id).exec();
    if (!company) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }
    return company;
  }

  async findBySlug(slug: string): Promise<CompanyDocument | null> {
    return this.companyModel.findOne({ slug: slugify(slug) }).exec();
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyDocument> {
    const updateData = { ...updateCompanyDto };

    if (updateCompanyDto.email) {
      updateData.email = normalizeEmail(updateCompanyDto.email);
    }

    if (updateCompanyDto.phone) {
      updateData.phone = normalizePhone(updateCompanyDto.phone);
    }

    const company = await this.companyModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!company) {
      throw new NotFoundException(`Company with id "${id}" not found`);
    }

    return company;
  }

  async createInvite(
    companyId: string,
    createInviteDto: CreateInviteDto,
    invitedBy: AuthenticatedUser,
  ) {
    const company = await this.findById(companyId);
    assertCompanyResourceAccess(invitedBy, company._id);

    if (!createInviteDto.email && !createInviteDto.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    if (
      invitedBy.role === UserRole.ADMIN &&
      createInviteDto.role !== UserRole.OPERATOR
    ) {
      throw new ForbiddenException('Company admins can only invite operators');
    }

    if (
      invitedBy.role === UserRole.SUPER_ADMIN &&
      createInviteDto.role !== UserRole.ADMIN
    ) {
      throw new BadRequestException(
        'Super admin can only invite company admins through this endpoint',
      );
    }

    const email = createInviteDto.email
      ? normalizeEmail(createInviteDto.email)
      : undefined;
    const phone = createInviteDto.phone
      ? normalizePhone(createInviteDto.phone)
      : undefined;

    await this.assertInviteContactAvailable(email, phone);

    const otp = generateOtpCode();
    const otpHash = await hashOtp(otp);
    const otpExpiresAt = getOtpExpiryDate();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const existingInvite = await this.findPendingInviteRecord(email, phone);

    let invite: InviteDocument | null;

    try {
      invite = existingInvite
        ? await this.inviteModel
            .findByIdAndUpdate(
              existingInvite._id,
              {
                company: new Types.ObjectId(companyId),
                email,
                phone,
                role: createInviteDto.role,
                otpHash,
                otpExpiresAt,
                expiresAt,
                invitedBy: new Types.ObjectId(invitedBy.userId),
                status: InviteStatus.PENDING,
              },
              { new: true },
            )
            .exec()
        : await this.inviteModel.create({
            company: new Types.ObjectId(companyId),
            email,
            phone,
            role: createInviteDto.role,
            otpHash,
            otpExpiresAt,
            expiresAt,
            invitedBy: new Types.ObjectId(invitedBy.userId),
          });
    } catch (error) {
      this.handleInviteDuplicateKeyError(error);
      throw error;
    }

    if (!invite) {
      throw new BadRequestException('Unable to create invite');
    }

    return {
      inviteId: invite._id,
      companyId: invite.company,
      email: invite.email,
      phone: invite.phone,
      role: invite.role,
      expiresAt: invite.expiresAt,
      ...buildInviteOtpResponse(otp, otpExpiresAt),
    };
  }

  async sendInviteOtp(identifier: string) {
    const invite = await this.findPendingInviteByIdentifier(identifier, true);
    const otp = generateOtpCode();
    const otpHash = await hashOtp(otp);
    const otpExpiresAt = getOtpExpiryDate();

    invite.otpHash = otpHash;
    invite.otpExpiresAt = otpExpiresAt;
    await invite.save();

    return {
      role: invite.role,
      email: invite.email,
      phone: invite.phone,
      ...buildInviteOtpResponse(otp, otpExpiresAt),
    };
  }

  async findPendingInviteByIdentifier(
    identifier: string,
    includeOtpHash = false,
  ): Promise<InviteDocument> {
    const query = this.buildInviteContactQuery(identifier);
    let finder = this.inviteModel.findOne({
      ...query,
      status: InviteStatus.PENDING,
    });

    if (includeOtpHash) {
      finder = finder.select('+otpHash');
    }

    const invite = await finder.exec();

    if (!invite) {
      throw new NotFoundException('No pending invite found for this contact');
    }

    this.assertInviteNotExpired(invite);
    return invite;
  }

  async verifyInviteOtp(invite: InviteDocument, otp: string): Promise<void> {
    const inviteWithOtp = invite.otpHash
      ? invite
      : await this.inviteModel.findById(invite._id).select('+otpHash').exec();

    if (!inviteWithOtp?.otpHash) {
      throw new BadRequestException('Invite OTP is not configured');
    }

    if (inviteWithOtp.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired. Request a new code.');
    }

    const isValid = await verifyOtp(otp, inviteWithOtp.otpHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP code');
    }
  }

  async markInviteAccepted(invite: InviteDocument): Promise<void> {
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedAt = new Date();
    await invite.save();
  }

  private async assertInviteContactAvailable(
    email?: string,
    phone?: string,
  ): Promise<void> {
    if (email) {
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new ConflictException(
          'A user with this email already exists. Ask them to sign in instead.',
        );
      }
    }

    if (phone) {
      const existingUser = await this.usersService.findByPhone(phone);
      if (existingUser) {
        throw new ConflictException(
          'A user with this phone already exists. Ask them to sign in instead.',
        );
      }
    }
  }

  private async findPendingInviteRecord(email?: string, phone?: string) {
    if (email) {
      return this.inviteModel
        .findOne({ email, status: InviteStatus.PENDING })
        .exec();
    }

    if (phone) {
      return this.inviteModel
        .findOne({ phone, status: InviteStatus.PENDING })
        .exec();
    }

    return null;
  }

  private buildInviteContactQuery(identifier: string): Record<string, string> {
    return isEmailIdentifier(identifier)
      ? { email: normalizeEmail(identifier) }
      : { phone: normalizePhone(identifier) };
  }

  private assertInviteNotExpired(invite: InviteDocument): void {
    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = InviteStatus.EXPIRED;
      void invite.save();
      throw new BadRequestException('Invite has expired');
    }
  }

  private handleDuplicateKeyError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('Company name or slug already exists');
    }
  }

  private handleInviteDuplicateKeyError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException(
        'Unable to create invite for this contact. They may already have an account or pending invite.',
      );
    }
  }
}
