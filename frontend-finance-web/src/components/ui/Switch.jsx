import React, { useId } from "react";

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
  const labelId = useId();
  const descId = useId();

  const sizes = {
    sm: {
      container: "h-4 w-8",
      thumb: "h-3 w-3",
      translate: "translate-x-4",
    },
    md: {
      container: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
    },
    lg: {
      container: "h-7 w-14",
      thumb: "h-6 w-6",
      translate: "translate-x-7",
    },
  };

  const activeSize = sizes[size] || sizes.md;

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-start gap-3.5 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={description ? descId : undefined}
        onClick={handleToggle}
        disabled={disabled}
        className={`relative mt-0.5 inline-flex flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 ${
          activeSize.container
        } ${
          checked ? "bg-primary-600 dark:bg-primary-500" : "bg-gray-300 dark:bg-gray-700"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-0.5 top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
            activeSize.thumb
          } ${checked ? activeSize.translate : "translate-x-0"}`}
        />
      </button>

      {(label || description) && (
        <div
          className={`${disabled ? "opacity-50" : "cursor-pointer"} ${labelClassName}`}
          onClick={handleToggle}
        >
          {label && (
            <span
              id={labelId}
              className="block text-sm font-medium leading-snug text-gray-900 dark:text-white"
            >
              {label}
            </span>
          )}
          {description && (
            <p
              id={descId}
              className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Switch;