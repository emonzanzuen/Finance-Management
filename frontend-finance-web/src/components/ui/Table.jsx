import React, { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const Table = ({
  columns,
  data,
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

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className={`
        w-full text-sm
        ${bordered ? "border border-gray-200 dark:border-gray-800" : ""}
        ${compact ? "text-xs" : ""}
      `}>
        <thead>
          <tr className={`
            border-b border-gray-200 dark:border-gray-800
            ${bordered ? "bg-gray-50 dark:bg-gray-900" : ""}
          `}>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                className={`
                  text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                  py-3 px-4
                  ${col.sortable && sortable ? "cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" : ""}
                  ${col.width ? `w-${col.width}` : ""}
                  ${col.align === "right" ? "text-right" : ""}
                  ${col.align === "center" ? "text-center" : ""}
                `}
                onClick={() => col.sortable && handleSort(col.key)}
                style={{ width: col.width }}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortable && getSortIcon(col.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={`
                border-b border-gray-100 dark:border-gray-800
                ${striped && rowIndex % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-900/50" : ""}
                ${hover ? "hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors" : ""}
                ${onRowClick ? "cursor-pointer" : ""}
              `}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, colIndex) => (
                <td
                  key={col.key || colIndex}
                  className={`
                    py-3 px-4 text-gray-600 dark:text-gray-400
                    ${col.align === "right" ? "text-right" : ""}
                    ${col.align === "center" ? "text-center" : ""}
                    ${compact ? "py-2 px-3" : ""}
                  `}
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