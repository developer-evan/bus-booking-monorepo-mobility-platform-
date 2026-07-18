import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBusDto } from './dto/create-bus.dto';
import { QueryBusDto } from './dto/query-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { Bus, BusDocument } from './schemas/bus.schema';

@Injectable()
export class BusesService {
  constructor(
    @InjectModel(Bus.name) private readonly busModel: Model<BusDocument>,
  ) {}

  async create(createBusDto: CreateBusDto): Promise<BusDocument> {
    try {
      return await this.busModel.create(createBusDto);
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async findAll(query: QueryBusDto): Promise<BusDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.busType) {
      filter.busType = query.busType;
    }

    return this.busModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<BusDocument> {
    const bus = await this.busModel.findById(id).exec();
    if (!bus) {
      throw new NotFoundException(`Bus with id "${id}" not found`);
    }
    return bus;
  }

  async update(id: string, updateBusDto: UpdateBusDto): Promise<BusDocument> {
    try {
      const bus = await this.busModel
        .findByIdAndUpdate(id, updateBusDto, { new: true, runValidators: true })
        .exec();

      if (!bus) {
        throw new NotFoundException(`Bus with id "${id}" not found`);
      }

      return bus;
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const bus = await this.busModel.findByIdAndDelete(id).exec();
    if (!bus) {
      throw new NotFoundException(`Bus with id "${id}" not found`);
    }
  }

  private handleDuplicateKeyError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('Plate number already exists');
    }
  }
}
