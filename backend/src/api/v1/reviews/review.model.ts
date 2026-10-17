import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

const ReviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },
    images: { type: [String], default: [] },
    helpfulCount: { type: Number, default: 0, min: 0 },
    helpfulBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, helpfulCount: -1 });
ReviewSchema.index({ productId: 1, createdAt: -1 });

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & { _id: Types.ObjectId };

export const ReviewModel = (mongoose.models.Review || mongoose.model('Review', ReviewSchema)) as Model<any>;
