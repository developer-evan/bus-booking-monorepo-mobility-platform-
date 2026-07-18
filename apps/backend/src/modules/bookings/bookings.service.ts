import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import { TripsService } from '../trips/trips.service';
import { UserRole } from '../users/schemas/user.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from './schemas/booking.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Trip.name)
    private readonly tripModel: Model<TripDocument>,
    private readonly tripsService: TripsService,
  ) {}

  async create(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    const uniqueSeats = [...new Set(createBookingDto.seatNumbers.map((s) => s.toUpperCase()))];

    if (uniqueSeats.length !== createBookingDto.seatNumbers.length) {
      throw new BadRequestException('Duplicate seat numbers are not allowed');
    }

    const trip = await this.tripModel.findById(createBookingDto.trip).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with id "${createBookingDto.trip}" not found`);
    }

    await this.assertSeatsAvailable(createBookingDto.trip, uniqueSeats);

    const passengerCount = uniqueSeats.length;
    await this.tripsService.reserveSeats(createBookingDto.trip, passengerCount);

    try {
      return await this.bookingModel.create({
        user: new Types.ObjectId(userId),
        trip: new Types.ObjectId(createBookingDto.trip),
        seatNumbers: uniqueSeats,
        passengerCount,
        totalPrice: trip.pricePerSeat * passengerCount,
        bookingReference: this.generateBookingReference(),
        status: BookingStatus.CONFIRMED,
      });
    } catch (error) {
      await this.tripsService.releaseSeats(createBookingDto.trip, passengerCount);
      this.handleDuplicateKeyError(error);
      throw error;
    }
  }

  async findAll(
    query: QueryBookingDto,
    currentUser: AuthenticatedUser,
  ): Promise<BookingDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.trip) {
      filter.trip = new Types.ObjectId(query.trip);
    }

    if (currentUser.role === UserRole.CUSTOMER) {
      filter.user = new Types.ObjectId(currentUser.userId);
    } else if (query.user) {
      filter.user = new Types.ObjectId(query.user);
    }

    return this.bookingModel
      .find(filter)
      .populate('trip')
      .populate('user', '-password')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('trip')
      .populate('user', '-password')
      .exec();

    if (!booking) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }

    this.assertCanAccessBooking(booking, currentUser);
    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
    currentUser: AuthenticatedUser,
  ): Promise<BookingDocument> {
    const booking = await this.findById(id, currentUser);
    const nextStatus = updateBookingStatusDto.status;

    if (currentUser.role === UserRole.CUSTOMER) {
      if (nextStatus !== BookingStatus.CANCELLED) {
        throw new ForbiddenException('Customers can only cancel bookings');
      }

      if (booking.user.toString() !== currentUser.userId) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }

      if (
        booking.status === BookingStatus.CANCELLED ||
        booking.status === BookingStatus.COMPLETED
      ) {
        throw new BadRequestException('Booking cannot be cancelled');
      }
    }

    if (
      booking.status === nextStatus ||
      (booking.status === BookingStatus.CANCELLED &&
        nextStatus !== BookingStatus.CANCELLED)
    ) {
      throw new BadRequestException('Invalid booking status transition');
    }

    if (nextStatus === BookingStatus.CANCELLED) {
      await this.tripsService.releaseSeats(
        booking.trip.toString(),
        booking.passengerCount,
      );
    }

    booking.status = nextStatus;
    return booking.save();
  }

  async remove(id: string, currentUser: AuthenticatedUser): Promise<void> {
    const booking = await this.findById(id, currentUser);

    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete bookings');
    }

    if (
      booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.PENDING
    ) {
      await this.tripsService.releaseSeats(
        booking.trip.toString(),
        booking.passengerCount,
      );
    }

    await this.bookingModel.findByIdAndDelete(id).exec();
  }

  private async assertSeatsAvailable(
    tripId: string,
    seatNumbers: string[],
  ): Promise<void> {
    const conflictingBooking = await this.bookingModel
      .findOne({
        trip: new Types.ObjectId(tripId),
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        seatNumbers: { $in: seatNumbers },
      })
      .exec();

    if (conflictingBooking) {
      throw new ConflictException('One or more seats are already booked');
    }
  }

  private assertCanAccessBooking(
    booking: BookingDocument,
    currentUser: AuthenticatedUser,
  ): void {
    if (
      currentUser.role === UserRole.CUSTOMER &&
      booking.user.toString() !== currentUser.userId
    ) {
      throw new ForbiddenException('You can only access your own bookings');
    }
  }

  private generateBookingReference(): string {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BB-${randomPart}`;
  }

  private handleDuplicateKeyError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('Booking reference already exists');
    }
  }
}
