import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ROUTES } from "../../constants";
import Button from "../../components/common/Button/Button";
import Icon from "../../components/common/Icon/Icon";
import { addToCart } from "../../store/slices/cartSlice";
import { fetchWishlist, removeWishlistItem } from "../../store/slices/wishlistSlice";
import { productPath, productPrice, productTitle } from "../../utils/products";

export const WishlistPage = () => {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const drops = wishlistItems.filter((item) => item.hasPriceDrop);

  return (
    <div className='site-container bg-background py-5 text-text md:py-8'>
      <nav className='page-breadcrumb' aria-label='Breadcrumb'>
        <Link to={ROUTES.HOME} className='hover:text-warning transition-colors'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} />
        <span className='font-medium text-text'>My Wishlist</span>
      </nav>

      <div className='mb-4 border-b border-border pb-4'>
        <h1 className='page-title mb-1'>
          My Saved Wishlist
        </h1>
        <p className='text-[13px] text-text-muted'>
          You have{" "}
          <span className='font-bold text-warning'>{wishlistItems.length}</span>{" "}
          items saved for later.
          {drops.length > 0 ? (
            <span className='ml-2 font-semibold text-success'>{drops.length} price drop{drops.length > 1 ? 's' : ''}!</span>
          ) : null}
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {wishlistItems.map((item) => {
          const title = productTitle(item);
          const price = productPrice(item);
          return (
            <div
              key={item._id}
              className='bg-background-secondary border border-border rounded-2xl p-4 flex flex-col justify-between shadow-sm'
            >
              <div>
                <Link to={productPath(item)}>
                  <img
                    src={item.image}
                    alt={title}
                    className='w-full h-40 object-cover rounded-xl mb-3 border border-border'
                  />
                </Link>
                <h3 className='font-bold text-text text-sm sm:text-base line-clamp-1 mb-1'>
                  {title}
                </h3>
                <p className='text-warning font-extrabold text-sm mb-1'>
                  ৳{price.toLocaleString()}
                </p>
                {item.hasPriceDrop ? (
                  <p className='mb-2 text-[11px] font-bold text-success'>
                    Price dropped ৳{Number(item.priceDrop || 0).toLocaleString()} ({item.priceDropPercent}%) since you saved it
                  </p>
                ) : null}
                <span
                  className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full mb-4 ${item.stockStatus === "out_of_stock" || item.stock <= 0 ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}
                >
                  {item.stockStatus === "out_of_stock" || item.stock <= 0 ? "Out of Stock" : "In Stock"}
                </span>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='solid'
                  size='sm'
                  className='flex-1 bg-warning text-white hover:bg-warning/90 text-xs py-2 rounded-xl'
                  disabled={item.stockStatus === "out_of_stock" || item.stock <= 0}
                  onClick={() => dispatch(addToCart({ productId: item._id, quantity: 1 }))}
                >
                  Move to Cart
                </Button>
                <button
                  onClick={() => dispatch(removeWishlistItem(item._id))}
                  className='p-2 border border-border rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors'
                >
                  <Icon name='trash' size={4} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {!wishlistItems.length ? (
        <p className='py-12 text-center text-sm text-text-muted'>Your wishlist is empty.</p>
      ) : null}
    </div>
  );
};

export default WishlistPage;
