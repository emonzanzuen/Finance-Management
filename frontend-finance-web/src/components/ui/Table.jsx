import React, { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

const Table = ({
  columns = [],
  data = [],
  onRowClick = null,
  className = "",
  striped = true,
  hover = true,
  bordered = false,
  compact = false,
  sortable = false,
  onSort = null,
  emptyMessage = "Tidak ada data",
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const handleSort = (key) => {
    if (!sortable || !onSort) return;

    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    setSortConfig({ key, direction });
    onSort(key, direction);
  };

  const getAriaSort = (col) => {
    if (!col.sortable || !sortable) return undefined;
    if (sortConfig.key !== col.key) return "none";
    return sortConfig.direction === "asc" ? "ascending" : "descending";
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <ChevronsUpDown
          className="h-3.5 w-3.5 flex-shrink-0 opacity-45"
          aria-hidden="true"
        />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-3.5 w-3.5 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-primary-600 dark:text-primary-400" aria-hidden="true" />
    );
  };

  const handleRowKeyDown = (e, row) => {
    if (!onRowClick || e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick(row);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-gray-200/90 dark:border-gray-800/90 ${className}`}
    >
      <table
        className={`w-full border-collapse ${compact ? "text-xs" : "text-sm"}`}
      >
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/50">
            {columns.map((col, index) => {
              const isColSortable = Boolean(col.sortable && sortable);
              const alignFlex =
                col.align === "right"
                  ? "justify-end"
                  : col.align === "center"
                  ? "justify-center"
                  : "justify-start";

              return (
                <th
                  key={col.key || index}
                  scope="col"
                  aria-sort={getAriaSort(col)}
                  style={col.width ? { width: col.width } : undefined}
                  className={`whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${
                    compact ? "px-3 py-2.5" : "px-4 py-3"
                  } ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${
                    bordered
                      ? "border-r border-gray-200/80 last:border-r-0 dark:border-gray-800/80"
                      : ""
                  }`}
                >
                  {isColSortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex w-full items-center gap-1 rounded-md uppercase tracking-wider transition-colors hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:text-gray-100 ${alignFlex}`}
                    >
                      <span>{col.label}</span>
                      {getSortIcon(col.key)}
                    </button>
                  ) : (
                    <span className={`inline-flex w-full items-center gap-1 ${alignFlex}`}>
                      {col.label}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800/80 dark:bg-gray-900">
          {data.map((row, rowIndex) => (
            <tr
              key={row.id ?? rowIndex}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => handleRowKeyDown(e, row) : undefined}
              className={`transition-colors ${
                striped && rowIndex % 2 === 1
                  ? "bg-gray-50/50 dark:bg-gray-800/25"
                  : ""
              } ${
                hover
                  ? "hover:bg-gray-50/90 dark:hover:bg-gray-800/50"
                  : ""
              } ${
                onRowClick
                  ? "cursor-pointer focus:outline-none focus-visible:bg-primary-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 dark:focus-visible:bg-primary-950/40"
                  : ""
              }`}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={col.key || colIndex}
                  className={`align-middle text-gray-700 dark:text-gray-200 ${
                    compact ? "px-3 py-2" : "px-4 py-3.5"
                  } ${
                    col.align === "right"
                      ? "tabular-nums-finance text-right"
                      : col.align === "center"
                      ? "text-center"
                      : "text-left"
                  } ${
                    bordered
                      ? "border-r border-gray-100 last:border-r-0 dark:border-gray-800/80"
                      : ""
                  }`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;