import mongoose, { Schema } from 'mongoose';
const ReviewSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },
}, { timestamps: true });
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });
export const ReviewModel = (mongoose.models.Review || mongoose.model('Review', ReviewSchema));
