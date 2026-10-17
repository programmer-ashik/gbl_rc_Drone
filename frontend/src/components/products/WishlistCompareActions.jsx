import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../common/Icon/Icon";
import { addWishlistItem, removeWishlistItem } from "../../store/slices/wishlistSlice";
import { addToCompare, isInCompare, removeFromCompare, subscribeCompare } from "../../utils/compare";
import { ROUTES } from "../../constants";
import { cn } from "../../utils/cn";

const Spinner = ({ className = "h-3.5 w-3.5" }) => (
  <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export const WishlistCompareActions = ({
  product,
  variant = "icon",
  className = "",
  onBeforeNavigate,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const actionLoadingId = useSelector((state) => state.wishlist.actionLoadingId);
  const isAuthed = Boolean(useSelector((state) => state.auth.accessToken || state.auth.user));
  const [, setCompareTick] = useState(0);
  const [compareBusy, setCompareBusy] = useState(false);

  React.useEffect(() => subscribeCompare(() => setCompareTick((value) => value + 1)), []);

  const id = String(product?._id || product?.id || "");
  if (!id) return null;

  const wished = wishlistItems.some((item) => String(item._id || item.id) === id);
  const compared = isInCompare(id);
  const wishlistBusy = actionLoadingId === id;

  const toggleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthed) {
      onBeforeNavigate?.();
      navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
      return;
    }
    try {
      if (wished) await dispatch(removeWishlistItem(id)).unwrap();
      else await dispatch(addWishlistItem(id)).unwrap();
    } catch (error) {
      const message = String(error?.message || error || "");
      if (/session expired|unauthorized|invalid token|jwt/i.test(message)) {
        window.confirm("Your session has expired. Please sign in again.");
        navigate(ROUTES.LOGIN, { state: { from: location.pathname } });
        return;
      }
      window.alert(message || "Wishlist update failed. Please try again.");
    }
  };

  const toggleCompare = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCompareBusy(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      if (compared) removeFromCompare(id);
      else {
        const result = addToCompare(product);
        if (result.error) window.alert(result.error);
      }
    } finally {
      setCompareBusy(false);
    }
  };

  if (variant === "text") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        <button
          type="button"
          disabled={wishlistBusy}
          onClick={toggleWishlist}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold outline-none focus:outline-none focus-visible:outline-none disabled:opacity-60"
        >
          {wishlistBusy ? <Spinner /> : <Icon name="heart" size={3.5} className="cursor-pointer" />}
          {wished ? "Remove wishlist" : "Wishlist"}
        </button>
        <button
          type="button"
          disabled={compareBusy}
          onClick={toggleCompare}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold outline-none focus:outline-none focus-visible:outline-none disabled:opacity-60"
        >
          {compareBusy ? <Spinner /> : <Icon name="grid" size={3.5} className="cursor-pointer" />}
          {compared ? "Remove compare" : "Compare"}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-end gap-1.5", className)}>
      <button
        type="button"
        disabled={wishlistBusy}
        onClick={toggleWishlist}
        className={cn(
          "cursor-pointer rounded-full p-2 shadow-sm outline-none focus:outline-none focus-visible:outline-none disabled:opacity-60",
          wished ? "bg-warning text-white" : "bg-background/95 text-text-muted hover:text-warning",
        )}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
      >
        {wishlistBusy ? <Spinner className="h-4 w-4" /> : <Icon name="heart" size={4} className="cursor-pointer" />}
      </button>
      <button
        type="button"
        disabled={compareBusy}
        onClick={toggleCompare}
        className={cn(
          "cursor-pointer rounded-full p-2 shadow-sm outline-none focus:outline-none focus-visible:outline-none disabled:opacity-60",
          compared ? "bg-warning text-white" : "bg-background/95 text-text-muted hover:text-warning",
        )}
        aria-label="Compare"
      >
        {compareBusy ? <Spinner className="h-4 w-4" /> : <Icon name="grid" size={4} className="cursor-pointer" />}
      </button>
    </div>
  );
};

export default WishlistCompareActions;
