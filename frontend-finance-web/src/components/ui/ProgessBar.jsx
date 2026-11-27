import React from "react";

const ProgressBar = ({
  value = 0,
  max = 100,
  label = null,
  showPercentage = true,
  size = "md",
  color = "primary",
  animated = true,
  className = "",
}) => {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const percentage = Math.min(Math.max((safeValue / safeMax) * 100, 0), 100);

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
        <div className="mb-1.5 flex items-center justify-between gap-2">
          {label && (
            <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="tabular-nums-finance ml-auto flex-shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-400">
              {percentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label || "Progress"}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(safeValue)}
        className={`w-full overflow-hidden rounded-full bg-gray-200/90 dark:bg-gray-800 ${
          sizes[size] || sizes.md
        }`}
      >
        <div
          className={`${getColor()} h-full rounded-full transition-[width] duration-500 ease-out ${
            animated ? "motion-safe:transition-all" : ""
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;