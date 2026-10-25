import mongoose from "mongoose";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../../utils/async-handler.js";
import { envelope } from "../../../core/http/middleware.js";
import { zodValidate } from "../../../core/http/validate.js";
import { requireAuth } from "../../../core/auth/middleware.js";
import { BadRequestError, NotFoundError } from "../../../core/http/errors.js";
import { WishlistModel } from "./wishlist.model.js";
import { ProductModel } from "../products/product.model.js";
import { auditLog } from "../../../core/logging/audit.js";

const addSchema = z.object({
  productId: z.string().min(1),
});

const currentPrice = (product: any) => {
  const n = Number(
    product.finalPrice ??
      product.discountPrice ??
      product.price ??
      product.basePrice ??
      0,
  );
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const ensureItems = (wishlist: any) => {
  if (!Array.isArray(wishlist.items)) wishlist.items = [];
  if (
    !wishlist.items.length &&
    Array.isArray(wishlist.productIds) &&
    wishlist.productIds.length
  ) {
    wishlist.items = wishlist.productIds.map((id: any) => ({
      productId: id,
      priceAtAdd: 0,
      addedAt: new Date(),
    }));
  }
};

const serializeWishlist = async (wishlist: any) => {
  if (!wishlist) return [];
  ensureItems(wishlist);
  const ids = wishlist.items.map((item: any) => item.productId);
  const products = await ProductModel.find({
    _id: { $in: ids },
    status: "active",
  }).lean();
  const byId = new Map(
    products.map((product: any) => [product._id.toString(), product]),
  );

  return wishlist.items
    .map((item: any) => {
      const product = byId.get(item.productId.toString());
      if (!product) return null;
      const price = currentPrice(product);
      const priceAtAdd = Number(item.priceAtAdd) || price;
      const priceDrop =
        priceAtAdd > 0 && price < priceAtAdd
          ? Math.round((priceAtAdd - price) * 100) / 100
          : 0;
      return {
        ...product,
        priceAtAdd,
        priceDrop,
        priceDropPercent:
          priceAtAdd > 0 && priceDrop > 0
            ? Math.round((priceDrop / priceAtAdd) * 100)
            : 0,
        addedAt: item.addedAt,
        hasPriceDrop: priceDrop > 0,
      };
    })
    .filter(Boolean);
};

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const wishlist = await WishlistModel.findOne({ userId: req.auth!.sub });
    envelope.ok(res, await serializeWishlist(wishlist));
  }),
);

wishlistRouter.post(
  "/add",
  zodValidate(addSchema),
  asyncHandler(async (req, res) => {
    const { productId } = req.body as z.infer<typeof addSchema>;
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new BadRequestError("Invalid product id");
    const product = await ProductModel.findById(productId);
    if (!product || product.status !== "active")
      throw new NotFoundError("Product not found");

    const wishlist =
      (await WishlistModel.findOne({ userId: req.auth!.sub })) ??
      (await WishlistModel.create({
        userId: req.auth!.sub,
        organizationId: req.auth!.organizationId,
        productIds: [],
        items: [],
      }));

    ensureItems(wishlist);
    const exists = wishlist.items.some(
      (item: any) => item.productId.toString() === productId,
    );
    if (!exists) {
      const price = currentPrice(product);
      wishlist.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        priceAtAdd: price,
        addedAt: new Date(),
      });
      if (!wishlist.productIds.some((id: any) => id.toString() === productId)) {
        wishlist.productIds.push(new mongoose.Types.ObjectId(productId));
      }
      await wishlist.save();
    }

    auditLog(req, {
      action: "wishlist.add",
      targetType: "Product",
      targetId: productId,
    });
    envelope.ok(res, await serializeWishlist(wishlist));
  }),
);

wishlistRouter.delete(
  "/remove/:productId",
  asyncHandler(async (req, res) => {
    const productId = Array.isArray(req.params.productId)
      ? req.params.productId[0]
      : req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId))
      throw new BadRequestError("Invalid product id");
    const wishlist = await WishlistModel.findOne({ userId: req.auth!.sub });
    if (!wishlist) {
      envelope.ok(res, []);
      return;
    }
    ensureItems(wishlist);
    wishlist.items = wishlist.items.filter(
      (item: any) => item.productId.toString() !== productId,
    );
    wishlist.productIds = wishlist.productIds.filter(
      (id: any) => id.toString() !== productId,
    );
    await wishlist.save();
    auditLog(req, {
      action: "wishlist.remove",
      targetType: "Product",
      targetId: productId,
    });
    envelope.ok(res, await serializeWishlist(wishlist));
  }),
);

wishlistRouter.post(
  "/clear",
  asyncHandler(async (req, res) => {
    const wishlist = await WishlistModel.findOne({ userId: req.auth!.sub });
    if (!wishlist) {
      envelope.ok(res, { cleared: true });
      return;
    }
    wishlist.items = [];
    wishlist.productIds = [];
    await wishlist.save();
    auditLog(req, {
      action: "wishlist.clear",
      targetType: "Wishlist",
      targetId: wishlist._id.toString(),
    });
    envelope.ok(res, { cleared: true });
  }),
);
