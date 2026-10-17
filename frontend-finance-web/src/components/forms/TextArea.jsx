import React, { forwardRef } from "react";

const TextArea = forwardRef(({
  label,
  error,
  rows = 3,
  className = "",
  containerClassName = "",
  ...props
}, ref) => {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="label" htmlFor={props.id || props.name}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full px-4 py-2.5 text-sm rounded-xl
          border border-gray-300 dark:border-gray-700
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-gray-100
          placeholder:text-gray-400 dark:placeholder:text-gray-600
          focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          outline-none transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-y
          ${error ? "border-danger focus:ring-danger/50 focus:border-danger" : ""}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger mt-1">{error}</p>
      )}
    </div>
  );
});

TextArea.displayName = "TextArea";

export default TextArea;