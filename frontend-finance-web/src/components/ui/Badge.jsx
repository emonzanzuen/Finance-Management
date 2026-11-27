import React from "react";

const DOT_COLORS = {
  gray: "bg-gray-500",
  primary: "bg-primary-500",
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  red: "bg-red-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
};

const Badge = ({
  children,
  variant = "gray",
  size = "md",
  rounded = "full",
  className = "",
  dot = false,
  dotColor = null,
  ...props
}) => {
  const variants = {
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    primary: "bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-200",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200",
    pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200",
    outline: "border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[11px] leading-4",
    md: "px-2.5 py-0.5 text-xs leading-4",
    lg: "px-3 py-1 text-sm leading-5",
  };

  const roundedClasses = {
    full: "rounded-full",
    md: "rounded-md",
    lg: "rounded-lg",
    none: "rounded-none",
  };

  const resolvedDotColor = dotColor
    ? DOT_COLORS[dotColor] || `bg-${dotColor}-500`
    : "bg-current";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium tracking-tight ${
        variants[variant] || variants.gray
      } ${sizes[size] || sizes.md} ${
        roundedClasses[rounded] || roundedClasses.full
      } ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${resolvedDotColor}`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;