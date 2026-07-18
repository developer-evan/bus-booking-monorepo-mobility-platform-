import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { assertCompanyResourceAccess } from '../../common/utils/access.util';
import { getTenantCompanyId } from '../../common/utils/tenant.util';
import { CreateRouteDto } from './dto/create-route.dto';
import { QueryRouteDto } from './dto/query-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route, RouteDocument } from './schemas/route.schema';

@Injectable()
export class RoutesService {
  constructor(
    @InjectModel(Route.name) private readonly routeModel: Model<RouteDocument>,
  ) {}

  async create(
    createRouteDto: CreateRouteDto,
    companyId: string,
  ): Promise<RouteDocument> {
    return this.routeModel.create({
      ...createRouteDto,
      company: new Types.ObjectId(companyId),
    });
  }

  async findAll(query: QueryRouteDto): Promise<RouteDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.company) {
      filter.company = new Types.ObjectId(query.company);
    }

    if (query.origin) {
      filter.origin = new RegExp(query.origin, 'i');
    }

    if (query.destination) {
      filter.destination = new RegExp(query.destination, 'i');
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    return this.routeModel
      .find(filter)
      .populate('company', 'name slug')
      .sort({ origin: 1, destination: 1 })
      .exec();
  }

  async findById(id: string): Promise<RouteDocument> {
    const route = await this.routeModel
      .findById(id)
      .populate('company', 'name slug')
      .exec();
    if (!route) {
      throw new NotFoundException(`Route with id "${id}" not found`);
    }
    return route;
  }

  async update(
    id: string,
    updateRouteDto: UpdateRouteDto,
    currentUser: AuthenticatedUser,
  ): Promise<RouteDocument> {
    const route = await this.findById(id);
    assertCompanyResourceAccess(currentUser, route.company);

    const updatedRoute = await this.routeModel
      .findByIdAndUpdate(id, updateRouteDto, { new: true, runValidators: true })
      .populate('company', 'name slug')
      .exec();

    if (!updatedRoute) {
      throw new NotFoundException(`Route with id "${id}" not found`);
    }

    return updatedRoute;
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const route = await this.findById(id);
    assertCompanyResourceAccess(currentUser, route.company);
    await this.routeModel.findByIdAndDelete(id).exec();
  }

  assertWritableCompany(currentUser: AuthenticatedUser): string {
    const companyId = getTenantCompanyId(currentUser);
    if (!companyId) {
      throw new ForbiddenException('Company staff account required');
    }
    return companyId;
  }
}
