import React from "react";
import { AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  loading = false,
  danger = true,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={loading ? () => {} : onClose}
    title={title}
    size="sm"
    footer={
      <div className="flex justify-end gap-2.5">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={danger ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    }
  >
    <div className="flex items-start gap-3.5">
      {danger && (
        <div
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
          aria-hidden="true"
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
      )}
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {message}
      </p>
    </div>
  </Modal>
);

export default ConfirmDialog;