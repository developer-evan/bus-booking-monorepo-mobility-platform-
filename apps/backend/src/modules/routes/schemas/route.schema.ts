import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RouteDocument = Route & Document;

@Schema({ timestamps: true })
export class Route {
  @Prop({ required: true, trim: true })
  origin: string;

  @Prop({ required: true, trim: true })
  destination: string;

  @Prop({ required: true, trim: true })
  originStation: string;

  @Prop({ required: true, trim: true })
  destinationStation: string;

  @Prop({ required: true, min: 0 })
  distanceKm: number;

  @Prop({ required: true, min: 1 })
  estimatedDurationMinutes: number;

  @Prop({ type: [String], default: [] })
  intermediateStops: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const RouteSchema = SchemaFactory.createForClass(Route);

RouteSchema.index({ origin: 1, destination: 1 });
