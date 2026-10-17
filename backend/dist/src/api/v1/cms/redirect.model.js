import mongoose, { Schema } from 'mongoose';
const RedirectSchema = new Schema({
    fromPath: { type: String, required: true, unique: true, trim: true, index: true },
    toPath: { type: String, required: true, trim: true },
    statusCode: { type: Number, enum: [301, 302], default: 301 },
    enabled: { type: Boolean, default: true, index: true },
    note: { type: String, default: '', trim: true, maxlength: 240 },
}, { timestamps: true });
RedirectSchema.pre('validate', function normalizePaths() {
    const doc = this;
    if (doc.fromPath && !doc.fromPath.startsWith('/'))
        doc.fromPath = `/${doc.fromPath}`;
    if (doc.toPath && !doc.toPath.startsWith('/') && !/^https?:\/\//i.test(doc.toPath)) {
        doc.toPath = `/${doc.toPath}`;
    }
    doc.fromPath = String(doc.fromPath || '').replace(/\/+$/, '') || '/';
});
export const RedirectModel = (mongoose.models.Redirect || mongoose.model('Redirect', RedirectSchema));
