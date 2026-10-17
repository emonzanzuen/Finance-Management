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
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="relative inline-block">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg">
          <Plus className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {actionText && onAction && (
          <button onClick={onAction} className="btn btn-primary">
            <Plus className="w-4 h-4" /> {actionText}
          </button>
        )}
        {secondaryActionText && onSecondaryAction && (
          <button onClick={onSecondaryAction} className="btn btn-secondary">
            <RefreshCw className="w-4 h-4" /> {secondaryActionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;