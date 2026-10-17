import mongoose, { Schema, type Model } from 'mongoose';

const PageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    content: { type: String, default: '' },
    metaTitle: { type: String, default: '', trim: true, maxlength: 120 },
    metaDescription: { type: String, default: '', trim: true, maxlength: 320 },
    status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
    template: {
      type: String,
      enum: ['home', 'about', 'contact', 'faq', 'terms', 'privacy', 'custom'],
      default: 'custom',
      index: true,
    },
  },
  { timestamps: true },
);

PageSchema.pre('validate', function ensureMeta() {
  const doc = this as any;
  if (!doc.metaTitle) doc.metaTitle = String(doc.title || '').slice(0, 120);
  if (!doc.metaDescription) {
    doc.metaDescription = String(doc.content || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 320);
  }
});

export const PageModel = (mongoose.models.Page || mongoose.model('Page', PageSchema)) as Model<any>;
