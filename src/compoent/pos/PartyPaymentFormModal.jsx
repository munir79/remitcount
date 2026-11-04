"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Receipt, SlidersHorizontal, Truck, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetAllCustomersQuery } from "@/redux/features/customer/customerApi";
import { useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { useGetAllVendorsQuery } from "@/redux/features/vendor/vendorApi";
import { formatDate, formatMoney } from "@/lib/format";
import { singleOptionDefault, toPartyOptions } from "@/lib/options";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Combobox from "../ui/Combobox";
import SegmentedControl from "../ui/SegmentedControl";
import SummaryPanel from "../ui/SummaryPanel";
import SetupNotice from "../ui/SetupNotice";
import PageLoader from "../ui/PageLoader";

const PARTY_TYPES = [
  { value: "Customer", label: "Customer", icon: UserRound },
  { value: "Vendor", label: "Supplier", icon: Truck },
];

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const keyOf = (i) => `${i.entityType}:${i.entityId || ""}`;

/** পুরনোটা আগে — Server ও একই নিয়মে ভাগ করে */
const splitFifo = (items, amount) => {
  const split = {};
  let left = r2(amount);
  for (const item of items) {
    if (left <= 0) break;
    const take = r2(Math.min(left, item.due));
    split[keyOf(item)] = take;
    left = r2(left - take);
  }
  return split;
};

/**
 * ✅ "নাম ধরে" Payment In / Out — Customer / Supplier বাছলে তার সব বাকি (পুরনোটা আগে), টাকা লিখলে নিজে ভাগ হয়;
 * চাইলে হাতে ভাগ বদলানো যায়। মোট বাকির বেশি নেওয়া যায় না।
 *
 * useDuesQuery — এই দিকের খোলা বাকির API; accountField — "depositAccount" / "paymentAccount"
 * receiptPath(id) — Confirm এর পর কোন Page; approvePermission — এটা না থাকলে Draft হয়ে Admin এর Post এর অপেক্ষায় থাকে
 */
const PartyPaymentFormModal = ({
  isOpen,
  onClose,
  formId,
  title,
  description,
  defaultPartyType,
  useDuesQuery,
  useCreateMutation,
  accountField,
  accountLabel,
  dueLabel,
  approvePermission,
  receiptPath,
  onSwitchMode,
}) => {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canPost = hasPermission(approvePermission);
  const canUseAnyDrawer = hasPermission("cashierSession:manage");

  const [partyType, setPartyType] = useState(defaultPartyType);
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [manual, setManual] = useState(null); // হাতে ভাগ — { key: "টাকা" }; null = পুরনোটা আগে
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [submitMode, setSubmitMode] = useState("post");

  const skip = { skip: !isOpen };
  const { data: customerData } = useGetAllCustomersQuery({ limit: 500 }, { skip: !isOpen || partyType !== "Customer" });
  const { data: vendorData } = useGetAllVendorsQuery({ limit: 200 }, { skip: !isOpen || partyType !== "Vendor" });
  const { data: bankData } = useGetAllBankAccountsQuery({ limit: 100 }, skip);
  const { data: sessionData } = useGetMyOpenSessionQuery(undefined, skip);
  const { data: duesData, isFetching: isLoadingDues } = useDuesQuery({ partyType, party }, { skip: !isOpen || !party, refetchOnMountOrArgChange: true });
  const [createPayment, { isLoading }] = useCreateMutation();

  const parties = (partyType === "Customer" ? customerData : vendorData)?.data?.data || [];
  const dues = party ? duesData?.data : null;
  const items = dues?.items || [];
  const totalDue = dues?.total || 0;

  // ✅ টাকা আসে / যায় শুধু Cash Drawer বা Bank দিয়ে; Cashier — নিজের খোলা Drawer + Bank; Manager — সব Drawer
  const mySession = sessionData?.data;
  const myDrawerId = mySession?.status === "Open" ? mySession?.cashAccount?._id || mySession?.cashAccount : "";
  const accountOptions = (bankData?.data?.data || [])
    .filter((b) => b.account && b.status !== "inactive")
    .filter((b) => b.accountType === "Bank" || canUseAnyDrawer || b.account._id === myDrawerId)
    .map((b) => ({
      value: b.account._id,
      label: b.account.name,
      sub: [b.accountType === "Cash" ? "Cash drawer" : "Bank", b.branch?.name].filter(Boolean).join(" · "),
    }));
  const effectiveAccount = account || myDrawerId || singleOptionDefault("", accountOptions);

  const payAmount = r2(amount);
  const fifo = splitFifo(items, payAmount);
  const amountFor = (item) => (manual ? r2(manual[keyOf(item)]) : fifo[keyOf(item)] || 0);
  const allocated = r2(items.reduce((sum, i) => sum + amountFor(i), 0));
  const leftAfter = r2(totalDue - payAmount);

  const clearErrors = () => setErrors({});

  const resetParty = () => {
    setAmount("");
    setManual(null);
    clearErrors();
  };

  const handleClose = () => {
    setPartyType(defaultPartyType);
    setParty("");
    setAccount("");
    setNotes("");
    resetParty();
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const toggleManual = () => {
    if (manual) {
      setManual(null);
      return;
    }
    setManual(Object.fromEntries(items.map((i) => [keyOf(i), fifo[keyOf(i)] ? String(fifo[keyOf(i)]) : ""])));
  };

  const validate = () => {
    const e = {};
    if (!party) e.party = `Choose the ${partyType === "Vendor" ? "supplier" : "customer"}`;
    else if (!(payAmount > 0)) e.amount = "Enter the amount";
    else if (payAmount > totalDue) e.amount = `The total due is only ${formatMoney(totalDue)}`;
    if (!effectiveAccount) e.account = "Choose the cash drawer or bank";
    if (manual) {
      const over = items.find((i) => amountFor(i) > i.due);
      if (over) e.split = `${over.number || over.label}: only ${formatMoney(over.due)} is due`;
      else if (allocated !== payAmount) e.split = `The split adds up to ${formatMoney(allocated)} but the payment is ${formatMoney(payAmount)}`;
    }
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      toast.error(Object.values(e)[0]);
      return;
    }
    const postNow = canPost && (event.nativeEvent?.submitter?.dataset?.mode || "post") === "post";
    setSubmitMode(postNow ? "post" : "draft");
    try {
      const res = await createPayment({
        partyType,
        party,
        amount: payAmount,
        [accountField]: effectiveAccount,
        notes: notes.trim(),
        ...(manual ? { allocations: items.filter((i) => amountFor(i) > 0).map((i) => ({ entityType: i.entityType, entityId: i.entityId, amount: amountFor(i) })) } : {}),
        postNow,
        clientRequestId: requestId,
      }).unwrap();
      const payment = res.data;
      handleClose();
      if (payment.status === "Posted") {
        toast.success(`${payment.paymentNumber} confirmed`);
        router.push(receiptPath(payment._id));
      } else {
        toast.success(`${payment.paymentNumber} saved — ${canPost ? "post it when ready" : "an admin will post it"}`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
      size="2xl"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="submit" form={formId} data-mode="draft" variant="secondary" isLoading={isLoading && submitMode === "draft"} disabled={isLoading} className={canPost ? "" : "col-span-2"}>
              {canPost ? "Save as draft" : "Save for admin"}
            </Button>
            {canPost && (
              <Button type="submit" form={formId} data-mode="post" isLoading={isLoading && submitMode === "post"} disabled={isLoading}>
                {!(isLoading && submitMode === "post") && <Receipt className="h-4 w-4" />}
                Confirm
              </Button>
            )}
          </div>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
        }}
        className="space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <SegmentedControl
            label="Who"
            value={partyType}
            onChange={(v) => {
              setPartyType(v);
              setParty("");
              resetParty();
            }}
            options={PARTY_TYPES}
          />
          <Combobox
            id={`${formId}-party`}
            label={partyType === "Vendor" ? "Supplier" : "Customer"}
            required
            value={party}
            onChange={(v) => {
              setParty(v);
              resetParty();
            }}
            options={toPartyOptions(parties)}
            placeholder={`Search ${partyType === "Vendor" ? "supplier" : "customer"}`}
            searchPlaceholder="Name or phone…"
            emptyText="Nobody found"
            error={errors.party}
          />
        </div>

        {party &&
          (isLoadingDues && !dues ? (
            <PageLoader />
          ) : items.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-[13px] text-slate-500 ring-1 ring-inset ring-slate-200">Nothing is due here.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200 scrollbar-thin">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                      <th className="px-3 py-2.5 text-left">Oldest first</th>
                      <th className="px-3 py-2.5 text-right">{dueLabel}</th>
                      <th className="px-3 py-2.5 text-right">This payment</th>
                      <th className="px-3 py-2.5 text-right">Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const key = keyOf(item);
                      const pay = amountFor(item);
                      return (
                        <tr key={key}>
                          <td className="px-3 py-2">
                            <p className="font-medium text-slate-800">{item.number || item.label}</p>
                            <p className="text-xs text-slate-500">{item.date ? `${item.label} · ${formatDate(item.date)}` : "From before the system"}</p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-700">{formatMoney(item.due)}</td>
                          <td className="px-3 py-2 text-right">
                            {manual ? (
                              <input
                                type="number"
                                inputMode="decimal"
                                step="any"
                                min="0"
                                aria-label={`Amount for ${item.number || item.label}`}
                                value={manual[key] ?? ""}
                                onChange={(e) => {
                                  setManual({ ...manual, [key]: e.target.value });
                                  setErrors((prev) => ({ ...prev, split: "" }));
                                }}
                                className="h-9 w-28 rounded-lg border border-slate-300 px-2.5 text-right text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                              />
                            ) : (
                              <span className={`whitespace-nowrap tabular-nums ${pay > 0 ? "font-semibold text-slate-900" : "text-slate-300"}`}>{pay > 0 ? formatMoney(pay) : "—"}</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-600">{formatMoney(r2(item.due - pay))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {errors.split && <p className="text-[13px] font-medium text-rose-600">{errors.split}</p>}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
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
                      setErrors((prev) => ({ ...prev, amount: "", split: "" }));
                    }}
                    error={errors.amount}
                  />
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs font-medium text-indigo-600">
                    <button type="button" onClick={() => (setAmount(String(totalDue)), setManual(null))} className="hover:text-indigo-800">
                      Pay all {formatMoney(totalDue)}
                    </button>
                    {payAmount > 0 && items.length > 1 && (
                      <button type="button" onClick={toggleManual} className="flex items-center gap-1 hover:text-indigo-800">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {manual ? "Back to oldest first" : "Change the split"}
                      </button>
                    )}
                  </div>
                </div>
                <Combobox
                  id={`${formId}-account`}
                  label={accountLabel}
                  required
                  value={effectiveAccount}
                  onChange={(v) => {
                    setAccount(v);
                    setErrors((prev) => ({ ...prev, account: "" }));
                  }}
                  options={accountOptions}
                  placeholder="Cash drawer or bank"
                  error={errors.account}
                  hint={
                    bankData && accountOptions.length === 0 ? (
                      <SetupNotice compact message="No cash or bank account yet." actionLabel="Add cash / bank" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin." onNavigate={handleClose} />
                    ) : !canUseAnyDrawer && !myDrawerId ? (
                      "Bank only — open your cash session to use cash"
                    ) : undefined
                  }
                />
              </div>

              <Input id={`${formId}-notes`} label="Notes" placeholder="Optional" value={notes} onChange={(e) => setNotes(e.target.value)} />

              <SummaryPanel
                rows={[
                  { label: `Total ${dueLabel.toLowerCase()}`, value: formatMoney(totalDue) },
                  { label: "This payment", value: `− ${formatMoney(payAmount)}` },
                  { label: leftAfter <= 0 ? "Fully settled" : "Left after this", value: formatMoney(Math.max(0, leftAfter)), emphasis: true, tone: leftAfter === 0 ? "positive" : undefined },
                ]}
              />
            </>
          ))}

        {onSwitchMode && (
          <button type="button" onClick={onSwitchMode} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-800">
            Pay against one transaction instead
          </button>
        )}
      </form>
    </Modal>
  );
};

export default PartyPaymentFormModal;
