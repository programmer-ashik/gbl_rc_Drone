import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const imageDir = path.join(process.cwd(), 'uploads', 'products');
const fileDir = path.join(process.cwd(), 'uploads', 'product-files');
fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(fileDir, { recursive: true });

const makeStorage = (directory: string) =>
  multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, directory);
    },
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
      callback(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
    },
  });

export const productImageUpload = multer({
  storage: makeStorage(imageDir),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      callback(new Error('Only JPG, PNG, WEBP, or GIF images are allowed'));
      return;
    }
    callback(null, true);
  },
});

export const productFileUpload = multer({
  storage: makeStorage(fileDir),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;
    if (!allowed.test(file.mimetype)) {
      callback(new Error('Only images or PDF files are allowed'));
      return;
    }
    callback(null, true);
  },
});

export const productImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const name = (file.originalname || '').toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      callback(new Error('Upload a CSV or Excel file'));
      return;
    }
    callback(null, true);
  },
});
