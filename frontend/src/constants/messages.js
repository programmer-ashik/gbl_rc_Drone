export const SUCCESS_MESSAGES = {
  LOGIN: "Welcome back! You have successfully logged in.",
  LOGOUT: "You have been logged out successfully.",
  REGISTER: "Account created successfully! Please verify your email.",
  CART_ADD: "Product added to cart successfully.",
  CART_REMOVE: "Product removed from cart.",
  CART_UPDATE: "Cart updated successfully.",
  ORDER_PLACED: "Order placed successfully!",
  ORDER_CANCELLED: "Order cancelled.",
  PROFILE_UPDATE: "Profile updated successfully.",
  PASSWORD_RESET: "Password reset email sent.",
  WISHLIST_ADD: "Added to wishlist.",
  WISHLIST_REMOVE: "Removed from wishlist.",
  REVIEW_ADD: "Review added successfully.",
  REVIEW_UPDATE: "Review updated.",
  REVIEW_DELETE: "Review deleted.",
  COUPON_APPLIED: "Coupon applied successfully.",
  PAYMENT_SUCCESS: "Payment successful!",
};

export const ERROR_MESSAGES = {
  LOGIN_FAILED: "Invalid email or password. Please try again.",
  REGISTER_FAILED: "Registration failed. Please check your information.",
  EMAIL_TAKEN: "Email already registered. Please login instead.",
  PASSWORD_MISMATCH: "Passwords do not match.",
  REQUIRED_FIELD: "This field is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PHONE: "Please enter a valid phone number.",
  MIN_LENGTH: (length) => `Must be at least ${length} characters.`,
  MAX_LENGTH: (length) => `Must be less than ${length} characters.`,
  CART_EMPTY: "Your cart is empty. Add some items first.",
  OUT_OF_STOCK: "Product is out of stock.",
  PRODUCT_NOT_FOUND: "Product not found.",
  ORDER_NOT_FOUND: "Order not found.",
  PAYMENT_FAILED: "Payment failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  SERVER_ERROR: "Server error. Please try again later.",
  TIMEOUT: "Request timed out. Please try again.",
  UNAUTHORIZED: "Please login to continue.",
  FORBIDDEN: "You do not have permission to perform this action.",
};

export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  EMAIL: "Please enter a valid email address",
  MIN: (min) => `Must be at least ${min}`,
  MAX: (max) => `Must be at most ${max}`,
  MIN_LENGTH: (min) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max) => `Must be at most ${max} characters`,
  PATTERN: "Invalid format",
  CONFIRM: "Passwords do not match",
  PHONE: "Please enter a valid phone number",
  URL: "Please enter a valid URL",
  NUMBER: "Please enter a valid number",
  INTEGER: "Please enter a valid integer",
  DATE: "Please enter a valid date",
};

export const CONFIRMATION_MESSAGES = {
  DELETE_ITEM: "Are you sure you want to delete this item?",
  DELETE_ORDER: "Are you sure you want to cancel this order?",
  CLEAR_CART: "Are you sure you want to clear your cart?",
  LOGOUT: "Are you sure you want to logout?",
  DELETE_ACCOUNT:
    "Are you sure you want to delete your account? This action cannot be undone.",
};

export const LOADING_MESSAGES = {
  PRODUCTS: "Loading products...",
  PRODUCT: "Loading product details...",
  CART: "Loading cart...",
  ORDER: "Loading order...",
  PAYMENT: "Processing payment...",
  PROFILE: "Loading profile...",
};
