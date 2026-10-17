import React from "react";

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
    primary: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    outline: "border-2 border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  const roundedClasses = {
    full: "rounded-full",
    md: "rounded-md",
    lg: "rounded-lg",
    none: "rounded-none",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${roundedClasses[rounded]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColor ? `bg-${dotColor}-500` : "bg-current"
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;