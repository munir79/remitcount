"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCloseCashierSessionMutation, useGetSessionSummaryQuery } from "@/redux/features/pos/cashierSessionApi";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import PageLoader from "../ui/PageLoader";
import CashCountInput, { CashDifference } from "./CashCountInput";
import SessionReport from "./SessionReport";
import CurrencyCountInputs, { missingCurrencyCount, toCurrencyCounts } from "./CurrencyCountInputs";

const FORM_ID = "close-session-form";

/**
 * ✅ Session বন্ধ — Cashier না দেখে গোনেন; Manager / Admin Report আর গরমিল দেখে গোনেন
 * গরমিল সীমার মধ্যে → নিজে থেকে "Cash Over/Short" এ; বেশি হলে Manager এর অনুমোদনের অপেক্ষায়
 * বন্ধের পরে Report Page খোলে (Print)
 */
const CloseSessionModal = ({ isOpen, onClose, session }) => {
  const router = useRouter();
  const { data, isFetching } = useGetSessionSummaryQuery(session?._id, { skip: !isOpen || !session?._id, refetchOnMountOrArgChange: true });
  const [closeCashierSession, { isLoading }] = useCloseCashierSessionMutation();
  const [counted, setCounted] = useState("");
  const [currencyCounts, setCurrencyCounts] = useState({}); // Foreign Currency গোনা
  const [error, setError] = useState("");
  const [currencyError, setCurrencyError] = useState("");

  const summary = data?.data;
  const limit = summary?.approvalLimit ?? 20;
  const canManage = Boolean(summary?.canManage);
  const blind = Boolean(summary?.blind);

  const handleClose = () => {
    setCounted("");
    setCurrencyCounts({});
    setError("");
    setCurrencyError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (counted === "" || !(Number(counted) >= 0)) {
      setError("Count the cash in the drawer");
      return;
    }
    const missing = missingCurrencyCount(summary?.holdings || [], currencyCounts);
    if (missing) {
      setCurrencyError(`Count the ${missing} in the drawer too`);
      return;
    }
    try {
      const res = await closeCashierSession({ id: session._id, data: { closingPhysicalCash: Number(counted), currencyCounts: toCurrencyCounts(currencyCounts) } }).unwrap();
      const closed = res.data;
      toast.success(closed.status === "PendingApproval" ? "Sent to your manager for approval" : "Session closed");
      handleClose();
      router.push(`/pos/cash/session/${closed._id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to close session");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Close cashier session"
      description={session?.cashAccount?.name ? `End-of-shift count for ${session.cashAccount.name}` : "End-of-shift cash count"}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} variant="danger" isLoading={isLoading} disabled={isFetching || !summary}>
            Close session
          </Button>
        </>
      }
    >
      {!summary ? (
        <PageLoader className="h-48" />
      ) : (
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
          {blind ? (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">Count everything in the drawer and enter what you find. You will see the result after you close.</p>
          ) : (
            <SessionReport summary={summary} counted={counted} />
          )}
          <CashCountInput
            id="closingCount"
            label="Cash in the drawer now"
            value={counted}
            onChange={(v) => {
              setCounted(v);
              setError("");
            }}
            error={error}
          />
          {!blind && <CashDifference counted={counted} system={summary.expected} limit={limit} canManage={canManage} action="close" />}
          <CurrencyCountInputs
            blind={blind}
            holdings={summary.holdings || []}
            counts={currencyCounts}
            onChange={(next) => {
              setCurrencyCounts(next);
              setCurrencyError("");
            }}
            error={currencyError}
          />
        </form>
      )}
    </Modal>
  );
};

export default CloseSessionModal;
