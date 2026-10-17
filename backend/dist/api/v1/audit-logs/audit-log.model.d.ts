import mongoose, { type InferSchemaType, type Types } from 'mongoose';
declare const AuditLogSchema: mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: {
        createdAt: true;
        updatedAt: false;
    };
}, {
    actorId: Types.ObjectId;
    actorEmail: string;
    action: string;
    metadata: any;
    organizationId?: Types.ObjectId | null | undefined;
    targetType?: string | null | undefined;
    targetId?: Types.ObjectId | null | undefined;
    requestId?: string | null | undefined;
    createdAt: NativeDate;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    actorId: Types.ObjectId;
    actorEmail: string;
    action: string;
    metadata: any;
    organizationId?: Types.ObjectId | null | undefined;
    targetType?: string | null | undefined;
    targetId?: Types.ObjectId | null | undefined;
    requestId?: string | null | undefined;
    createdAt: NativeDate;
}>, {}, mongoose.MergeType<mongoose.DefaultSchemaOptions, {
    timestamps: {
        createdAt: true;
        updatedAt: false;
    };
}>> & mongoose.FlatRecord<{
    actorId: Types.ObjectId;
    actorEmail: string;
    action: string;
    metadata: any;
    organizationId?: Types.ObjectId | null | undefined;
    targetType?: string | null | undefined;
    targetId?: Types.ObjectId | null | undefined;
    requestId?: string | null | undefined;
    createdAt: NativeDate;
}> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export type AuditLogDoc = InferSchemaType<typeof AuditLogSchema> & {
    _id: Types.ObjectId;
};
export declare const AuditLogModel: mongoose.Model<any, {}, {}, {}, any, any>;
export {};
