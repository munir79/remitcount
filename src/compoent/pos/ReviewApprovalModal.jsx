"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { useReviewApprovalRequestMutation } from "@/redux/features/pos/approvalApi";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";


const ReviewApprovalModal = ({ isOpen, onClose, request }) => {
  const [reviewNote, setReviewNote] = useState("");
  const [reviewApprovalRequest, { isLoading }] = useReviewApprovalRequestMutation();

  const handleClose = () => {
    setReviewNote("");
    onClose();
  };

  const handleDecision = async (decision) => {
    try {
      await reviewApprovalRequest({ id: request._id, decision, reviewNote }).unwrap();
      toast.success(`Request ${decision.toLowerCase()} successfully`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to review request");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Review Cancellation Request">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <p className="text-slate-700">
            <span className="font-semibold">{request?.requestedBy?.name}</span> requested to cancel{" "}
            <span className="font-semibold">{request?.entityType}</span>
          </p>
          <p className="mt-1 text-slate-600">Reason: {request?.reason}</p>
        </div>

        <Input id="reviewNote" label="Review Note (Optional)" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={() => handleDecision("Rejected")} isLoading={isLoading}>
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button type="button" variant="success" onClick={() => handleDecision("Approved")} isLoading={isLoading}>
            <Check className="h-4 w-4" />
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReviewApprovalModal;