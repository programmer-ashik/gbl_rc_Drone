import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';
import { ALL_ROLES } from '../../../constants/roles.js';

const AddressSchema = new Schema(
  {
    label: { type: String, default: 'Home', trim: true },
    fullName: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    postalCode: { type: String, default: '', trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, required: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    emailVerified: { type: Boolean, default: true },
    isBlocked: { type: Boolean, default: false, index: true },
    addresses: { type: [AddressSchema], default: [] },
    tags: { type: [String], default: [] },
    crmNotes: {
      type: [
        {
          body: { type: String, required: true, trim: true },
          authorName: { type: String, default: 'Admin' },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    refreshTokenHash: { type: String, default: null, select: false },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });
UserSchema.index({ name: 1 });
UserSchema.index({ phone: 1 });

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };

export const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as Model<any>;
