import mongoose, {
  Schema,
  type InferSchemaType,
  type Types,
  type Model,
} from "mongoose";

const CartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const CartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
      index: true,
    },
    sessionId: { type: String, default: undefined, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: undefined,
      index: true,
    },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
);

// One cart per authenticated user (partial so guest carts with no userId are allowed)
CartSchema.index(
  { userId: 1 },
  {
    unique: true,
    name: "cart_user_unique",
    partialFilterExpression: { userId: { $type: "objectId" } },
  },
);
// One cart per guest session
CartSchema.index(
  { sessionId: 1 },
  {
    unique: true,
    name: "cart_session_unique",
    partialFilterExpression: { sessionId: { $type: "string" } },
  },
);

export type CartDoc = InferSchemaType<typeof CartSchema> & {
  _id: Types.ObjectId;
};

export const CartModel = ((mongoose.models.Cart as
  | mongoose.Model<CartDoc>
  | undefined) || mongoose.model<CartDoc>("Cart", CartSchema)) as Model<any>;
