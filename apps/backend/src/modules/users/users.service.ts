import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model, Types } from 'mongoose';
import {
  isEmailIdentifier,
  normalizeEmail,
  normalizePhone,
} from '../../common/utils/identifier.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    if (!createUserDto.email && !createUserDto.phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    try {
      return await this.userModel.create({
        ...createUserDto,
        email: createUserDto.email
          ? normalizeEmail(createUserDto.email)
          : undefined,
        phone: createUserDto.phone
          ? normalizePhone(createUserDto.phone)
          : undefined,
        password: hashedPassword,
        role: createUserDto.role ?? UserRole.CUSTOMER,
        company: createUserDto.company
          ? new Types.ObjectId(createUserDto.company)
          : null,
      });
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async findAll(companyId?: string): Promise<UserDocument[]> {
    const filter = companyId ? { company: new Types.ObjectId(companyId) } : {};
    return this.userModel.find(filter).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: normalizeEmail(email) }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ phone: normalizePhone(phone) }).exec();
  }

  async findByIdentifierWithPassword(
    identifier: string,
  ): Promise<UserDocument | null> {
    const query = isEmailIdentifier(identifier)
      ? { email: normalizeEmail(identifier) }
      : { phone: normalizePhone(identifier) };

    return this.userModel.findOne(query).select('+password').exec();
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    const query = isEmailIdentifier(identifier)
      ? { email: normalizeEmail(identifier) }
      : { phone: normalizePhone(identifier) };

    return this.userModel.findOne(query).exec();
  }

  async findByInviteContact(
    email?: string,
    phone?: string,
  ): Promise<UserDocument | null> {
    if (email) {
      const userByEmail = await this.findByEmail(email);
      if (userByEmail) {
        return userByEmail;
      }
    }

    if (phone) {
      return this.findByPhone(phone);
    }

    return null;
  }

  async resolveAvailableInviteContact(
    email?: string,
    phone?: string,
    existingUserId?: string,
  ): Promise<{ email?: string; phone?: string }> {
    const contact: { email?: string; phone?: string } = {};

    if (email) {
      const owner = await this.findByEmail(email);
      if (!owner || owner._id.toString() === existingUserId) {
        contact.email = normalizeEmail(email);
      }
    }

    if (phone) {
      const owner = await this.findByPhone(phone);
      if (!owner || owner._id.toString() === existingUserId) {
        contact.phone = normalizePhone(phone);
      }
    }

    return contact;
  }

  async completeStaffInviteActivation(
    userId: string,
    data: {
      fullName: string;
      password: string;
      role: UserRole.ADMIN | UserRole.OPERATOR;
      company: string;
      email?: string;
      phone?: string;
    },
  ): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const updateData: Record<string, unknown> = {
      fullName: data.fullName,
      password: hashedPassword,
      role: data.role,
      company: new Types.ObjectId(data.company),
      isActive: true,
    };

    if (data.email) {
      updateData.email = normalizeEmail(data.email);
    }

    if (data.phone) {
      updateData.phone = normalizePhone(data.phone);
    }

    try {
      const user = await this.userModel
        .findByIdAndUpdate(userId, updateData, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!user) {
        throw new NotFoundException(`User with id "${userId}" not found`);
      }

      return user;
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const updateData: Record<string, unknown> = { ...updateUserDto };

    if (updateUserDto.email) {
      updateData.email = normalizeEmail(updateUserDto.email);
    }

    if (updateUserDto.phone) {
      updateData.phone = normalizePhone(updateUserDto.phone);
    }

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .exec();

      if (!user) {
        throw new NotFoundException(`User with id "${id}" not found`);
      }

      return user;
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
  }

  sanitizeUser(user: UserDocument) {
    const sanitized = user.toObject();
    delete sanitized.password;
    return sanitized;
  }

  private handleDuplicateKeyError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('Email or phone already exists');
    }
  }
}
