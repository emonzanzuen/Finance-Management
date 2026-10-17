import React, { forwardRef } from "react";
import { Eye, EyeOff, X } from "lucide-react";

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  iconPosition = "left",
  type = "text",
  className = "",
  containerClassName = "",
  clearable = false,
  onClear = null,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputRef = React.useRef(null);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
      if (onClear) onClear();
      if (props.onChange) {
        const event = new Event("input", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    }
  };

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="label" htmlFor={props.id || props.name}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        )}
        
        <input
          ref={inputRef}
          type={inputType}
          className={`
            w-full px-4 py-2.5 text-sm rounded-xl
            border border-gray-300 dark:border-gray-700
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            outline-none transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon && iconPosition === "left" ? "pl-10" : ""}
            ${Icon && iconPosition === "right" ? "pr-10" : ""}
            ${clearable ? "pr-10" : ""}
            ${isPassword ? "pr-10" : ""}
            ${error ? "border-danger focus:ring-danger/50 focus:border-danger" : ""}
            ${className}
          `}
          {...props}
        />

        {clearable && props.value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {Icon && iconPosition === "right" && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;