import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

const WishlistItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    priceAtAdd: { type: Number, required: true, min: 0 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const WishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    /** @deprecated Prefer items[]; kept in sync for older clients */
    productIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    items: { type: [WishlistItemSchema], default: [] },
  },
  { timestamps: true },
);

export type WishlistDoc = InferSchemaType<typeof WishlistSchema> & { _id: Types.ObjectId };

export const WishlistModel = (
  mongoose.models.Wishlist || mongoose.model('Wishlist', WishlistSchema)
) as Model<any>;
