// src/pages/Checkout/Checkout.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../../components/common/Icon/Icon";
import { ROUTES } from "../../constants";
import Button from "../../components/common/Button/Button";
import { clearCart, selectCart } from "../../store/slices/cartSlice";
import { selectIsAuthenticated, selectUser } from "../../store/slices/authSlice";
import { orderService } from "../../services/orderService";

export const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: cartItems, subtotal } = useSelector(selectCart);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.CHECKOUT || "/checkout" }, replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name || "",
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  const shippingFee = cartItems.length > 0 ? 100 : 0;
  const total = subtotal + shippingFee;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.CHECKOUT || "/checkout" } });
      return;
    }
    if (cartItems.length === 0) return;
    setPlacing(true);
    try {
      await orderService.create({
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantSku: item.variantSku,
          variantName: item.variantName,
        })),
        shippingAddress: formData,
        paymentMethod: paymentMethod || "cod",
      });
      await dispatch(clearCart());
      alert("Order placed successfully!");
      navigate(ROUTES.ORDERS || ROUTES.HOME);
    } catch (error) {
      alert(error.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-text-muted">Please log in to place an order…</p>
      </div>
    );
  }

  return (
    <div className='site-container bg-background py-5 text-text md:py-8'>
      {/* Breadcrumb Navigation */}
      <nav className='page-breadcrumb' aria-label='Breadcrumb'>
        <Link to={ROUTES.HOME} className='hover:text-warning transition-colors'>
          Home
        </Link>
        <Icon name='chevron-right' size={3} />
        <Link
          to={ROUTES.CART || "#"}
          className='hover:text-warning transition-colors'
        >
          Cart
        </Link>
        <Icon name='chevron-right' size={3} />
        <span className='font-medium text-text'>Checkout</span>
      </nav>

      <h1 className='page-title mb-5'>
        Secure Checkout
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Side: Shipping & Payment Form (Takes 2 Columns) */}
        <div className='lg:col-span-2 space-y-8'>
          <form onSubmit={handleSubmit} className='space-y-8'>
            {/* Shipping Details Section */}
            <div className='bg-background-secondary p-6 sm:p-8 rounded-2xl border border-border shadow-sm'>
              <h2 className='text-lg font-bold text-text mb-4 flex items-center gap-2'>
                <span className='text-warning'>01.</span> Shipping Information
              </h2>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-semibold text-text'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    name='fullName'
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder='John Doe'
                    className='bg-background border border-border text-text text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning transition-colors'
                  />
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-semibold text-text'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    name='phone'
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder='01700000000'
                    className='bg-background border border-border text-text text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning transition-colors'
                  />
                </div>

                <div className='sm:col-span-2 flex flex-col gap-1.5'>
                  <label className='text-xs font-semibold text-text'>
                    Email Address
                  </label>
                  <input
                    type='email'
                    name='email'
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='john@example.com'
                    className='bg-background border border-border text-text text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning transition-colors'
                  />
                </div>

                <div className='sm:col-span-2 flex flex-col gap-1.5'>
                  <label className='text-xs font-semibold text-text'>
                    Street Address
                  </label>
                  <input
                    type='text'
                    name='address'
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder='House/Road, Area, Laboratory Name'
                    className='bg-background border border-border text-text text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning transition-colors'
                  />
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-semibold text-text'>
                    City
                  </label>
                  <input
                    type='text'
                    name='city'
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder='Dhaka'
                    className='bg-background border border-border text-text text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning transition-colors'
                  />
                </div>

                <div className='flex flex-col gap-1.5'>
                  <label className='text-xs font-semibold text-text'>
                    Postal Code
                  </label>
                  <input
                    type='text'
                    name='postalCode'
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder='1205'
                    className='bg-background border border-border text-text text-xs sm:text-sm rounded-xl px-4 py-3 outline-none focus:border-warning transition-colors'
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className='bg-background-secondary p-6 sm:p-8 rounded-2xl border border-border shadow-sm'>
              <h2 className='text-lg font-bold text-text mb-4 flex items-center gap-2'>
                <span className='text-warning'>02.</span> Payment Method
              </h2>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {/* Cash on Delivery */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "cod" ? "border-warning bg-warning/5" : "border-border bg-background"}`}
                >
                  <input
                    type='radio'
                    name='paymentMethod'
                    value='cod'
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className='accent-warning w-4 h-4'
                  />
                  <div>
                    <span className='font-bold text-text text-sm block'>
                      Cash on Delivery
                    </span>
                    <span className='text-xs text-text-muted'>
                      Pay when you receive items
                    </span>
                  </div>
                </label>

                {/* Mobile Banking (Nagad, bKash, Rocket) */}
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "mobile" ? "border-warning bg-warning/5" : "border-border bg-background"}`}
                >
                  <input
                    type='radio'
                    name='paymentMethod'
                    value='mobile'
                    checked={paymentMethod === "mobile"}
                    onChange={() => setPaymentMethod("mobile")}
                    className='accent-warning w-4 h-4'
                    disabled
                  />
                  <div>
                    <span className='font-bold text-text text-sm block'>
                      Mobile Banking
                    </span>
                    <span className='text-xs text-text-muted'>
                      bKash, Nagad, Rocket
                    </span>
                  </div>
                </label>
              </div>

              {/* Conditional Mobile Banking Selectors */}
              {paymentMethod === "mobile" && (
                <div className='mt-4 p-4 rounded-xl bg-background border border-border space-y-3'>
                  <p className='text-xs font-semibold text-text'>
                    Select your preferred mobile wallet:
                  </p>
                  <div className='grid grid-cols-3 gap-3'>
                    <div className='border border-border p-3 rounded-xl text-center font-bold text-xs bg-background-secondary text-pink-600'>
                      bKash
                    </div>
                    <div className='border border-border p-3 rounded-xl text-center font-bold text-xs bg-background-secondary text-orange-600'>
                      Nagad
                    </div>
                    <div className='border border-border p-3 rounded-xl text-center font-bold text-xs bg-background-secondary text-purple-600'>
                      Rocket
                    </div>
                  </div>
                  <p className='text-[11px] text-text-muted'>
                    You will be prompted to enter your wallet number and PIN
                    after clicking place order.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Order Button */}
            <Button
              variant='solid'
              size='lg'
              type='submit'
              disabled={placing || cartItems.length === 0}
              className='w-full bg-warning text-white hover:bg-warning/90 font-bold py-4 rounded-xl shadow-lg shadow-warning/20 transition-all text-base'
            >
              {placing ? "Placing order..." : `Place Order (৳${total})`}
            </Button>
          </form>
        </div>

        {/* Right Side: Instructions, Policies, and Order Summary */}
        <div className='space-y-6'>
          {/* Order Summary Box */}
          <div className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm'>
            <h3 className='text-base font-bold text-text mb-4 pb-3 border-b border-border'>
              Order Summary
            </h3>
            <div className='space-y-3 mb-4 text-xs sm:text-sm'>
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  className='flex justify-between items-center text-text-muted'
                >
                  <span>
                    {item.title} x {item.quantity}
                  </span>
                  <span className='text-text font-medium'>
                    ৳{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>
            <div className='space-y-2 pt-3 border-t border-border text-xs sm:text-sm'>
              <div className='flex justify-between text-text-muted'>
                <span>Subtotal</span>
                <span className='text-text font-semibold'>৳{subtotal}</span>
              </div>
              <div className='flex justify-between text-text-muted'>
                <span>Shipping Fee</span>
                <span className='text-text font-semibold'>৳{shippingFee}</span>
              </div>
              <div className='flex justify-between text-base font-extrabold text-text pt-2 border-t border-border'>
                <span>Total Amount</span>
                <span className='text-warning'>৳{total}</span>
              </div>
            </div>
          </div>

          {/* Instructions & Guidelines Box */}
          <div className='bg-background-secondary p-6 rounded-2xl border border-border shadow-sm space-y-4 text-xs sm:text-sm'>
            <h3 className='text-base font-bold text-text pb-2 border-b border-border flex items-center gap-2'>
              <Icon name='info' size={4} />
              <span>Policies & Guidelines</span>
            </h3>

            {/* Payment Process */}
            <div>
              <h4 className='font-bold text-text mb-1'>💳 Payment Process</h4>
              <p className='text-text-muted leading-relaxed'>
                For mobile banking (bKash, Nagad, Rocket), send money to our
                merchant account using Send Money or Checkout, then provide the
                Transaction ID (TrxID) during verification.
              </p>
            </div>

            {/* Cash on Delivery Process */}
            <div>
              <h4 className='font-bold text-text mb-1'>
                📦 Cash on Delivery Process
              </h4>
              <p className='text-text-muted leading-relaxed'>
                Inspect your drone parts or hardware package carefully in front
                of the delivery agent before paying cash. Minor delivery advance
                may apply for remote areas.
              </p>
            </div>

            {/* Refund & Return Policy */}
            <div>
              <h4 className='font-bold text-text mb-1'>
                🔄 Refund & Return Policy
              </h4>
              <p className='text-text-muted leading-relaxed'>
                Electronics and microcontroller boards can be returned within 3
                days of delivery if found defective or damaged upon arrival.
                Refunds are processed through bKash, Nagad, or Rocket within 3-5
                working days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
