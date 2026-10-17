import mongoose, { Schema, type Model } from 'mongoose';

const HeroSlideSchema = new Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    description: { type: String, default: '' },
    badge: { type: String, default: '' },
    image: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    ctaText: { type: String, default: 'Shop now' },
    ctaLink: { type: String, default: '/products' },
    secondaryCtaText: { type: String, default: '' },
    secondaryCtaLink: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: true },
);

const SectionSchema = new Schema(
  {
    key: {
      type: String,
      enum: ['hero', 'featuredCategories', 'newArrivals', 'bestSellers', 'specialOffers', 'testimonials'],
      required: true,
    },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    limit: { type: Number, default: 8 },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  },
  { _id: false },
);

const HomepageSchema = new Schema(
  {
    key: { type: String, default: 'default', unique: true },
    heroSlides: { type: [HeroSlideSchema], default: [] },
    sections: { type: [SectionSchema], default: [] },
    metaTitle: { type: String, default: 'GBLrcDrone — RC Parts & Robotics' },
    metaDescription: {
      type: String,
      default: 'Shop FPV drones, RC parts, electronics, and robotics kits online at gblrcdrone.com.',
    },
  },
  { timestamps: true },
);

export const HomepageModel = (
  mongoose.models.Homepage || mongoose.model('Homepage', HomepageSchema)
) as Model<any>;
