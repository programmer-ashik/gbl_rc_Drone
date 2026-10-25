import type { Request, Response } from "express";
import { envelope } from "../../../core/http/middleware.js";
import { CategoryModel } from "./category.model.js";
import { toCategoryDto, type CategoryDto } from "./category.mapper.js";
import {
  getFooterCategories,
  getNavCategories,
  getNavigationTree,
} from "./navigation.service.js";

export const listCategoryTree = async (_req: Request, res: Response) => {
  envelope.ok(res, await getNavigationTree());
};

export const listNavCategories = async (_req: Request, res: Response) => {
  envelope.ok(res, await getNavCategories());
};

export const listFooterCategories = async (_req: Request, res: Response) => {
  envelope.ok(res, await getFooterCategories());
};

export const listSubcategories = async (req: Request, res: Response) => {
  const slug = String(req.params.slug).toLowerCase();
  const parent = (await CategoryModel.findOne({ slug }).lean().exec()) as {
    _id: unknown;
  } | null;
  const filter = parent
    ? {
        $or: [{ parentId: parent._id }, { parentSlug: slug }],
        $and: [
          {
            $or: [
              { isActive: true },
              { isActive: { $exists: false }, active: { $ne: false } },
            ],
          },
        ],
      }
    : {
        parentSlug: slug,
        $or: [{ isActive: true }, { active: { $ne: false } }],
      };

  const items = await CategoryModel.find(filter)
    .sort({ displayOrder: 1, order: 1, name: 1 })
    .lean();
  envelope.ok(
    res,
    items.map((item) => toCategoryDto(item as unknown as CategoryDto)),
  );
};
