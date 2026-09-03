"use client";

import Button from "./Button";
import Modal from "./Modal";


const ConfirmDialog = ({ isOpen, onClose, onConfirm, isLoading, title, description, variant = "danger" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-slate-700">{description}</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" variant={variant} onClick={onConfirm} isLoading={isLoading}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;