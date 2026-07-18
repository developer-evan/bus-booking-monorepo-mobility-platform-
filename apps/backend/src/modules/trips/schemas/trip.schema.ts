import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum TripStatus {
  SCHEDULED = 'scheduled',
  BOARDING = 'boarding',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type TripDocument = Trip & Document;

@Schema({ timestamps: true })
export class Trip {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Route', required: true })
  route: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Bus', required: true })
  bus: Types.ObjectId;

  @Prop({ required: true })
  departureTime: Date;

  @Prop({ required: true })
  arrivalTime: Date;

  @Prop({ required: true, min: 0 })
  pricePerSeat: number;

  @Prop({ required: true, min: 0 })
  availableSeats: number;

  @Prop({ type: String, enum: TripStatus, default: TripStatus.SCHEDULED })
  status: TripStatus;
}

export const TripSchema = SchemaFactory.createForClass(Trip);

TripSchema.index({ route: 1, departureTime: 1 });
TripSchema.index({ bus: 1, departureTime: 1 });
