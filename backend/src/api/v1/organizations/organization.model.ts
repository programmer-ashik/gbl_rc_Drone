import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

const OrganizationSubscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ['FREEMIUM', 'STARTER', 'PRO', 'ENTERPRISE'],
      default: 'FREEMIUM',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAST_DUE', 'INACTIVE', 'CANCELLED'],
      default: 'ACTIVE',
    },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  { _id: false },
);

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    subscription: {
      type: OrganizationSubscriptionSchema,
      default: () => ({ plan: 'FREEMIUM', status: 'ACTIVE', startedAt: new Date() }),
    },
    branding: {
      logo: { type: String, default: '' },
      primaryColor: { type: String, default: '#40d4c1' },
    },
  },
  { timestamps: true },
);

export type OrganizationDoc = InferSchemaType<typeof OrganizationSchema> & {
  _id: Types.ObjectId;
};

export const OrganizationModel = (
  mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema)
) as Model<any>;
