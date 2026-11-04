"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useStartCashierSessionMutation } from "@/redux/features/pos/cashierSessionApi";
import { formatDateTime } from "@/lib/format";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import CashCountInput from "./CashCountInput";
import CurrencyCountInputs, { missingCurrencyCount, toCurrencyCounts } from "./CurrencyCountInputs";

const FORM_ID = "start-session-form";

/**
 * ✅ Session শুরু — Manager যে Drawer দিলেন, না দেখে গুনে বুঝে নেওয়া
 * কত থাকার কথা এখানে দেখানো হয় না; মিললে Session শুরু, না মিললে Manager কে ডাকতে হয়
 */
const StartSessionModal = ({ isOpen, onClose, assignment }) => {
  const [startSession, { isLoading }] = useStartCashierSessionMutation();
  const [counted, setCounted] = useState("");
  const [currencyCounts, setCurrencyCounts] = useState({}); // Foreign Currency গোনা
  const [errors, setErrors] = useState({});

  const currencies = assignment?.currencies || [];
  const triesLeft = assignment?.triesLeft ?? 0;

  const handleClose = () => {
    setCounted("");
    setCurrencyCounts({});
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (counted === "" || !(Number(counted) >= 0)) next.counted = "Count the cash in the drawer";
    const missing = missingCurrencyCount(currencies, currencyCounts);
    if (missing) next.currency = `Count the ${missing} in the drawer too`;
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      await startSession({ assignmentId: assignment._id, openingCountedCash: Number(counted), currencyCounts: toCurrencyCounts(currencyCounts) }).unwrap();
      toast.success(`Session started on ${assignment.drawerName}`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to start session");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Count ${assignment?.drawerName || "your drawer"}`}
      description={assignment ? `Assigned by ${assignment.assignedBy} · ${formatDateTime(assignment.assignedAt)}` : ""}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isLoading} disabled={triesLeft === 0}>
            Start session
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Count everything in the drawer, including any money just given to you. The session starts only if your count matches.
        </p>
        <CashCountInput
          id="startCount"
          label="Cash in the drawer now"
          value={counted}
          onChange={(v) => {
            setCounted(v);
            setErrors((p) => ({ ...p, counted: "" }));
          }}
          error={errors.counted}
        />
        <CurrencyCountInputs
          blind
          allowExtra={false}
          holdings={currencies}
          counts={currencyCounts}
          onChange={(next) => {
            setCurrencyCounts(next);
            setErrors((p) => ({ ...p, currency: "" }));
          }}
          error={errors.currency}
        />
        <p className={`text-xs ${triesLeft <= 1 ? "font-medium text-rose-600" : "text-slate-500"}`}>
          {triesLeft === 0 ? "No tries left. Call your manager — the drawer must be assigned again." : `${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left. Every count is recorded.`}
        </p>
      </form>
    </Modal>
  );
};

export default StartSessionModal;
