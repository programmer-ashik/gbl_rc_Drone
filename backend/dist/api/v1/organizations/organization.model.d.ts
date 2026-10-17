import mongoose, { type InferSchemaType, type Types } from 'mongoose';
declare const OrganizationSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
    name: string;
    slug: string;
    subscription: {
        status: "ACTIVE" | "PAST_DUE" | "INACTIVE" | "CANCELLED";
        plan: "FREEMIUM" | "STARTER" | "PRO" | "ENTERPRISE";
        startedAt: NativeDate;
        expiresAt?: NativeDate | null | undefined;
    };
    owner?: Types.ObjectId | null | undefined;
    branding?: {
        logo: string;
        primaryColor: string;
    } | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
    name: string;
    slug: string;
    subscription: {
        status: "ACTIVE" | "PAST_DUE" | "INACTIVE" | "CANCELLED";
        plan: "FREEMIUM" | "STARTER" | "PRO" | "ENTERPRISE";
        startedAt: NativeDate;
        expiresAt?: NativeDate | null | undefined;
    };
    owner?: Types.ObjectId | null | undefined;
    branding?: {
        logo: string;
        primaryColor: string;
    } | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
    name: string;
    slug: string;
    subscription: {
        status: "ACTIVE" | "PAST_DUE" | "INACTIVE" | "CANCELLED";
        plan: "FREEMIUM" | "STARTER" | "PRO" | "ENTERPRISE";
        startedAt: NativeDate;
        expiresAt?: NativeDate | null | undefined;
    };
    owner?: Types.ObjectId | null | undefined;
    branding?: {
        logo: string;
        primaryColor: string;
    } | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type OrganizationDoc = InferSchemaType<typeof OrganizationSchema> & {
    _id: Types.ObjectId;
};
export declare const OrganizationModel: mongoose.Model<any, {}, {}, {}, any, any>;
export {};
