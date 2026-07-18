import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { assertCompanyResourceAccess } from '../../common/utils/access.util';
import {
  normalizeEmail,
  normalizePhone,
  slugify,
} from '../../common/utils/identifier.util';
import { UserRole } from '../users/schemas/user.schema';
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

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.inviteModel.create({
      company: new Types.ObjectId(companyId),
      email: createInviteDto.email
        ? normalizeEmail(createInviteDto.email)
        : undefined,
      phone: createInviteDto.phone
        ? normalizePhone(createInviteDto.phone)
        : undefined,
      role: createInviteDto.role,
      token,
      expiresAt,
      invitedBy: new Types.ObjectId(invitedBy.userId),
    });

    return {
      inviteId: invite._id,
      companyId: invite.company,
      email: invite.email,
      phone: invite.phone,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt,
    };
  }

  async findInviteByToken(token: string): Promise<InviteDocument> {
    const invite = await this.inviteModel
      .findOne({ token, status: InviteStatus.PENDING })
      .populate('company')
      .exec();

    if (!invite) {
      throw new NotFoundException('Invite not found or already used');
    }

    if (invite.expiresAt.getTime() < Date.now()) {
      invite.status = InviteStatus.EXPIRED;
      await invite.save();
      throw new BadRequestException('Invite has expired');
    }

    return invite;
  }

  async markInviteAccepted(invite: InviteDocument): Promise<void> {
    invite.status = InviteStatus.ACCEPTED;
    invite.acceptedAt = new Date();
    await invite.save();
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
}
