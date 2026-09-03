"use client";
import { useCreateApprovalRequestMutation } from "@/redux/features/pos/approvalApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";


const RequestCancelModal = ({ isOpen, onClose, entityType, entityId, entityLabel }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [createApprovalRequest, { isLoading }] = useCreateApprovalRequestMutation();

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }

    try {
      await createApprovalRequest({
        entityType,
        entityId,
        reason,
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Cancellation request sent to admin for approval");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send request");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request Cancellation" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          Request to cancel <span className="font-semibold">{entityLabel}</span>. This will be sent to your Company Admin for review.
        </p>
        <Input
          id="reason"
          label="Reason"
          required
          placeholder="e.g. Customer changed mind"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError("");
          }}
          error={error}
        />
        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Send Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequestCancelModal;