import React from "react";

const Switch = ({
  checked = false,
  onChange = null,
  label = null,
  description = null,
  size = "md",
  disabled = false,
  className = "",
  labelClassName = "",
}) => {
  const sizes = {
    sm: {
      container: "w-8 h-4",
      thumb: "w-3 h-3",
      translate: "translate-x-4",
    },
    md: {
      container: "w-11 h-6",
      thumb: "w-5 h-5",
      translate: "translate-x-5",
    },
    lg: {
      container: "w-14 h-7",
      thumb: "w-6 h-6",
      translate: "translate-x-7",
    },
  };

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0
          rounded-full
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${sizes[size].container}
          ${checked ? "bg-primary-600 dark:bg-primary-500" : "bg-gray-300 dark:bg-gray-700"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5
            rounded-full bg-white
            shadow-sm
            transition-transform duration-200 ease-in-out
            ${sizes[size].thumb}
            ${checked ? sizes[size].translate : "translate-x-0"}
          `}
        />
      </button>

      {(label || description) && (
        <div className={labelClassName}>
          {label && (
            <span className={`text-sm font-medium text-gray-900 dark:text-white ${disabled ? "opacity-50" : ""}`}>
              {label}
            </span>
          )}
          {description && (
            <p className={`text-xs text-gray-500 dark:text-gray-400 ${disabled ? "opacity-50" : ""}`}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Switch;