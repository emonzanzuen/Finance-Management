import React from "react";

const SkeletonLoader = ({ 
  variant = "card", 
  count = 1,
  className = "" 
}) => {
  const variants = {
    card: (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    ),
    table: (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    ),
    chart: (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 p-5 shadow-sm">
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
        <div className="flex items-end gap-2 h-48">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
              style={{ height: `${Math.random() * 100 + 20}%` }}
            />
          ))}
        </div>
      </div>
    ),
  };

  if (count > 1) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{variants[variant] || variants.card}</div>
        ))}
      </div>
    );
  }

  return <div className={className}>{variants[variant] || variants.card}</div>;
};

export default SkeletonLoader;