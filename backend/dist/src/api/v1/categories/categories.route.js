import { Router } from 'express';
import { asyncHandler } from '../../../utils/async-handler.js';
import { zodValidate } from '../../../core/http/validate.js';
import { requireAuth, requireRole } from '../../../core/auth/middleware.js';
import { BadRequestError } from '../../../core/http/errors.js';
import { addCategory, bulkUpdateCategoryList, deleteCategory, editCategory, getUsage, listAllCategories, reorderCategoryList, toggleVisibility, uploadCategoryImage, } from './admin-category.controller.js';
import { listCategoryTree, listFooterCategories, listNavCategories, listSubcategories, } from './category.controller.js';
import { categoryImageUpload } from './category-upload.js';
import { bulkUpdateSchema, categoryCreateSchema, categoryWriteSchema, reorderSchema, visibilitySchema, } from './category.service.js';
const adminOnly = [requireAuth, requireRole('store_admin', 'platform_admin', 'platform_super_admin')];
const handleImageUpload = (req, res, next) => {
    categoryImageUpload.single('image')(req, res, (error) => {
        if (error) {
            next(new BadRequestError(error.message || 'Image upload failed'));
            return;
        }
        next();
    });
};
export const categoriesRouter = Router();
categoriesRouter.get('/tree', asyncHandler(listCategoryTree));
categoriesRouter.get('/nav', asyncHandler(listNavCategories));
categoriesRouter.get('/footer', asyncHandler(listFooterCategories));
categoriesRouter.get('/', asyncHandler(listCategoryTree));
categoriesRouter.get('/manage/all', ...adminOnly, asyncHandler(listAllCategories));
categoriesRouter.post('/upload-image', ...adminOnly, handleImageUpload, asyncHandler(uploadCategoryImage));
categoriesRouter.get('/:id/usage', ...adminOnly, asyncHandler(getUsage));
categoriesRouter.get('/:slug/sub', asyncHandler(listSubcategories));
categoriesRouter.post('/', ...adminOnly, zodValidate(categoryCreateSchema), asyncHandler(addCategory));
categoriesRouter.put('/reorder', ...adminOnly, zodValidate(reorderSchema), asyncHandler(reorderCategoryList));
categoriesRouter.put('/bulk', ...adminOnly, zodValidate(bulkUpdateSchema), asyncHandler(bulkUpdateCategoryList));
categoriesRouter.patch('/:id/visibility', ...adminOnly, zodValidate(visibilitySchema), asyncHandler(toggleVisibility));
categoriesRouter.put('/:id', ...adminOnly, zodValidate(categoryWriteSchema), asyncHandler(editCategory));
categoriesRouter.delete('/:id', ...adminOnly, asyncHandler(deleteCategory));
