import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BusType {
  STANDARD = 'standard',
  LUXURY = 'luxury',
  SLEEPER = 'sleeper',
  MINI = 'mini',
}

export enum BusStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export type BusDocument = Bus & Document;

@Schema({ timestamps: true })
export class Bus {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  plateNumber: string;

  @Prop({ required: true, trim: true })
  model: string;

  @Prop({ required: true, min: 1 })
  seatCapacity: number;

  @Prop({ type: String, enum: BusType, default: BusType.STANDARD })
  busType: BusType;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: String, enum: BusStatus, default: BusStatus.ACTIVE })
  status: BusStatus;
}

export const BusSchema = SchemaFactory.createForClass(Bus);

BusSchema.index({ company: 1, plateNumber: 1 }, { unique: true });
