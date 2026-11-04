"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { handleEnterToNext } from "@/hooks/useEnterToNext";
import { formatMoney } from "@/lib/format";
import { singleOptionDefault } from "@/lib/options";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Combobox from "../ui/Combobox";
import SegmentedControl from "../ui/SegmentedControl";
import SummaryPanel from "../ui/SummaryPanel";
import FormModalFooter from "../ui/FormModalFooter";
import SetupNotice from "../ui/SetupNotice";

/**
 * ✅ Payment In ও Payment Out একই Form — কোন Record এর Due কতটা Settle হচ্ছে
 *
 * useSources(entityType, isOpen) → [{ value, label, sub, due }]
 *   — প্রতিটা Page নিজের Hook দেয় (কোন API থেকে Due Record আনবে)
 * accountField — Backend এ কোন নামে Account যাবে ("depositAccount" / "paymentAccount")
 * settleInFullFor — এই entityType এ Admin "Settle in full" পান (Supplier অন্য অঙ্ক চাইলে পার্থক্য লাভে সমন্বয়)
 */
const SettlementFormModal = ({
  isOpen,
  onClose,
  formId,
  title,
  description,
  entityTypes,
  useSources,
  useCreateMutation,
  accountField,
  accountLabel,
  partyLabel,
  successMessage,
  settleInFullFor,
  onSwitchMode, // থাকলে "নাম ধরে" Form এ ফিরে যাওয়ার Link
}) => {
  const { hasPermission } = useAuth();
  const [entityType, setEntityType] = useState(entityTypes[0].value);
  const [entityId, setEntityId] = useState("");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [settleInFull, setSettleInFull] = useState(false);
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const sources = useSources(entityType, isOpen);
  const { data: accountData } = useGetAllBankAccountsQuery({ limit: 100 }, { skip: !isOpen });
  const { data: sessionData } = useGetMyOpenSessionQuery(undefined, { skip: !isOpen });
  const [createPayment, { isLoading }] = useCreateMutation();

  // ✅ টাকা আসে / যায় শুধু Cash Drawer বা Bank দিয়ে (Server ও তাই মানে)
  // Cashier — নিজের খোলা Drawer + Bank; Manager — সব Drawer
  const canUseAnyDrawer = hasPermission("cashierSession:manage");
  const mySession = sessionData?.data;
  const myDrawerId = mySession?.status === "Open" ? mySession?.cashAccount?._id || mySession?.cashAccount : "";
  const accountOptions = (accountData?.data?.data || [])
    .filter((b) => b.account && b.status !== "inactive")
    .filter((b) => b.accountType === "Bank" || canUseAnyDrawer || b.account._id === myDrawerId)
    .map((b) => ({
      value: b.account._id,
      label: b.account.name,
      sub: [b.accountType === "Cash" ? "Cash drawer" : "Bank", b.branch?.name].filter(Boolean).join(" · "),
    }));
  const effectiveAccount = singleOptionDefault(account, accountOptions);

  const selected = sources.find((s) => s.value === entityId);
  const due = Number(selected?.due || 0);
  const payAmount = Number(amount) || 0;
  // Settle in full — শুধু Admin (লাভ বদলায়); তখন Amount Due এর চেয়ে বেশি/কম হতে পারে, পার্থক্য লাভে যায়
  const canSettleInFull = Boolean(settleInFullFor) && entityType === settleInFullFor && hasPermission("rate:update");
  const isSettling = canSettleInFull && settleInFull;
  const difference = Math.round((payAmount - due) * 100) / 100;
  const differencePercent = due > 0 ? Math.abs(difference / due) * 100 : 0;
  const remaining = isSettling ? 0 : Math.max(0, due - payAmount);

  const clearError = (name) => setErrors((prev) => ({ ...prev, [name]: "" }));

  const handleClose = () => {
    setEntityType(entityTypes[0].value);
    setEntityId("");
    setAmount("");
    setAccount("");
    setSettleInFull(false);
    setErrors({});
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!entityId) newErrors.entityId = "Select a record";
    if (payAmount <= 0) newErrors.amount = "Enter an amount";
    if (selected && payAmount > due && !isSettling) newErrors.amount = `Cannot exceed the due of ${formatMoney(due)}`;
    if (!effectiveAccount) newErrors.account = "Select an account";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createPayment({
        entityType,
        entityId,
        amount: payAmount,
        ...(isSettling ? { settleInFull: true } : {}),
        [accountField]: effectiveAccount,
        clientRequestId: requestId,
      }).unwrap();
      toast.success(successMessage);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create payment");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
      size="lg"
      footer={<FormModalFooter formId={formId} onCancel={handleClose} isLoading={isLoading} />}
    >
      <form id={formId} onSubmit={handleSubmit} onKeyDown={handleEnterToNext} noValidate className="space-y-4">
        <SegmentedControl
          label="Against"
          value={entityType}
          onChange={(v) => {
            setEntityType(v);
            setEntityId("");
            setAmount("");
            setSettleInFull(false);
          }}
          options={entityTypes}
        />

        <Combobox
          id={`${formId}-record`}
          label={`${partyLabel} record`}
          required
          value={entityId}
          onChange={(v) => {
            setEntityId(v);
            const next = sources.find((s) => s.value === v);
            if (next) setAmount(String(next.due)); // Default — পুরো Due
            clearError("entityId");
            clearError("amount");
          }}
          options={sources}
          placeholder="Select a record with a due balance"
          searchPlaceholder="Search number or name…"
          emptyText="No records with a due balance"
          error={errors.entityId}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={`${formId}-amount`}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            label="Amount"
            required
            prefix="RM"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              clearError("amount");
            }}
            error={errors.amount}
            hint={selected ? (isSettling ? `Due ${formatMoney(due)} · enter the exact amount the supplier took` : `Due ${formatMoney(due)} · partial payment allowed`) : undefined}
          />
          <Combobox
            id={`${formId}-account`}
            label={accountLabel}
            required
            value={effectiveAccount}
            onChange={(v) => {
              setAccount(v);
              clearError("account");
            }}
            options={accountOptions}
            placeholder="Cash drawer or bank"
            error={errors.account}
            hint={
              accountData && accountOptions.length === 0 ? (
                (accountData?.data?.data || []).some((b) => b.accountType === "Cash") && !myDrawerId ? (
                  // Drawer আছে, কিন্তু Cashier এর Session খোলা নেই
                  <span className="text-amber-700">Open your cash session first to use your drawer.</span>
                ) : (
                  <SetupNotice compact message="No cash or bank account yet." actionLabel="Add cash / bank" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin." onNavigate={handleClose} />
                )
              ) : !canUseAnyDrawer && !myDrawerId ? (
                "Bank only — open your cash session to take cash"
              ) : undefined
            }
          />
        </div>

        {canSettleInFull && selected && (
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settleInFull}
              onChange={(e) => {
                setSettleInFull(e.target.checked);
                clearError("amount");
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <span className="font-medium text-slate-900">Supplier asked a different amount — settle in full</span>
              <span className="block text-xs text-slate-500">This send will be fully paid. The difference is added to or taken from this send&apos;s profit.</span>
            </span>
          </label>
        )}

        {isSettling && payAmount > 0 && differencePercent > 5 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Check the amount — it is {differencePercent.toFixed(1)}% {difference > 0 ? "more" : "less"} than the due.
          </p>
        )}

        {onSwitchMode && (
          <button type="button" onClick={onSwitchMode} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-800">
            Pay by name instead
          </button>
        )}

        {selected && (
          <SummaryPanel
            rows={[
              { label: "Due before", value: formatMoney(due) },
              { label: "This payment", value: `− ${formatMoney(payAmount)}` },
              isSettling && difference > 0 && { label: "Supplier took more — profit", value: `− ${formatMoney(difference)}`, tone: "negative" },
              isSettling && difference < 0 && { label: "Supplier took less — profit", value: `+ ${formatMoney(-difference)}`, tone: "positive" },
              {
                label: remaining === 0 ? "Fully settled" : "Remaining due",
                value: formatMoney(remaining),
                emphasis: true,
                tone: remaining === 0 ? "positive" : undefined,
              },
            ]}
          />
        )}
      </form>
    </Modal>
  );
};

export default SettlementFormModal;
