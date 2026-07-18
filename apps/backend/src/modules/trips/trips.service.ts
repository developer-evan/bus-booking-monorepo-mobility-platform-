import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bus, BusDocument, BusStatus } from '../buses/schemas/bus.schema';
import { Route, RouteDocument } from '../routes/schemas/route.schema';
import { CreateTripDto } from './dto/create-trip.dto';
import { QueryTripDto } from './dto/query-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { Trip, TripDocument, TripStatus } from './schemas/trip.schema';

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
    @InjectModel(Route.name) private readonly routeModel: Model<RouteDocument>,
    @InjectModel(Bus.name) private readonly busModel: Model<BusDocument>,
  ) {}

  async create(createTripDto: CreateTripDto): Promise<TripDocument> {
    const route = await this.routeModel.findById(createTripDto.route).exec();
    if (!route) {
      throw new NotFoundException(`Route with id "${createTripDto.route}" not found`);
    }

    const bus = await this.busModel.findById(createTripDto.bus).exec();
    if (!bus) {
      throw new NotFoundException(`Bus with id "${createTripDto.bus}" not found`);
    }

    if (bus.status !== BusStatus.ACTIVE) {
      throw new BadRequestException('Selected bus is not active');
    }

    const departureTime = new Date(createTripDto.departureTime);
    const arrivalTime = new Date(createTripDto.arrivalTime);

    if (arrivalTime <= departureTime) {
      throw new BadRequestException('Arrival time must be after departure time');
    }

    const availableSeats = createTripDto.availableSeats ?? bus.seatCapacity;

    if (availableSeats > bus.seatCapacity) {
      throw new BadRequestException(
        'Available seats cannot exceed bus seat capacity',
      );
    }

    return this.tripModel.create({
      ...createTripDto,
      departureTime,
      arrivalTime,
      availableSeats,
      status: createTripDto.status ?? TripStatus.SCHEDULED,
    });
  }

  async findAll(query: QueryTripDto): Promise<TripDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.route) {
      filter.route = new Types.ObjectId(query.route);
    }

    if (query.bus) {
      filter.bus = new Types.ObjectId(query.bus);
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.departureFrom || query.departureTo) {
      filter.departureTime = {};
      if (query.departureFrom) {
        (filter.departureTime as Record<string, Date>).$gte = new Date(
          query.departureFrom,
        );
      }
      if (query.departureTo) {
        (filter.departureTime as Record<string, Date>).$lte = new Date(
          query.departureTo,
        );
      }
    }

    let trips = await this.tripModel
      .find(filter)
      .populate('route')
      .populate('bus')
      .sort({ departureTime: 1 })
      .exec();

    if (query.origin || query.destination) {
      trips = trips.filter((trip) => {
        const route = trip.route as unknown as RouteDocument;
        const originMatch = query.origin
          ? route.origin.toLowerCase().includes(query.origin.toLowerCase())
          : true;
        const destinationMatch = query.destination
          ? route.destination
              .toLowerCase()
              .includes(query.destination.toLowerCase())
          : true;
        return originMatch && destinationMatch;
      });
    }

    return trips;
  }

  async findById(id: string): Promise<TripDocument> {
    const trip = await this.tripModel
      .findById(id)
      .populate('route')
      .populate('bus')
      .exec();

    if (!trip) {
      throw new NotFoundException(`Trip with id "${id}" not found`);
    }

    return trip;
  }

  async update(id: string, updateTripDto: UpdateTripDto): Promise<TripDocument> {
    const existingTrip = await this.findById(id);
    const updateData: Record<string, unknown> = { ...updateTripDto };

    if (updateTripDto.route) {
      const route = await this.routeModel.findById(updateTripDto.route).exec();
      if (!route) {
        throw new NotFoundException(
          `Route with id "${updateTripDto.route}" not found`,
        );
      }
    }

    if (updateTripDto.bus) {
      const bus = await this.busModel.findById(updateTripDto.bus).exec();
      if (!bus) {
        throw new NotFoundException(`Bus with id "${updateTripDto.bus}" not found`);
      }
    }

    if (updateTripDto.departureTime) {
      updateData.departureTime = new Date(updateTripDto.departureTime);
    }

    if (updateTripDto.arrivalTime) {
      updateData.arrivalTime = new Date(updateTripDto.arrivalTime);
    }

    const departureTime =
      (updateData.departureTime as Date | undefined) ?? existingTrip.departureTime;
    const arrivalTime =
      (updateData.arrivalTime as Date | undefined) ?? existingTrip.arrivalTime;

    if (arrivalTime <= departureTime) {
      throw new BadRequestException('Arrival time must be after departure time');
    }

    const trip = await this.tripModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('route')
      .populate('bus')
      .exec();

    if (!trip) {
      throw new NotFoundException(`Trip with id "${id}" not found`);
    }

    return trip;
  }

  async remove(id: string): Promise<void> {
    const trip = await this.tripModel.findByIdAndDelete(id).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with id "${id}" not found`);
    }
  }

  async reserveSeats(tripId: string, seatCount: number): Promise<TripDocument> {
    const trip = await this.tripModel
      .findOneAndUpdate(
        {
          _id: tripId,
          availableSeats: { $gte: seatCount },
          status: TripStatus.SCHEDULED,
        },
        { $inc: { availableSeats: -seatCount } },
        { new: true },
      )
      .exec();

    if (!trip) {
      throw new BadRequestException('Trip is unavailable or not enough seats');
    }

    return trip;
  }

  async releaseSeats(tripId: string, seatCount: number): Promise<void> {
    await this.tripModel
      .findByIdAndUpdate(tripId, { $inc: { availableSeats: seatCount } })
      .exec();
  }
}
