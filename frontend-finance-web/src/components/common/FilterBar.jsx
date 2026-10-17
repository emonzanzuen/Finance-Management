import React from "react";
import { Search, Filter, X } from "lucide-react";

const FilterBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClearFilters,
  className = "",
}) => {
  const hasActiveFilters = Object.values(activeFilters).some(
    (val) => val !== "" && val !== undefined && val !== null
  );

  return (
    <div className={`flex flex-col md:flex-row gap-3 ${className}`}>
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-field pl-10"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={activeFilters[filter.key] || ""}
          onChange={(e) => onFilterChange(filter.key, e.target.value)}
          className="input-field w-full md:w-40"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Filter className="w-4 h-4 inline mr-1" />
          Reset
        </button>
      )}
    </div>
  );
};

export default FilterBar;