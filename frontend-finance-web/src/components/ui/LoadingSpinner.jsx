import React from "react";

const LoadingSpinner = ({ 
  size = "md", 
  fullScreen = false, 
  message = "Memuat data...",
  className = "" 
}) => {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-14 h-14 border-4",
    xl: "w-20 h-20 border-4",
  };

  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        <div className={`${sizes[size]} border-primary-500 border-t-transparent rounded-full animate-spin`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
        </div>
      </div>
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;