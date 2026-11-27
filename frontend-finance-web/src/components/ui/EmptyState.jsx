import React from "react";
import { Inbox, Plus, RefreshCw } from "lucide-react";

const EmptyState = ({
  icon: Icon = Inbox,
  title = "Belum ada data",
  description = "Mulai tambahkan data pertama Anda",
  actionText = null,
  onAction = null,
  secondaryActionText = null,
  onSecondaryAction = null,
  className = "",
}) => {
  return (
    <div className={`px-4 py-12 text-center ${className}`}>
      <div className="relative mx-auto mb-4 inline-flex">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200/80 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/60">
          <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        </div>
        {actionText && onAction && (
          <div
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 shadow-sm ring-2 ring-white dark:bg-primary-500 dark:ring-gray-900"
          >
            <Plus className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>

      <h3 className="mb-1.5 text-base font-semibold tracking-tight text-gray-900 dark:text-white sm:text-lg">
        {title}
      </h3>
      <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          {actionText && onAction && (
            <button type="button" onClick={onAction} className="btn btn-primary w-full sm:w-auto">
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{actionText}</span>
            </button>
          )}
          {secondaryActionText && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="btn btn-secondary w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>{secondaryActionText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;