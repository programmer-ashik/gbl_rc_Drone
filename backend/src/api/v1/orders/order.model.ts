import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'confirmed',
  'shipped',
  'delivered',
  'completed',
  'cancelled',
] as const;

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export const PAYMENT_METHODS = ['cod', 'card', 'bkash', 'nagad', 'other'] as const;

export const normalizeOrderStatus = (status?: string) => {
  if (status === 'confirmed') return 'processing';
  return status || 'pending';
};

export const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    sku: { type: String, default: '' },
    variantName: { type: String, default: '' },
    variantSku: { type: String, default: '' },
    isCombo: { type: Boolean, default: false },
    comboItems: {
      type: [
        {
          productId: { type: Schema.Types.ObjectId, ref: 'Product' },
          title: { type: String, default: '' },
          quantity: { type: Number, default: 1 },
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const TimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: 'System' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const NoteSchema = new Schema(
  {
    body: { type: String, required: true, trim: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorName: { type: String, default: 'Admin' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const EmailLogSchema = new Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, default: '' },
    kind: { type: String, default: 'status' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    items: { type: [OrderItemSchema], default: [] },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cod', index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    transactionId: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    inventoryRestored: { type: Boolean, default: false },
    timeline: { type: [TimelineSchema], default: [] },
    notes: { type: [NoteSchema], default: [] },
    emailLog: { type: [EmailLogSchema], default: [] },
    estimatedDeliveryDate: { type: Date, default: null },
    trackingNumber: { type: String, default: '', trim: true },
    trackingUrl: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ 'shippingAddress.email': 1 });
OrderSchema.index({ 'shippingAddress.fullName': 1 });

OrderSchema.pre('validate', function ensureTimeline() {
  const order = this as any;
  if (order.status === 'confirmed') order.status = 'processing';
  if (!order.paymentStatus) {
    order.paymentStatus = order.paymentMethod === 'cod' ? 'pending' : 'pending';
  }
  if (!Array.isArray(order.timeline)) order.timeline = [];
  if (!order.timeline.length) {
    order.timeline.push({
      status: order.status || 'pending',
      note: 'Order placed',
      actorName: 'System',
      createdAt: order.createdAt || new Date(),
    });
  }
});

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: Types.ObjectId };

export const OrderModel = (
  (mongoose.models.Order as mongoose.Model<OrderDoc> | undefined) ||
  mongoose.model<OrderDoc>('Order', OrderSchema)
) as Model<any>;
