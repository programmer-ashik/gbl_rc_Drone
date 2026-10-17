import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
const uploadDir = path.join(process.cwd(), 'uploads', 'categories');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, uploadDir);
    },
    filename: (_req, file, callback) => {
        const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
        callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
    },
});
export const categoryImageUpload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
            callback(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
            return;
        }
        callback(null, true);
    },
});
