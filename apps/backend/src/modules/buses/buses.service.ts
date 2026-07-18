import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { assertCompanyResourceAccess } from '../../common/utils/access.util';
import { getTenantCompanyId } from '../../common/utils/tenant.util';
import { CreateBusDto } from './dto/create-bus.dto';
import { QueryBusDto } from './dto/query-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { Bus, BusDocument } from './schemas/bus.schema';

@Injectable()
export class BusesService {
  constructor(
    @InjectModel(Bus.name) private readonly busModel: Model<BusDocument>,
  ) {}

  async create(
    createBusDto: CreateBusDto,
    companyId: string,
  ): Promise<BusDocument> {
    try {
      return await this.busModel.create({
        ...createBusDto,
        company: new Types.ObjectId(companyId),
      });
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async findAll(
    query: QueryBusDto,
    currentUser?: AuthenticatedUser,
  ): Promise<BusDocument[]> {
    const filter: Record<string, unknown> = {};
    const tenantCompanyId = currentUser
      ? getTenantCompanyId(currentUser)
      : undefined;

    if (tenantCompanyId) {
      filter.company = new Types.ObjectId(tenantCompanyId);
    } else if (query.company) {
      filter.company = new Types.ObjectId(query.company);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.busType) {
      filter.busType = query.busType;
    }

    return this.busModel
      .find(filter)
      .populate('company', 'name slug')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<BusDocument> {
    const bus = await this.busModel
      .findById(id)
      .populate('company', 'name slug')
      .exec();
    if (!bus) {
      throw new NotFoundException(`Bus with id "${id}" not found`);
    }
    return bus;
  }

  async update(
    id: string,
    updateBusDto: UpdateBusDto,
    currentUser: AuthenticatedUser,
  ): Promise<BusDocument> {
    const bus = await this.findById(id);
    assertCompanyResourceAccess(currentUser, bus.company);

    try {
      const updatedBus = await this.busModel
        .findByIdAndUpdate(id, updateBusDto, { new: true, runValidators: true })
        .populate('company', 'name slug')
        .exec();

      if (!updatedBus) {
        throw new NotFoundException(`Bus with id "${id}" not found`);
      }

      return updatedBus;
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const bus = await this.findById(id);
    assertCompanyResourceAccess(currentUser, bus.company);

    await this.busModel.findByIdAndDelete(id).exec();
  }

  assertWritableCompany(currentUser: AuthenticatedUser): string {
    const companyId = getTenantCompanyId(currentUser);
    if (!companyId) {
      throw new ForbiddenException('Company staff account required');
    }
    return companyId;
  }

  private handleDuplicateKeyError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException(
        'Plate number already exists for this company',
      );
    }
  }
}
