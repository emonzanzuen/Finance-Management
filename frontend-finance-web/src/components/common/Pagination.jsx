import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, total, limit, onPageChange, labels }) => {
  if (!total) return null;

  const safeTotalPages = Math.max(totalPages || 1, 1);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const btnCls =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/90 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800/80 dark:text-gray-400 sm:flex-row"
    >
      <span className="tabular-nums-finance text-xs sm:text-sm">
        {labels.showing
          .replace("{from}", from)
          .replace("{to}", to)
          .replace("{total}", total)}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btnCls}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={labels.prev}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <span className="tabular-nums-finance min-w-[92px] text-center text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
          {labels.pageOf
            .replace("{page}", page)
            .replace("{pages}", safeTotalPages)}
        </span>

        <button
          type="button"
          className={btnCls}
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={labels.next}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;