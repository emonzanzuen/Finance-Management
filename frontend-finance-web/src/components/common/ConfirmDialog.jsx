import React from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, loading = false, danger = true }) => (
  <Modal
    isOpen={isOpen}
    onClose={loading ? () => {} : onClose}
    title={title}
    size="sm"
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>{cancelText}</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmText}</Button>
      </div>
    }
  >
    <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
  </Modal>
);

export default ConfirmDialog;
