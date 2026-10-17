import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(({
  label,
  error,
  options = [],
  placeholder = "Pilih...",
  className = "",
  containerClassName = "",
  icon: Icon = null,
  ...props
}, ref) => {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="label" htmlFor={props.id || props.name}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 text-sm rounded-xl
            border border-gray-300 dark:border-gray-700
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            appearance-none
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            outline-none transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? "pl-10" : ""}
            pr-10
            ${error ? "border-danger focus:ring-danger/50 focus:border-danger" : ""}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
      {error && (
        <p className="text-xs text-danger mt-1">{error}</p>
      )}
    </div>
  );
});

Select.displayName = "Select";

export default Select;