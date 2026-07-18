import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum CompanyStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  slug: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ type: String, enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  status: CompanyStatus;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
