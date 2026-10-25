import mongoose, { Schema, type Model } from "mongoose";

export interface IPaymentMethods {
  cod?: boolean;
  bkash?: boolean;
  nagad?: boolean;
  card?: boolean;
}

export interface IShippingZone {
  name: string;
  areas?: string;
  rate?: number;
  estimatedDays?: string;
}

export interface ISystemSettings {
  key: string;
  general?: {
    siteName?: string;
    logo?: string;
    favicon?: string;
    contactEmail?: string;
    phone?: string;
    address?: string;
  };
  payment?: {
    methods?: IPaymentMethods;
    bkashNumber?: string;
    nagadNumber?: string;
  };
  shipping?: {
    freeShippingThreshold?: number;
    defaultRate?: number;
    zones?: IShippingZone[];
  };
  tax?: {
    enabled?: boolean;
    rate?: number;
    label?: string;
  };
  email?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail?: string;
    fromName?: string;
    orderTemplate?: string;
    welcomeTemplate?: string;
  };
  seo?: {
    defaultMetaTitle?: string;
    defaultMetaDescription?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  security?: {
    twoFactorOptional?: boolean;
    loginAttemptsLimit?: number;
    sessionTimeoutMinutes?: number;
    requireStrongPasswords?: boolean;
  };
  maintenance?: {
    autoBackupEnabled?: boolean;
    autoBackupCron?: string;
    lastBackupAt?: Date | null;
    lastBackupFile?: string;
  };
  [key: string]: any;
}

const PaymentMethodSchema = new Schema<IPaymentMethods>(
  {
    cod: { type: Boolean, default: true },
    bkash: { type: Boolean, default: true },
    nagad: { type: Boolean, default: true },
    card: { type: Boolean, default: false },
  },
  { _id: false },
);

const ShippingZoneSchema = new Schema<IShippingZone>(
  {
    name: { type: String, required: true, trim: true },
    areas: { type: String, default: "", trim: true },
    rate: { type: Number, default: 0, min: 0 },
    estimatedDays: { type: String, default: "2-5" },
  },
  { _id: true },
);

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, default: "default", unique: true },
    general: {
      siteName: { type: String, default: "GBLrcDrone" },
      logo: { type: String, default: "" },
      favicon: { type: String, default: "" },
      contactEmail: { type: String, default: "support@gblrcdrone.com" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    payment: {
      methods: { type: PaymentMethodSchema, default: () => ({}) },
      bkashNumber: { type: String, default: "" },
      nagadNumber: { type: String, default: "" },
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 5000, min: 0 },
      defaultRate: { type: Number, default: 100, min: 0 },
      zones: { type: [ShippingZoneSchema], default: [] },
    },
    tax: {
      enabled: { type: Boolean, default: false },
      rate: { type: Number, default: 0, min: 0, max: 100 },
      label: { type: String, default: "VAT" },
    },
    email: {
      smtpHost: { type: String, default: "" },
      smtpPort: { type: Number, default: 587 },
      smtpUser: { type: String, default: "" },
      smtpPass: { type: String, default: "" },
      fromEmail: { type: String, default: "noreply@gblrcdrone.com" },
      fromName: { type: String, default: "GBLrcDrone" },
      orderTemplate: {
        type: String,
        default: "Hi {{name}}, your order {{orderNumber}} is now {{status}}.",
      },
      welcomeTemplate: {
        type: String,
        default: "Welcome to GBLrcDrone, {{name}}!",
      },
    },
    seo: {
      defaultMetaTitle: {
        type: String,
        default: "GBLrcDrone — RC Parts & Robotics",
      },
      defaultMetaDescription: {
        type: String,
        default: "Buy FPV drones, RC electronics, and robotics parts online.",
      },
      googleAnalyticsId: { type: String, default: "" },
      facebookPixelId: { type: String, default: "" },
    },
    security: {
      twoFactorOptional: { type: Boolean, default: false },
      loginAttemptsLimit: { type: Number, default: 5, min: 1, max: 50 },
      sessionTimeoutMinutes: { type: Number, default: 60, min: 5, max: 10080 },
      requireStrongPasswords: { type: Boolean, default: true },
    },
    maintenance: {
      autoBackupEnabled: { type: Boolean, default: false },
      autoBackupCron: { type: String, default: "0 3 * * *" },
      lastBackupAt: { type: Date, default: null },
      lastBackupFile: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

export const SystemSettingsModel = (mongoose.models.SystemSettings ||
  mongoose.model<ISystemSettings>(
    "SystemSettings",
    SystemSettingsSchema,
  )) as Model<ISystemSettings>;
