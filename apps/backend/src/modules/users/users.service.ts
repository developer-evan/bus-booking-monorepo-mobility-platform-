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
