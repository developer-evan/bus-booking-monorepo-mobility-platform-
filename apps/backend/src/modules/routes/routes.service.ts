import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRouteDto } from './dto/create-route.dto';
import { QueryRouteDto } from './dto/query-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route, RouteDocument } from './schemas/route.schema';

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name) private readonly routeModel: Model<RouteDocument>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<RouteDocument> {
    return this.routeModel.create(createRouteDto);
  }

  async findAll(query: QueryRouteDto): Promise<RouteDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.origin) {
      filter.origin = new RegExp(query.origin, 'i');
    }

    if (query.destination) {
      filter.destination = new RegExp(query.destination, 'i');
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    return this.routeModel.find(filter).sort({ origin: 1, destination: 1 }).exec();
  }

  async findById(id: string): Promise<RouteDocument> {
    const route = await this.routeModel.findById(id).exec();
    if (!route) {
      throw new NotFoundException(`Route with id "${id}" not found`);
    }
    return route;
  }

  async update(
    id: string,
    updateRouteDto: UpdateRouteDto,
  ): Promise<RouteDocument> {
    const route = await this.routeModel
      .findByIdAndUpdate(id, updateRouteDto, { new: true, runValidators: true })
      .exec();

    if (!route) {
      throw new NotFoundException(`Route with id "${id}" not found`);
    }

    return route;
  }

  async remove(id: string): Promise<void> {
    const route = await this.routeModel.findByIdAndDelete(id).exec();
    if (!route) {
      throw new NotFoundException(`Route with id "${id}" not found`);
    }
  }
}
