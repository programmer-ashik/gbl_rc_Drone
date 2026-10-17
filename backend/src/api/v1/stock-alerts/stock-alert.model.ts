import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

const StockAlertSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    notifiedAt: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

StockAlertSchema.index({ productId: 1, email: 1 }, { unique: true });

export type StockAlertDoc = InferSchemaType<typeof StockAlertSchema> & { _id: Types.ObjectId };

export const StockAlertModel = (
  mongoose.models.StockAlert || mongoose.model('StockAlert', StockAlertSchema)
) as Model<any>;
