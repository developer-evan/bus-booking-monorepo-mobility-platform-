import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { assertCompanyResourceAccess } from '../../common/utils/access.util';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../bookings/schemas/booking.schema';
import { UserRole } from '../users/schemas/user.schema';
import { RecordCashPaymentDto } from './dto/record-cash-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import {
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
} from './schemas/payment.schema';

export interface CashPaymentResult {
  payment: PaymentDocument;
  booking: BookingDocument;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    private readonly configService: ConfigService,
  ) {}

  async recordCashPayment(
    staff: AuthenticatedUser,
    recordCashPaymentDto: RecordCashPaymentDto,
  ): Promise<CashPaymentResult> {
    if (
      staff.role !== UserRole.ADMIN &&
      staff.role !== UserRole.OPERATOR &&
      staff.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Only staff can record cash payments');
    }

    const booking = await this.bookingModel.findById(recordCashPaymentDto.bookingId).exec();
    if (!booking) {
      throw new NotFoundException(
        `Booking with id "${recordCashPaymentDto.bookingId}" not found`,
      );
    }

    assertCompanyResourceAccess(staff, booking.company);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        'Cash payment can only be recorded for pending bookings',
      );
    }

    const existingPayment = await this.paymentModel
      .findOne({
        booking: booking._id,
        status: PaymentStatus.COMPLETED,
      })
      .exec();

    if (existingPayment) {
      throw new ConflictException('This booking already has a completed payment');
    }

    const currency =
      this.configService.get<string>('payments.defaultCurrency') ?? 'KES';

    let payment: PaymentDocument;
    try {
      payment = await this.paymentModel.create({
        booking: booking._id,
        company: booking.company,
        user: booking.user ?? null,
        receivedBy: new Types.ObjectId(staff.userId),
        amount: booking.totalPrice,
        currency,
        method: PaymentMethod.CASH,
        status: PaymentStatus.COMPLETED,
        paymentReference: this.generatePaymentReference(),
        notes: recordCashPaymentDto.notes?.trim(),
      });
    } catch (error) {
      this.handleDuplicateKeyError(error);
      throw error;
    }

    booking.status = BookingStatus.CONFIRMED;
    await booking.save();

    return {
      payment: await this.populatePayment(payment._id.toString()),
      booking: await this.bookingModel
        .findById(booking._id)
        .populate('trip')
        .populate('user', '-password')
        .populate('bookedBy', 'fullName email phone')
        .exec() as BookingDocument,
    };
  }

  async findAll(
    query: QueryPaymentDto,
    currentUser: AuthenticatedUser,
  ): Promise<PaymentDocument[]> {
    const filter: Record<string, unknown> = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.method) {
      filter.method = query.method;
    }

    if (query.booking) {
      filter.booking = new Types.ObjectId(query.booking);
    }

    if (currentUser.role === UserRole.CUSTOMER) {
      filter.user = new Types.ObjectId(currentUser.userId);
    } else if (currentUser.companyId) {
      filter.company = new Types.ObjectId(currentUser.companyId);
    }

    return this.paymentModel
      .find(filter)
      .populate('booking')
      .populate('user', '-password')
      .populate('receivedBy', 'fullName email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<PaymentDocument> {
    const payment = await this.populatePayment(id);

    if (!payment) {
      throw new NotFoundException(`Payment with id "${id}" not found`);
    }

    this.assertCanAccessPayment(payment, currentUser);
    return payment;
  }

  async findByBookingId(
    bookingId: string,
    currentUser: AuthenticatedUser,
  ): Promise<PaymentDocument[]> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with id "${bookingId}" not found`);
    }

    this.assertCanAccessBookingForPayment(booking, currentUser);

    return this.paymentModel
      .find({ booking: new Types.ObjectId(bookingId) })
      .populate('booking')
      .populate('user', '-password')
      .populate('receivedBy', 'fullName email phone')
      .sort({ createdAt: -1 })
      .exec();
  }

  private async populatePayment(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel
      .findById(id)
      .populate('booking')
      .populate('user', '-password')
      .populate('receivedBy', 'fullName email phone')
      .exec();

    if (!payment) {
      throw new NotFoundException(`Payment with id "${id}" not found`);
    }

    return payment;
  }

  private assertCanAccessPayment(
    payment: PaymentDocument,
    currentUser: AuthenticatedUser,
  ): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.CUSTOMER) {
      if (!payment.user || payment.user.toString() !== currentUser.userId) {
        throw new ForbiddenException('You can only access your own payments');
      }
      return;
    }

    if (
      currentUser.companyId &&
      payment.company.toString() !== currentUser.companyId
    ) {
      throw new ForbiddenException('You can only access your company payments');
    }
  }

  private assertCanAccessBookingForPayment(
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

  private generatePaymentReference(): string {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${randomPart}`;
  }

  private handleDuplicateKeyError(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      throw new ConflictException('Payment reference already exists');
    }
  }
}
