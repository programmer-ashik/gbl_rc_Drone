import mongoose, { Schema, type InferSchemaType, type Types, type Model } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    label: { type: String, trim: true, maxlength: 80, default: '' },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    parentSlug: { type: String, default: null, index: true },
    level: { type: Number, enum: [1, 2, 3], default: 1, index: true },
    isActive: { type: Boolean, default: true, index: true },
    active: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0, min: 0 },
    order: { type: Number, default: 0, min: 0 },
    icon: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
    metaTitle: { type: String, default: '', trim: true, maxlength: 120 },
    metaDescription: { type: String, default: '', trim: true, maxlength: 320 },
    isNavVisible: { type: Boolean, default: true, index: true },
    isFooterVisible: { type: Boolean, default: false, index: true },
    productCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

CategorySchema.index({ parentId: 1, displayOrder: 1 });
CategorySchema.index({ parentSlug: 1, displayOrder: 1 });
CategorySchema.index({ isActive: 1, isNavVisible: 1, displayOrder: 1 });
CategorySchema.index({ isActive: 1, isFooterVisible: 1, displayOrder: 1 });

CategorySchema.pre('validate', function syncLegacyCategoryFields() {
  const doc = this as typeof this & {
    name?: string;
    label?: string;
    isActive?: boolean;
    active?: boolean;
    displayOrder?: number;
    order?: number;
    parentId?: Types.ObjectId | null;
    parentSlug?: string | null;
    level?: number;
  };

  const name = (doc.name || doc.label || '').trim();
  doc.name = name;
  doc.label = name;
  doc.isActive = doc.isActive ?? doc.active ?? true;
  doc.active = doc.isActive;
  const displayOrder = Number.isFinite(doc.displayOrder) ? doc.displayOrder : doc.order ?? 0;
  doc.displayOrder = displayOrder;
  doc.order = displayOrder;
  if (!doc.parentId && !doc.parentSlug) {
    doc.level = 1;
    doc.parentSlug = null;
  }
});

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: Types.ObjectId };

export const CategoryModel = (
  (mongoose.models.Category as mongoose.Model<CategoryDoc> | undefined) ||
  mongoose.model<CategoryDoc>('Category', CategorySchema)
) as Model<any>;
