import mongoose, { Schema } from 'mongoose';
const AuditLogSchema = new Schema({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: null },
    targetId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
    requestId: { type: String, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });
export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
//# sourceMappingURL=audit-log.model.js.map