import mongoose, { type InferSchemaType, type Types } from 'mongoose';
declare const UserSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    email: string;
    password: string;
    role: "platform_super_admin" | "platform_admin" | "platform_support" | "org_owner" | "org_admin" | "org_viewer";
    emailVerified: boolean;
    organizationId?: Types.ObjectId | null | undefined;
    refreshTokenHash?: string | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name: string;
    email: string;
    password: string;
    role: "platform_super_admin" | "platform_admin" | "platform_support" | "org_owner" | "org_admin" | "org_viewer";
    emailVerified: boolean;
    organizationId?: Types.ObjectId | null | undefined;
    refreshTokenHash?: string | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    name: string;
    email: string;
    password: string;
    role: "platform_super_admin" | "platform_admin" | "platform_support" | "org_owner" | "org_admin" | "org_viewer";
    emailVerified: boolean;
    organizationId?: Types.ObjectId | null | undefined;
    refreshTokenHash?: string | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type UserDoc = InferSchemaType<typeof UserSchema> & {
    _id: Types.ObjectId;
};
export declare const UserModel: mongoose.Model<any, {}, {}, {}, any, any>;
export {};
