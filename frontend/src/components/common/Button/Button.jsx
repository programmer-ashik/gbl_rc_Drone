// src/components/common/Button/Button.jsx
import React from "react";
import { Icon } from "../Icon/Icon";
import { cn } from "../../../utils/cn";

// Button variants
const variantClasses = {
  primary:
    "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-sm hover:shadow-md transition-all duration-200",
  secondary:
    "bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white shadow-sm hover:shadow-md transition-all duration-200",
  outline:
    "border-2 border-primary-600 text-primary-600 hover:bg-primary-50 active:bg-primary-100 dark:hover:bg-primary-950 dark:active:bg-primary-900 transition-all duration-200",
  ghost:
    "hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 dark:active:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm hover:shadow-md transition-all duration-200",
  success:
    "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm hover:shadow-md transition-all duration-200",
  warning:
    "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white shadow-sm hover:shadow-md transition-all duration-200",
  info: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200",
  dark: "bg-gray-800 hover:bg-gray-900 active:bg-gray-950 text-white shadow-sm hover:shadow-md transition-all duration-200",
  light:
    "bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 shadow-sm hover:shadow-md transition-all duration-200",
  link: "text-primary-600 hover:text-primary-700 active:text-primary-800 underline-offset-2 hover:underline dark:text-primary-400 dark:hover:text-primary-300 transition-all duration-200",
};

// Button sizes
const sizeClasses = {
  xs: "px-2.5 py-1.5 text-xs gap-1",
  sm: "px-3 py-2 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2.5",
  xl: "px-8 py-4 text-lg gap-3",
};

// Button shapes
const shapeClasses = {
  default: "rounded-lg",
  pill: "rounded-full",
  square: "rounded",
  circle: "rounded-full aspect-square",
  none: "rounded-none",
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  shape = "default",
  className = "",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  iconOnly = false,
  type = "button",
  onClick,
  "aria-label": ariaLabel,
  ...props
}) => {
  // Determine if button is icon only
  const isIconOnly = iconOnly || (!children && (leftIcon || rightIcon));

  // Base classes
  const baseClasses = cn(
    "inline-flex cursor-pointer items-center justify-center font-medium",
    "outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "select-none",
    variantClasses[variant],
    sizeClasses[size],
    shapeClasses[shape],
    fullWidth && "w-full",
    isIconOnly && "!p-0",
    className,
  );

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className={cn(
        "animate-spin",
        size === "xs"
          ? "h-3 w-3"
          : size === "sm"
            ? "h-4 w-4"
            : size === "lg"
              ? "h-5 w-5"
              : size === "xl"
                ? "h-6 w-6"
                : "h-4 w-4",
      )}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Get icon size based on button size
  const getIconSize = () => {
    const iconSizes = {
      xs: 4,
      sm: 5,
      md: 5,
      lg: 6,
      xl: 6,
    };
    return iconSizes[size] || 5;
  };

  const iconSize = getIconSize();

  // Render button content
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner />
          {!isIconOnly && <span>{children}</span>}
        </>
      );
    }

    return (
      <>
        {leftIcon && <Icon name={leftIcon} size={iconSize} />}
        {children}
        {rightIcon && <Icon name={rightIcon} size={iconSize} />}
      </>
    );
  };

  return (
    <button
      type={type}
      className={baseClasses}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel || (isIconOnly ? leftIcon || rightIcon : undefined)}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

// Export display name for debugging
Button.displayName = "Button";

export default Button;
