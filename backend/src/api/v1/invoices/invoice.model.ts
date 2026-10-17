import mongoose, { Schema, type Model } from 'mongoose';

const InvoiceTemplateSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    isDefault: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true },
    companyName: { type: String, default: 'GBLrcDrone', trim: true },
    logo: { type: String, default: '' },
    address: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    accentColor: { type: String, default: '#f59e0b', trim: true },
    currencySymbol: { type: String, default: '৳', trim: true },
    headerNote: { type: String, default: 'Tax Invoice / Receipt', trim: true },
    footerNote: {
      type: String,
      default: 'Thank you for shopping with us. For support, reply to this invoice or contact our store.',
      trim: true,
    },
    terms: { type: String, default: 'Goods once sold are subject to our return policy.', trim: true },
    showSku: { type: Boolean, default: true },
    showPayment: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const InvoiceTemplateModel = (
  mongoose.models.InvoiceTemplate || mongoose.model('InvoiceTemplate', InvoiceTemplateSchema)
) as Model<any>;
