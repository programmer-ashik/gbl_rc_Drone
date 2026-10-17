// src/pages/Cart/CartPage.jsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ROUTES } from "../../constants";
import Icon from "../../components/common/Icon/Icon";
import { Button } from "../../components/common/Button/Button";
import {
  clearCart,
  fetchCart,
  removeCartItem,
  selectCart,
  updateCartItem,
} from "../../store/slices/cartSlice";
import { selectIsAuthenticated } from "../../store/slices/authSlice";

export const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: cartItems, subtotal, totalItems } = useSelector(selectCart);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Handle quantity changes
  const handleQuantityChange = (id, delta) => {
    const item = cartItems.find((entry) => entry.productId === id);
    if (!item) return;
    const nextQuantity = item.quantity + delta;
    if (nextQuantity <= 0) {
      dispatch(removeCartItem(id));
      return;
    }
    dispatch(updateCartItem({ productId: id, quantity: nextQuantity }));
  };

  // Handle item removal
  const handleRemoveItem = (id) => {
    dispatch(removeCartItem(id));
  };

  // Calculations
  const shippingFee = cartItems.length > 0 ? 100 : 0;
  const total = subtotal + (cartItems.length > 0 ? shippingFee : 0);

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.CHECKOUT || "/checkout" } });
      return;
    }
    navigate(ROUTES.CHECKOUT || "/checkout");
  };

  return (
    <div className='site-container py-8 md:py-12 bg-background text-text'>
      {/* Breadcrumb Navigation */}
      <nav className='flex items-center gap-2 text-xs sm:text-sm text-text-muted mb-6'>
        <Link to={ROUTES.HOME} className='hover:text-warning transition-colors'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} />
        <span className='text-text font-medium'>Shopping Cart</span>
      </nav>

      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-border gap-4'>
        <div>
          <h1 className='text-2xl sm:text-4xl font-extrabold text-text tracking-tight mb-1'>
            Your Shopping Cart
          </h1>
          <p className='text-sm text-text-muted'>
            You have{" "}
            <span className='font-bold text-warning'>{totalItems}</span>{" "}
            item(s) in your cart
          </p>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={() => dispatch(clearCart())}
            className='text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 w-fit transition-colors'
          >
            <Icon name='trash-2' size={4} />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {cartItems.length > 0 ? (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Side: Cart Items List */}
          <div className='lg:col-span-2 space-y-4'>
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className='bg-background-secondary p-4 sm:p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all'
              >
                {/* Product Image & Info */}
                <div className='flex items-center gap-4 w-full sm:w-auto'>
                  <img
                    src={item.image}
                    alt={item.title}
                    className='w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-border bg-background flex-shrink-0'
                  />
                  <div className='flex flex-col gap-1'>
                    <h3 className='font-bold text-text text-sm sm:text-base line-clamp-1'>
                      {item.title}
                    </h3>
                    <div className='flex items-center gap-2 mt-1'>
                      <span className='text-sm sm:text-base font-extrabold text-text'>
                        ৳{item.price}
                      </span>
                      {item.originalPrice && (
                        <span className='text-xs text-text-muted line-through'>
                          ৳{item.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Remove Action */}
                <div className='flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-border'>
                  {/* Quantity Stepper */}
                  <div className='flex items-center border border-border rounded-xl bg-background overflow-hidden'>
                    <button
                      onClick={() => handleQuantityChange(item.productId, -1)}
                      className='px-3 py-1.5 text-text-muted hover:text-text hover:bg-background-secondary transition-colors'
                    >
                      -
                    </button>
                    <span className='px-3 py-1.5 text-xs sm:text-sm font-bold text-text min-w-[32px] text-center'>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, 1)}
                      className='px-3 py-1.5 text-text-muted hover:text-text hover:bg-background-secondary transition-colors'
                    >
                      +
                    </button>
                  </div>

                  {/* Total Item Price */}
                  <div className='text-right min-w-[70px]'>
                    <span className='text-sm sm:text-base font-extrabold text-warning'>
                      ৳{item.price * item.quantity}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className='text-text-muted hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors'
                  >
                    <Icon name='trash' size={4} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side: Order Summary */}
          <div className='space-y-6'>
            <div className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm'>
              <h3 className='text-base font-bold text-text mb-4 pb-3 border-b border-border'>
                Order Summary
              </h3>

              <div className='space-y-3 mb-6 text-xs sm:text-sm'>
                <div className='flex justify-between text-text-muted'>
                  <span>Subtotal</span>
                  <span className='text-text font-semibold'>৳{subtotal}</span>
                </div>
                <div className='flex justify-between text-text-muted'>
                  <span>Estimated Shipping</span>
                  <span className='text-text font-semibold'>
                    ৳{shippingFee}
                  </span>
                </div>
                <div className='flex justify-between text-base font-extrabold text-text pt-3 border-t border-border'>
                  <span>Total</span>
                  <span className='text-warning'>৳{total}</span>
                </div>
              </div>

              {/* Proceed to Checkout Button */}
              <Button
                variant='solid'
                size='lg'
                onClick={handleProceedToCheckout}
                className='w-full bg-warning text-white hover:bg-warning/90 font-bold py-3.5 rounded-xl shadow-lg shadow-warning/20 flex items-center justify-center gap-2 text-sm'
              >
                <span>{isAuthenticated ? "Proceed to Checkout" : "Log in to Checkout"}</span>
                <Icon name='arrow-right' size={4} />
              </Button>
              {!isAuthenticated ? (
                <p className='mt-2 text-center text-xs text-text-muted'>
                  You must be logged in to place an order.
                </p>
              ) : null}
            </div>

            {/* Secure Shopping Note */}
            <div className='bg-background-secondary p-4 rounded-xl border border-border flex items-center gap-3 text-xs text-text-muted'>
              <div className='bg-warning/10 text-warning p-2 rounded-lg'>
                <Icon name='shield-check' size={5} />
              </div>
              <p>
                Safe and secure checkout. Genuine maker parts with guaranteed
                testing policy.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Cart State */
        <div className='flex flex-col items-center justify-center py-20 text-center bg-background-secondary rounded-3xl border border-border'>
          <div className='bg-warning/10 text-warning p-4 rounded-full mb-4'>
            <Icon name='shopping-cart' size={8} />
          </div>
          <h3 className='text-xl font-bold text-text mb-2'>
            Your Cart is Empty
          </h3>
          <p className='text-sm text-text-muted max-w-sm mb-6'>
            Looks like you haven't added any drone components or development
            boards to your cart yet.
          </p>
          <Link to={ROUTES.PRODUCTS || "/products"}>
            <Button
              variant='solid'
              size='sm'
              className='bg-warning text-white hover:bg-warning/95 px-6 py-3 rounded-xl font-medium'
            >
              Start Shopping
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Cart;
