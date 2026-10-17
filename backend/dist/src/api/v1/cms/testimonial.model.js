import mongoose, { Schema } from 'mongoose';
const TestimonialSchema = new Schema({
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, default: '', trim: true, maxlength: 120 },
    quote: { type: String, required: true, trim: true, maxlength: 1000 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    avatar: { type: String, default: '' },
    enabled: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });
export const TestimonialModel = (mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema));
