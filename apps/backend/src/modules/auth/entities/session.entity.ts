import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class SessionEntity extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  accessTokenHash!: string;

  @Prop({ required: true, unique: true, index: true })
  refreshTokenHash!: string;

  @Prop({ required: true })
  accessExpiresAt!: Date;

  @Prop({ required: true })
  refreshExpiresAt!: Date;

  @Prop({ default: false })
  isRevoked!: boolean;

  createdAt!: Date;
}

export const SessionSchema = SchemaFactory.createForClass(SessionEntity);

SessionSchema.index({ refreshExpiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ userId: 1, isRevoked: 1 });
