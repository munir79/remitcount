"use client";
import Modal from "./Modal";
import Button from "./Button";

const ConfirmDialog = ({ isOpen, onClose, onConfirm, isLoading, title, description, variant = "danger" }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-neutral-600">{description}</p>
      <div className="mt-5 flex justify-end gap-2.5">
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