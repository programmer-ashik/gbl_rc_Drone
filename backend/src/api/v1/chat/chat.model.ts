import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

const ChatMessageSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    senderRole: { type: String, enum: ['customer', 'admin', 'guest'], default: 'guest' },
    senderName: { type: String, default: 'Guest' },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const ChatThreadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    guestId: { type: String, default: null, index: true },
    guestName: { type: String, default: 'Guest' },
    guestEmail: { type: String, default: '' },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    messages: { type: [ChatMessageSchema], default: [] },
  },
  { timestamps: true },
);

export type ChatThreadDoc = InferSchemaType<typeof ChatThreadSchema> & { _id: Types.ObjectId };

export const ChatThreadModel = (
  mongoose.models.ChatThread || mongoose.model('ChatThread', ChatThreadSchema)
) as Model<any>;
