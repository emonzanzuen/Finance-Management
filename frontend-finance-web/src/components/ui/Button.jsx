import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon = null,
  iconPosition = "left",
  onClick = null,
  type = "button",
  ...props
}) => {
  const baseStyles = `inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
    fullWidth ? "w-full" : ""
  }`;

  const variants = {
    primary:
      "bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600",
    secondary:
      "bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200/80 focus-visible:ring-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700",
    success:
      "bg-success text-white shadow-sm hover:bg-success/90 focus-visible:ring-success/50",
    danger:
      "bg-danger text-white shadow-sm hover:bg-danger/90 focus-visible:ring-danger/50",
    warning:
      "bg-warning text-white shadow-sm hover:bg-warning/90 focus-visible:ring-warning/50",
    info: "bg-info text-white shadow-sm hover:bg-info/90 focus-visible:ring-info/50",
    outline:
      "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-100 hover:border-gray-400 focus-visible:ring-gray-400 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:border-gray-600",
    ghost:
      "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400 dark:text-gray-300 dark:hover:bg-gray-800",
    link: "min-h-0 px-0 py-0 text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus-visible:ring-primary-500 dark:text-primary-400 dark:hover:text-primary-300",
  };

  const sizes = {
    sm: "min-h-[34px] px-3 py-1.5 text-xs rounded-lg",
    md: "min-h-[40px] px-4 py-2 text-sm",
    lg: "min-h-[46px] px-6 py-3 text-base",
    xl: "min-h-[52px] px-8 py-3.5 text-lg",
  };

  const loadingSizes = {
    sm: "h-3.5 w-3.5 border-2",
    md: "h-4 w-4 border-2",
    lg: "h-5 w-5 border-[3px]",
    xl: "h-6 w-6 border-[3px]",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-5 w-5",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${
        variant === "link" ? "" : sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className={`${loadingSizes[size] || loadingSizes.md} rounded-full border-current border-t-transparent animate-spin`}
        />
      )}
      {Icon && iconPosition === "left" && !loading && (
        <Icon className={`${iconSizes[size] || iconSizes.md} flex-shrink-0`} aria-hidden="true" />
      )}
      {children}
      {Icon && iconPosition === "right" && !loading && (
        <Icon className={`${iconSizes[size] || iconSizes.md} flex-shrink-0`} aria-hidden="true" />
      )}
    </button>
  );
};

export default Button;