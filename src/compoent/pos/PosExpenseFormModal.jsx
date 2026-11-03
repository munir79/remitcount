"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Info, Landmark, Receipt, Settings2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { useCreatePosExpenseMutation, useGetExpenseTypesQuery } from "@/redux/features/pos/posExpenseApi";
import { formatMoney } from "@/lib/format";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Combobox from "../ui/Combobox";
import SegmentedControl from "../ui/SegmentedControl";
import SetupNotice from "../ui/SetupNotice";
import ExpenseTypesModal from "./ExpenseTypesModal";

const FORM_ID = "pos-expense-form";

const PAY_METHODS = [
  { value: "Cash", label: "Cash", icon: Banknote },
  { value: "Bank", label: "Bank", icon: Landmark },
];

const initialFormState = {
  expenseTypeId: "",
  amount: "",
  paymentMethod: "Cash",
  paymentAccount: "",
  paidTo: "",
  description: "",
};

/**
 * ✅ নতুন খরচ — ধরন (তালিকা থেকে; Account আর Admin / Direct নিজে থেকে), টাকা, Cash (নিজের Drawer) / Bank
 * Cashier এর সীমার বেশি হলে Confirm চাপলেও Post হয় না — Admin / Manager এর অনুমোদনের অপেক্ষায় থাকে
 */
const PosExpenseFormModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManageTypes = hasPermission("posExpense:types");
  const canUseAnyDrawer = hasPermission("cashierSession:manage");

  const skip = { skip: !isOpen };
  const { data: typeData } = useGetExpenseTypesQuery({ status: "active" }, skip);
  const { data: bankData } = useGetAllBankAccountsQuery({ limit: 100 }, skip);
  const { data: sessionData } = useGetMyOpenSessionQuery(undefined, skip);
  const [createPosExpense, { isLoading }] = useCreatePosExpenseMutation();

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [submitMode, setSubmitMode] = useState("post");
  const [typesOpen, setTypesOpen] = useState(false);

  // ---------- Data ----------
  const types = typeData?.data || [];
  const approval = typeData?.approval; // { canApprove, limit }
  const selectedType = types.find((t) => t._id === form.expenseTypeId);
  const bankAccounts = bankData?.data?.data || [];
  const mySession = sessionData?.data;
  const isSessionOpen = mySession?.status === "Open";
  const myDrawerId = isSessionOpen ? mySession?.cashAccount?._id || mySession?.cashAccount : "";

  const cashOptions = bankAccounts
    .filter((b) => b.accountType === "Cash" && b.account && b.status !== "inactive")
    .filter((b) => canUseAnyDrawer || b.account._id === myDrawerId)
    .map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.location || "Cash drawer", b.branch?.name].filter(Boolean).join(" · ") }));
  const bankOptions = bankAccounts
    .filter((b) => b.accountType === "Bank" && b.account && b.status !== "inactive")
    .map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.bankName, b.bankAccountNumber].filter(Boolean).join(" · ") }));
  const accountOptions = form.paymentMethod === "Cash" ? cashOptions : bankOptions;
  const defaultAccount = form.paymentMethod === "Cash" ? myDrawerId : bankOptions.length === 1 ? bankOptions[0].value : "";
  const paymentAccount = form.paymentAccount || defaultAccount;

  const amount = Number(form.amount) || 0;
  const needsApproval = approval && !approval.canApprove && approval.limit !== null && amount > approval.limit;

  // ---------- Handlers ----------
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setForm(initialFormState);
    setErrors({});
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const validate = () => {
    const e = {};
    if (!form.expenseTypeId) e.expenseTypeId = "Choose the type of expense";
    if (!(amount > 0)) e.amount = "Enter the amount";
    if (!paymentAccount) e.paymentAccount = form.paymentMethod === "Cash" ? "Open your cashier session first" : "Choose the bank";
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
    const postNow = (event.nativeEvent?.submitter?.dataset?.mode || "post") === "post";
    setSubmitMode(postNow ? "post" : "draft");
    try {
      const res = await createPosExpense({
        expenseTypeId: form.expenseTypeId,
        amount,
        paymentMethod: form.paymentMethod,
        paymentAccount,
        paidTo: form.paidTo.trim(),
        description: form.description.trim(),
        postNow,
        clientRequestId: requestId,
      }).unwrap();
      const expense = res.data;
      handleClose();
      if (expense.status === "Posted") {
        toast.success(`${expense.expenseNumber} confirmed`);
        router.push(`/pos/expense/${expense._id}/voucher`);
      } else if (expense.awaitingApproval) {
        toast.success(`${expense.expenseNumber} sent to admin for approval`);
      } else {
        toast.success(`${expense.expenseNumber} saved as draft`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save");
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="New Expense"
        description="Rent, salaries, bills and other costs — paid by cash or bank"
        size="lg"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="submit" form={FORM_ID} data-mode="draft" variant="secondary" isLoading={isLoading && submitMode === "draft"} disabled={isLoading}>
                Save as draft
              </Button>
              <Button type="submit" form={FORM_ID} data-mode="post" isLoading={isLoading && submitMode === "post"} disabled={isLoading}>
                {!(isLoading && submitMode === "post") && <Receipt className="h-4 w-4" />}
                {needsApproval ? "Send for approval" : "Confirm"}
              </Button>
            </div>
          </div>
        }
      >
        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          noValidate
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Combobox
            id="expenseType"
            label="Type of expense"
            required
            value={form.expenseTypeId}
            onChange={(v) => setField("expenseTypeId", v)}
            options={types.map((t) => ({ value: t._id, label: t.name, sub: `${t.classification} · ${t.account?.name || ""}` }))}
            placeholder="Choose type"
            emptyText="No expense types yet"
            error={errors.expenseTypeId}
            className="sm:col-span-2"
            hint={
              canManageTypes ? (
                <button type="button" onClick={() => setTypesOpen(true)} className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800">
                  <Settings2 className="h-3.5 w-3.5" />
                  Add or rename types
                </button>
              ) : undefined
            }
          />
          {selectedType && (
            <p className="-mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-inset ring-slate-200 sm:col-span-2">
              Goes to <span className="font-medium text-slate-800">{selectedType.account?.code} {selectedType.account?.name}</span> · {selectedType.classification === "Admin" ? "Admin expense (running the shop)" : "Direct expense (cost of transactions)"}
            </p>
          )}

          <Input
            id="expenseAmount"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            label="Amount"
            required
            prefix="RM"
            value={form.amount}
            onChange={(e) => setField("amount", e.target.value)}
            error={errors.amount}
          />
          <SegmentedControl
            label="Paid by"
            value={form.paymentMethod}
            onChange={(v) => setForm((prev) => ({ ...prev, paymentMethod: v, paymentAccount: "" }))}
            options={PAY_METHODS}
          />
          <Combobox
            id="expensePaymentAccount"
            label={form.paymentMethod === "Cash" ? "Cash drawer" : "Bank account"}
            required
            value={paymentAccount}
            onChange={(v) => setField("paymentAccount", v)}
            options={accountOptions}
            placeholder={form.paymentMethod === "Cash" ? "Your cash drawer" : "Choose bank"}
            emptyText="Nothing to choose yet"
            error={errors.paymentAccount}
            className="sm:col-span-2"
            hint={
              form.paymentMethod === "Cash" && !isSessionOpen && sessionData ? (
                <SetupNotice compact message="Open your cashier session to pay in cash." actionLabel="Open session" href="/pos" permission="cashierSession:create" onNavigate={handleClose} />
              ) : form.paymentMethod === "Bank" && bankData && bankOptions.length === 0 ? (
                <SetupNotice compact message="No bank account yet." actionLabel="Add bank" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin." onNavigate={handleClose} />
              ) : undefined
            }
          />
          <Input id="expensePaidTo" label="Paid to" placeholder="e.g. Landlord, TNB" value={form.paidTo} onChange={(e) => setField("paidTo", e.target.value)} />
          <Input id="expenseDescription" label="Description" placeholder="e.g. November rent" value={form.description} onChange={(e) => setField("description", e.target.value)} />

          {approval && !approval.canApprove && approval.limit !== null && (
            <p
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs ring-1 ring-inset sm:col-span-2 ${
                needsApproval ? "bg-amber-50 text-amber-800 ring-amber-600/20" : "bg-slate-50 text-slate-600 ring-slate-200"
              }`}
            >
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {needsApproval
                ? `Above your limit of ${formatMoney(approval.limit)} — it will wait for an admin or manager to approve. No money moves until then.`
                : `You can confirm expenses up to ${formatMoney(approval.limit)} yourself.`}
            </p>
          )}
        </form>
      </Modal>
      {canManageTypes && <ExpenseTypesModal isOpen={typesOpen} onClose={() => setTypesOpen(false)} />}
    </>
  );
};

export default PosExpenseFormModal;
