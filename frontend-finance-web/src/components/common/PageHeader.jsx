import React from "react";

const PageHeader = ({
  title,
  subtitle,
  actions = null,
  icon: Icon = null,
  className = "",
}) => {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950">
            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;