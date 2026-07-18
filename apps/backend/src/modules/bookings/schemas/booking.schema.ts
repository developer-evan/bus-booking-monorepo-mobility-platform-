import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Trip', required: true })
  trip: Types.ObjectId;

  @Prop({ type: [String], required: true })
  seatNumbers: string[];

  @Prop({ required: true, min: 1 })
  passengerCount: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  bookingReference: string;

  @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ user: 1, createdAt: -1 });
BookingSchema.index({ trip: 1, status: 1 });
