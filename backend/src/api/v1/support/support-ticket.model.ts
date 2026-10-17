import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

const SupportTicketSchema = new Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, default: '', trim: true },
    subject: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['order', 'product', 'payment', 'account', 'technical', 'other'],
      default: 'other',
      index: true,
    },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open', index: true },
    adminNote: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

SupportTicketSchema.index({ status: 1, createdAt: -1 });

export type SupportTicketDoc = InferSchemaType<typeof SupportTicketSchema> & { _id: Types.ObjectId };
export const SupportTicketModel = (
  (mongoose.models.SupportTicket as mongoose.Model<SupportTicketDoc> | undefined) ||
  mongoose.model<SupportTicketDoc>('SupportTicket', SupportTicketSchema)
) as Model<any>;
