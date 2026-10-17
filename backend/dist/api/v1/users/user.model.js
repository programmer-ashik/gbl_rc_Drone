import mongoose, { Schema } from 'mongoose';
import { ALL_ROLES } from '../../../constants/roles.js';
const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, required: true },
    organizationId: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
        index: true,
    },
    emailVerified: { type: Boolean, default: true },
    refreshTokenHash: { type: String, default: null, select: false },
}, { timestamps: true });
UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
//# sourceMappingURL=user.model.js.map