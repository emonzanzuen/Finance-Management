import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ page, totalPages, total, limit, onPageChange, labels }) => {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const btn =
    "p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-sm text-gray-500 dark:text-gray-400">
      <span>{labels.showing.replace("{from}", from).replace("{to}", to).replace("{total}", total)}</span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={labels.prev}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span>{labels.pageOf.replace("{page}", page).replace("{pages}", Math.max(totalPages, 1))}</span>
        <button className={btn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label={labels.next}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
