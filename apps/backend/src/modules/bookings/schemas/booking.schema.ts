import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum BookingChannel {
  ONLINE = 'online',
  POS = 'pos',
}

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  user?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Trip', required: true })
  trip: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: [String], required: true })
  seatNumbers: string[];

  @Prop({ required: true, min: 1 })
  passengerCount: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({ required: true, trim: true, uppercase: true })
  bookingReference: string;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ type: String, enum: BookingChannel, default: BookingChannel.ONLINE })
  channel: BookingChannel;

  @Prop({ trim: true })
  passengerName?: string;

  @Prop({ trim: true })
  passengerPhone?: string;

  @Prop({ trim: true, lowercase: true })
  passengerEmail?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  bookedBy?: Types.ObjectId | null;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ bookingReference: 1 }, { unique: true });
BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ trip: 1, status: 1 });
BookingSchema.index({ company: 1, createdAt: -1 });
BookingSchema.index({ bookingReference: 1, passengerPhone: 1 });
BookingSchema.index({ channel: 1, company: 1, createdAt: -1 });
