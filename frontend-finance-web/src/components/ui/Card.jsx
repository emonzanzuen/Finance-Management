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
  const baseStyles = `
    bg-white dark:bg-gray-900
    rounded-2xl
    transition-all duration-200
    ${border ? "border border-gray-200 dark:border-gray-800" : ""}
    ${shadow ? "shadow-sm" : ""}
    ${glass ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl" : ""}
    ${padding ? "p-6" : ""}
    ${hover ? "hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800" : ""}
    ${className}
  `;

  return (
    <div className={baseStyles} {...props}>
      {children}
    </div>
  );
};

export default Card;