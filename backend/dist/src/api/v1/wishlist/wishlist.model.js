import mongoose, { Schema } from 'mongoose';
const WishlistSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });
export const WishlistModel = (mongoose.models.Wishlist || mongoose.model('Wishlist', WishlistSchema));
