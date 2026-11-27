import React from "react";

const Card = ({
  children,
  className = "",
  hover = false,
  padding = true,
  border = true,
  shadow = true,
  glass = false,
  ...props
}) => {
  const baseStyles = `rounded-2xl transition-all duration-200 ${
    glass
      ? "bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl"
      : "bg-white dark:bg-gray-900"
  } ${
    border ? "border border-gray-200/90 dark:border-gray-800/90" : ""
  } ${shadow ? "shadow-card" : ""} ${padding ? "p-5 sm:p-6" : ""} ${
    hover ? "card-hover" : ""
  } ${className}`;

  return (
    <div className={baseStyles} {...props}>
      {children}
    </div>
  );
};

export default Card;