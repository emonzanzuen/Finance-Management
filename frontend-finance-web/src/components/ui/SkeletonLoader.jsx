import React from "react";

const CHART_BAR_HEIGHTS = [48, 76, 58, 92, 64, 82, 52, 70];

const SkeletonLoader = ({
  variant = "card",
  count = 1,
  className = "",
}) => {
  const variants = {
    card: (
      <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card dark:border-gray-800/90 dark:bg-gray-900 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <div className="h-3.5 w-28 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-7 w-36 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-3 w-20 rounded-md bg-gray-100 dark:bg-gray-800/70 animate-pulse" />
          </div>
          <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    ),
    table: (
      <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card dark:border-gray-800/90 dark:bg-gray-900 sm:p-6">
        <div className="space-y-3.5">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-3 dark:border-gray-800">
            <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="h-3.5 w-32 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            <div className="hidden h-3.5 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse sm:block" />
            <div className="ml-auto h-3.5 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-1">
              <div className="h-3.5 w-20 rounded bg-gray-100 dark:bg-gray-800/80 animate-pulse" />
              <div className="h-3.5 w-28 rounded bg-gray-100 dark:bg-gray-800/80 animate-pulse" />
              <div className="hidden h-3.5 w-36 rounded bg-gray-100 dark:bg-gray-800/80 animate-pulse sm:block" />
              <div className="ml-auto h-3.5 w-16 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ),
    chart: (
      <div className="rounded-2xl border border-gray-200/90 bg-white p-5 shadow-card dark:border-gray-800/90 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 h-5 w-40 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="flex h-48 items-end gap-2.5">
          {CHART_BAR_HEIGHTS.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-lg bg-gray-200 dark:bg-gray-800 animate-pulse"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    ),
  };

  const content = variants[variant] || variants.card;

  if (count > 1) {
    return (
      <div role="status" aria-live="polite" className={`space-y-4 ${className}`}>
        <span className="sr-only">Memuat konten...</span>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} aria-hidden="true">
            {content}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">Memuat konten...</span>
      <div aria-hidden="true">{content}</div>
    </div>
  );
};

export default SkeletonLoader;