import { envelope } from '../../../core/http/middleware.js';
import { auditLog } from '../../../core/logging/audit.js';
import { BadRequestError } from '../../../core/http/errors.js';
import { bulkUpdateCategories, createCategory, disableCategory, getCategoryUsage, listManagedCategories, reorderCategories, toggleCategoryVisibility, updateCategory, } from './category.service.js';
export const listAllCategories = async (_req, res) => {
    envelope.ok(res, await listManagedCategories());
};
export const addCategory = async (req, res) => {
    const payload = req.body;
    const category = await createCategory(payload);
    auditLog(req, { action: 'category.create', targetType: 'Category', targetId: category._id });
    envelope.created(res, category);
};
export const editCategory = async (req, res) => {
    const payload = req.body;
    const category = await updateCategory(String(req.params.id), payload);
    auditLog(req, { action: 'category.update', targetType: 'Category', targetId: category._id });
    envelope.ok(res, category);
};
export const deleteCategory = async (req, res) => {
    const id = String(req.params.id);
    const result = await disableCategory(id);
    auditLog(req, { action: 'category.disable', targetType: 'Category', targetId: id });
    envelope.ok(res, result);
};
export const toggleVisibility = async (req, res) => {
    const payload = req.body;
    const category = await toggleCategoryVisibility(String(req.params.id), payload);
    auditLog(req, {
        action: 'category.visibility',
        targetType: 'Category',
        targetId: category._id,
        metadata: payload,
    });
    envelope.ok(res, category);
};
export const reorderCategoryList = async (req, res) => {
    const payload = req.body;
    const categories = await reorderCategories(payload.items);
    auditLog(req, {
        action: 'category.reorder',
        targetType: 'Category',
        metadata: { count: payload.items.length },
    });
    envelope.ok(res, categories);
};
export const bulkUpdateCategoryList = async (req, res) => {
    const payload = req.body;
    const categories = await bulkUpdateCategories(payload.items);
    auditLog(req, {
        action: 'category.bulk-update',
        targetType: 'Category',
        metadata: { count: payload.items.length },
    });
    envelope.ok(res, categories);
};
export const getUsage = async (req, res) => {
    envelope.ok(res, await getCategoryUsage(String(req.params.id)));
};
export const uploadCategoryImage = async (req, res) => {
    const file = req.file;
    if (!file)
        throw new BadRequestError('Image file is required');
    const url = `/uploads/categories/${file.filename}`;
    auditLog(req, { action: 'category.image-upload', targetType: 'Category', metadata: { url } });
    envelope.created(res, { url, filename: file.filename });
};
