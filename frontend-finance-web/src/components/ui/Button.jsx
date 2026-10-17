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
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
  `;

  const variants = {
    primary: `
      bg-primary-600 text-white 
      hover:bg-primary-700 
      focus:ring-primary-500
      dark:bg-primary-500 dark:hover:bg-primary-600
    `,
    secondary: `
      bg-gray-200 text-gray-900 
      hover:bg-gray-300 
      focus:ring-gray-400
      dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700
    `,
    success: `
      bg-success text-white 
      hover:bg-success/90 
      focus:ring-success/50
    `,
    danger: `
      bg-danger text-white 
      hover:bg-danger/90 
      focus:ring-danger/50
    `,
    warning: `
      bg-warning text-white 
      hover:bg-warning/90 
      focus:ring-warning/50
    `,
    info: `
      bg-info text-white 
      hover:bg-info/90 
      focus:ring-info/50
    `,
    outline: `
      border-2 border-gray-300 text-gray-700 
      hover:bg-gray-100 
      dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800
    `,
    ghost: `
      text-gray-700 
      hover:bg-gray-100 
      dark:text-gray-300 dark:hover:bg-gray-800
    `,
    link: `
      text-primary-600 
      hover:text-primary-700 
      underline-offset-2 hover:underline
      dark:text-primary-400 dark:hover:text-primary-300
    `,
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-lg",
  };

  const loadingSizes = {
    sm: "w-3 h-3 border-2",
    md: "w-4 h-4 border-2",
    lg: "w-5 h-5 border-3",
    xl: "w-6 h-6 border-3",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <div className={`${loadingSizes[size]} border-current border-t-transparent rounded-full animate-spin`} />
      )}
      {Icon && iconPosition === "left" && !loading && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === "right" && !loading && <Icon className="w-4 h-4" />}
    </button>
  );
};

export default Button;