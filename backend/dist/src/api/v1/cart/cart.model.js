import mongoose, { Schema } from 'mongoose';
const CartItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
}, { _id: false });
const CartSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: undefined, index: true },
    sessionId: { type: String, default: undefined, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: undefined, index: true },
    items: { type: [CartItemSchema], default: [] },
}, { timestamps: true });
// One cart per authenticated user (partial so guest carts with no userId are allowed)
CartSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });
// One cart per guest session
CartSchema.index({ sessionId: 1 }, { unique: true, partialFilterExpression: { sessionId: { $type: 'string' } } });
export const CartModel = (mongoose.models.Cart ||
    mongoose.model('Cart', CartSchema));
