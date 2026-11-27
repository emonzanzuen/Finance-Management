import React from "react";

const LoadingSpinner = ({
  size = "md",
  fullScreen = false,
  message = "Memuat data...",
  className = "",
}) => {
  const sizes = {
    sm: "h-5 w-5 border-2",
    md: "h-10 w-10 border-[3px]",
    lg: "h-14 w-14 border-4",
    xl: "h-20 w-20 border-4",
  };

  const spinner = (
    <div
      role="status"
      aria-live="polite"
      aria-label={!message ? "Memuat" : undefined}
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="relative" aria-hidden="true">
        <div
          className={`${sizes[size] || sizes.md} rounded-full border-primary-500 border-t-transparent animate-spin`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
        </div>
      </div>
      {message && (
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;