import mongoose, { Schema } from 'mongoose';
const SeoSettingsSchema = new Schema({
    key: { type: String, default: 'default', unique: true },
    siteName: { type: String, default: 'GBLrcDrone' },
    siteUrl: { type: String, default: 'https://gblrcdrone.com' },
    defaultMetaTitle: { type: String, default: 'GBLrcDrone — RC Parts & Robotics' },
    defaultMetaDescription: {
        type: String,
        default: 'Buy FPV drones, RC electronics, and robotics parts online at gblrcdrone.com.',
    },
    productTitlePattern: {
        type: String,
        default: '{productName} - Buy Online at gblrcdrone.com',
    },
    categoryUrlPattern: { type: String, default: '/category/{slug}' },
    productUrlPattern: { type: String, default: '/product/{slug}' },
    robotsTxt: {
        type: String,
        default: `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /login\nDisallow: /checkout\n\nSitemap: https://gblrcdrone.com/sitemap.xml\n`,
    },
    ogImage: { type: String, default: '' },
}, { timestamps: true });
export const SeoSettingsModel = (mongoose.models.SeoSettings || mongoose.model('SeoSettings', SeoSettingsSchema));
