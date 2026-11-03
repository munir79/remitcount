"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useGetAvailableDrawersQuery, useOpenCashierSessionMutation } from "@/redux/features/pos/cashierSessionApi";
import { formatMoney } from "@/lib/format";
import Modal from "../ui/Modal";
import Combobox from "../ui/Combobox";
import Button from "../ui/Button";
import SetupNotice from "../ui/SetupNotice";
import SummaryPanel from "../ui/SummaryPanel";
import CashCountInput, { CashDifference } from "./CashCountInput";
import CurrencyCountInputs, { missingCurrencyCount, toCurrencyCounts } from "./CurrencyCountInputs";

const FORM_ID = "open-session-form";

/**
 * ✅ Session খোলা — নিজের Branch এর খালি Drawer বাছুন, টাকা গুনে শুরু
 * গোনা ≠ System হলে: ছোট গরমিল নিজে থেকে সমন্বয়; সীমার বেশি হলে শুধু Manager খুলতে পারেন
 */
const OpenSessionModal = ({ isOpen, onClose }) => {
  const { data, isFetching } = useGetAvailableDrawersQuery(undefined, { skip: !isOpen, refetchOnMountOrArgChange: true });
  const [openCashierSession, { isLoading }] = useOpenCashierSessionMutation();

  const drawers = data?.data?.drawers || [];
  const limit = data?.data?.approvalLimit ?? 20;
  const canManage = Boolean(data?.data?.canManage);
  const freeDrawers = drawers.filter((d) => !d.busyBy);

  const [cashAccount, setCashAccount] = useState("");
  const [counted, setCounted] = useState("");
  const [currencyCounts, setCurrencyCounts] = useState({}); // Foreign Currency গোনা
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  // একটাই খালি Drawer থাকলে সেটাই
  const drawerId = cashAccount || (freeDrawers.length === 1 ? freeDrawers[0]._id : "");
  const drawer = drawers.find((d) => d._id === drawerId);

  const handleClose = () => {
    setCashAccount("");
    setCounted("");
    setCurrencyCounts({});
    setErrors({});
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!drawerId) next.cashAccount = "Choose your cash drawer";
    if (counted === "" || !(Number(counted) >= 0)) next.counted = "Count the cash in the drawer";
    const missing = drawer && missingCurrencyCount(drawer.holdings || [], currencyCounts);
    if (missing) next.currency = `Count the ${missing} in the drawer too`;
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      await openCashierSession({ cashAccount: drawerId, openingCountedCash: Number(counted), currencyCounts: toCurrencyCounts(currencyCounts), clientRequestId: requestId }).unwrap();
      toast.success(`Session opened on ${drawer?.name || "your drawer"}`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to open session");
      setRequestId(crypto.randomUUID());
    }
  };

  const options = drawers.map((d) => ({
    value: d._id,
    label: d.name,
    sub: d.busyBy
      ? `${d.busyBy.status === "PendingApproval" ? "Waiting for approval" : `In use by ${d.busyBy.name}`}`
      : [d.branch?.name, d.location, `System ${formatMoney(d.systemBalance)}`].filter(Boolean).join(" · "),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Open cashier session"
      description="Count the cash in your drawer before you start"
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isLoading} disabled={isFetching}>
            Open session
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
        <Combobox
          id="cashAccount"
          label="Cash drawer"
          required
          value={drawerId}
          onChange={(v) => {
            if (drawers.find((d) => d._id === v)?.busyBy) {
              toast.error("This drawer is already in use");
              return;
            }
            setCashAccount(v);
            setCurrencyCounts({}); // অন্য Drawer — অন্য Currency
            setErrors((p) => ({ ...p, cashAccount: "", currency: "" }));
          }}
          options={options}
          placeholder="Choose your drawer"
          emptyText="No cash drawers in your branch"
          error={errors.cashAccount}
        />

        {data && drawers.length === 0 && (
          <SetupNotice
            message="No cash drawer is set up for your branch yet. Add one for each counter."
            actionLabel="Add cash drawer"
            href="/bank-account"
            permission="bankAccount:create"
            adminHint="Ask your admin to add one."
            onNavigate={handleClose}
          />
        )}

        {drawer && (
          <>
            <CashCountInput
              key={drawer._id}
              id="openingCount"
              label="Cash in the drawer now"
              value={counted}
              onChange={(v) => {
                setCounted(v);
                setErrors((p) => ({ ...p, counted: "" }));
              }}
              error={errors.counted}
            />
            <SummaryPanel
              rows={[
                { label: "System expects", value: formatMoney(drawer.systemBalance) },
                { label: "You counted", value: counted === "" ? "—" : formatMoney(Number(counted)), muted: counted === "" },
              ]}
            />
            <CashDifference counted={counted} system={drawer.systemBalance} limit={limit} canManage={canManage} action="open" />
            <CurrencyCountInputs
              key={`fx-${drawer._id}`}
              holdings={drawer.holdings || []}
              counts={currencyCounts}
              onChange={(next) => {
                setCurrencyCounts(next);
                setErrors((p) => ({ ...p, currency: "" }));
              }}
              error={errors.currency}
            />
          </>
        )}
      </form>
    </Modal>
  );
};

export default OpenSessionModal;
