import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import sharp from "sharp";
import { BadRequestError } from "../../../core/http/errors.js";

const imageDir = path.join(process.cwd(), "uploads", "products");
const fileDir = path.join(process.cwd(), "uploads", "product-files");
fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(fileDir, { recursive: true });

const IMAGE_MIME =
  /^(image\/(jpeg|pjpeg|png|webp|gif|avif|bmp|heic|heif|x-png)|application\/octet-stream)$/i;
const IMAGE_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".bmp",
  ".heic",
  ".heif",
]);

const uniqueName = (ext: string) =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

const makeDiskStorage = (directory: string) =>
  multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, directory);
    },
    filename: (_req, file, callback) => {
      const ext = path.extname(file.originalname || "").toLowerCase() || ".bin";
      callback(null, uniqueName(ext));
    },
  });

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, callback) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (IMAGE_MIME.test(file.mimetype || "") || IMAGE_EXT.has(ext)) {
      callback(null, true);
      return;
    }
    callback(
      new Error("Only JPG, PNG, WEBP, GIF, AVIF, or BMP images are allowed"),
    );
  },
});

export const collectUploadedImages = (req: {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
}) => {
  const collected: Express.Multer.File[] = [];
  if (req.file) collected.push(req.file);
  if (Array.isArray(req.files)) collected.push(...req.files);
  else if (req.files && typeof req.files === "object") {
    collected.push(...Object.values(req.files).flat());
  }
  return collected.filter((file) => file?.buffer?.length);
};

export const saveProductImagesAsWebp = async (files: Express.Multer.File[]) => {
  if (!files.length) throw new BadRequestError("Image file is required");
  const items: Array<{ url: string; filename: string; originalName: string }> =
    [];

  for (const [index, file] of files.entries()) {
    const filename = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 10)}.webp`;
    const dest = path.join(imageDir, filename);
    try {
      await sharp(file.buffer, { failOn: "none", animated: false })
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toFile(dest);
    } catch {
      throw new BadRequestError(
        `Could not convert ${file.originalname || "image"} to WebP`,
      );
    }
    items.push({
      url: `/uploads/products/${filename}`,
      filename,
      originalName: file.originalname || filename,
    });
  }

  return items;
};

export const productFileUpload = multer({
  storage: makeDiskStorage(fileDir),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;
    if (!allowed.test(file.mimetype)) {
      callback(new Error("Only images or PDF files are allowed"));
      return;
    }
    callback(null, true);
  },
});

export const productImportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const name = (file.originalname || "").toLowerCase();
    if (
      !name.endsWith(".csv") &&
      !name.endsWith(".xlsx") &&
      !name.endsWith(".xls")
    ) {
      callback(new Error("Upload a CSV or Excel file"));
      return;
    }
    callback(null, true);
  },
});
