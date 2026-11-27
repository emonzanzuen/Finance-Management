import React from "react";
import { AlertTriangle } from "lucide-react";
import Button from "../ui/Button";

const ErrorState = ({ message, onRetry, retryText }) => (
  <div className="text-center py-12 px-4" role="alert">
    <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
      <AlertTriangle className="w-8 h-8 text-red-500" />
    </div>
    <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
    {onRetry && <Button variant="outline" onClick={onRetry}>{retryText}</Button>}
  </div>
);

export default ErrorState;
