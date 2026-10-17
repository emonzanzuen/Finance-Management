import React from "react";

const ProgressBar = ({
  value,
  max = 100,
  label = null,
  showPercentage = true,
  size = "md",
  color = "primary",
  animated = true,
  className = "",
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
    xl: "h-4",
  };

  const colors = {
    primary: "bg-primary-500",
    success: "bg-success",
    danger: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
    gradient: "bg-gradient-to-r from-primary-500 to-purple-500",
  };

  const getColor = () => {
    if (color === "auto") {
      if (percentage >= 90) return colors.danger;
      if (percentage >= 70) return colors.warning;
      return colors.success;
    }
    return colors[color] || colors.primary;
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${getColor()} rounded-full transition-all duration-700 ease-out ${animated ? "animate-pulse" : ""}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;