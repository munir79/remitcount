"use client";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  description,
  variant = "danger",
  confirmLabel = "Confirm",
}) => {
  const isDanger = variant === "danger";
  const Icon = isDanger ? AlertTriangle : CheckCircle2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" variant={variant} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isDanger ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="pt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
