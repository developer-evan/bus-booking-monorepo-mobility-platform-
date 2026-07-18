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
import { assertCompanyResourceAccess } from '../../common/utils/access.util';
import {
  normalizeEmail,
  normalizePhone,
} from '../../common/utils/identifier.util';
import { Trip, TripDocument } from '../trips/schemas/trip.schema';
import { TripsService } from '../trips/trips.service';
import { UserRole } from '../users/schemas/user.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CreatePosBookingDto } from './dto/create-pos-booking.dto';
import { LookupBookingDto } from './dto/lookup-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import {
  Booking,
  BookingChannel,
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
    return this.reserveAndCreate({
      tripId: createBookingDto.trip,
      seatNumbers: createBookingDto.seatNumbers,
      userId,
      channel: BookingChannel.ONLINE,
    });
  }

  async createPos(
    staff: AuthenticatedUser,
    createPosBookingDto: CreatePosBookingDto,
  ): Promise<BookingDocument> {
    if (!staff.companyId) {
      throw new ForbiddenException('Company staff account required');
    }

    if (!createPosBookingDto.passengerPhone && !createPosBookingDto.passengerEmail) {
      throw new BadRequestException(
        'Passenger phone or email is required for POS bookings',
      );
    }

    const trip = await this.tripModel.findById(createPosBookingDto.trip).exec();
    if (!trip) {
      throw new NotFoundException(
        `Trip with id "${createPosBookingDto.trip}" not found`,
      );
    }

    assertCompanyResourceAccess(staff, trip.company);

    return this.reserveAndCreate({
      tripId: createPosBookingDto.trip,
      seatNumbers: createPosBookingDto.seatNumbers,
      channel: BookingChannel.POS,
      passengerName: createPosBookingDto.passengerName.trim(),
      passengerPhone: createPosBookingDto.passengerPhone
        ? normalizePhone(createPosBookingDto.passengerPhone)
        : undefined,
      passengerEmail: createPosBookingDto.passengerEmail
        ? normalizeEmail(createPosBookingDto.passengerEmail)
        : undefined,
      bookedBy: staff.userId,
    });
  }

  async lookup(
    lookupBookingDto: LookupBookingDto,
    currentUser: AuthenticatedUser,
  ): Promise<BookingDocument> {
    if (!lookupBookingDto.phone && !lookupBookingDto.email) {
      throw new BadRequestException('Phone or email is required for lookup');
    }

    const filter: Record<string, unknown> = {
      bookingReference: lookupBookingDto.reference.trim().toUpperCase(),
    };

    if (lookupBookingDto.phone) {
      filter.passengerPhone = normalizePhone(lookupBookingDto.phone);
    }

    if (lookupBookingDto.email) {
      filter.passengerEmail = normalizeEmail(lookupBookingDto.email);
    }

    const booking = await this.bookingModel
      .findOne(filter)
      .populate('trip')
      .populate('bookedBy', 'fullName email phone')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.assertCanAccessBooking(booking, currentUser);
    return booking;
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
    } else if (currentUser.companyId) {
      filter.company = new Types.ObjectId(currentUser.companyId);
    } else if (query.user) {
      filter.user = new Types.ObjectId(query.user);
    }

    return this.bookingModel
      .find(filter)
      .populate('trip')
      .populate('user', '-password')
      .populate('bookedBy', 'fullName email phone')
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
      .populate('bookedBy', 'fullName email phone')
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

      if (!booking.user || booking.user.toString() !== currentUser.userId) {
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

    if (
      currentUser.role !== UserRole.ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
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

  private async reserveAndCreate(input: {
    tripId: string;
    seatNumbers: string[];
    userId?: string;
    channel: BookingChannel;
    passengerName?: string;
    passengerPhone?: string;
    passengerEmail?: string;
    bookedBy?: string;
  }): Promise<BookingDocument> {
    const uniqueSeats = [
      ...new Set(input.seatNumbers.map((seat) => seat.toUpperCase())),
    ];

    if (uniqueSeats.length !== input.seatNumbers.length) {
      throw new BadRequestException('Duplicate seat numbers are not allowed');
    }

    const trip = await this.tripModel.findById(input.tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with id "${input.tripId}" not found`);
    }

    await this.assertSeatsAvailable(input.tripId, uniqueSeats);

    const passengerCount = uniqueSeats.length;
    await this.tripsService.reserveSeats(input.tripId, passengerCount);

    try {
      return await this.bookingModel.create({
        user: input.userId ? new Types.ObjectId(input.userId) : null,
        trip: new Types.ObjectId(input.tripId),
        company: trip.company,
        seatNumbers: uniqueSeats,
        passengerCount,
        totalPrice: trip.pricePerSeat * passengerCount,
        bookingReference: this.generateBookingReference(),
        status: BookingStatus.CONFIRMED,
        channel: input.channel,
        passengerName: input.passengerName,
        passengerPhone: input.passengerPhone,
        passengerEmail: input.passengerEmail,
        bookedBy: input.bookedBy ? new Types.ObjectId(input.bookedBy) : null,
      });
    } catch (error) {
      await this.tripsService.releaseSeats(input.tripId, passengerCount);
      this.handleDuplicateKeyError(error);
      throw error;
    }
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
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.CUSTOMER) {
      if (!booking.user || booking.user.toString() !== currentUser.userId) {
        throw new ForbiddenException('You can only access your own bookings');
      }
      return;
    }

    if (
      currentUser.companyId &&
      booking.company.toString() !== currentUser.companyId
    ) {
      throw new ForbiddenException('You can only access your company bookings');
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
