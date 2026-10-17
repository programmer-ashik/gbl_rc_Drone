import mongoose, { type InferSchemaType, type Types } from 'mongoose';
declare const ApiKeySchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    status: "ACTIVE" | "REVOKED";
    name: string;
    organizationId: Types.ObjectId;
    prefix: string;
    keyHash: string;
    permissions: string[];
    createdBy: Types.ObjectId;
    expiresAt?: NativeDate | null | undefined;
    lastUsedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    status: "ACTIVE" | "REVOKED";
    name: string;
    organizationId: Types.ObjectId;
    prefix: string;
    keyHash: string;
    permissions: string[];
    createdBy: Types.ObjectId;
    expiresAt?: NativeDate | null | undefined;
    lastUsedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: true;
}>> & mongoose.FlatRecord<{
    status: "ACTIVE" | "REVOKED";
    name: string;
    organizationId: Types.ObjectId;
    prefix: string;
    keyHash: string;
    permissions: string[];
    createdBy: Types.ObjectId;
    expiresAt?: NativeDate | null | undefined;
    lastUsedAt?: NativeDate | null | undefined;
} & mongoose.DefaultTimestampProps> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type ApiKeyDoc = InferSchemaType<typeof ApiKeySchema> & {
    _id: Types.ObjectId;
};
export declare const ApiKeyModel: mongoose.Model<any, {}, {}, {}, any, any>;
export {};
