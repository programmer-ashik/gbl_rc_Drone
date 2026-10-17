import mongoose, { Schema } from 'mongoose';
const ApiKeySchema = new Schema({
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true,
    },
    name: { type: String, required: true, trim: true },
    prefix: { type: String, required: true, index: true },
    keyHash: { type: String, required: true, select: false },
    permissions: { type: [String], default: [] },
    status: { type: String, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE' },
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
export const ApiKeyModel = mongoose.models.ApiKey || mongoose.model('ApiKey', ApiKeySchema);
//# sourceMappingURL=api-key.model.js.map