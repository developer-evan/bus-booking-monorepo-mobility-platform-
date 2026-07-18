import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../users/schemas/user.schema';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
}

export type InviteDocument = Invite & Document;

@Schema({ timestamps: true })
export class Invite {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  company: Types.ObjectId;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ type: String, enum: [UserRole.ADMIN, UserRole.OPERATOR], required: true })
  role: UserRole.ADMIN | UserRole.OPERATOR;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ type: String, enum: InviteStatus, default: InviteStatus.PENDING })
  status: InviteStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  invitedBy: Types.ObjectId;

  @Prop()
  acceptedAt?: Date;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);

InviteSchema.index({ company: 1, status: 1 });
