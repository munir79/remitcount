"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Receipt, Settings2, Trash2, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetAllCustomersQuery } from "@/redux/features/customer/customerApi";
import { useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { useCreateOtherIncomeMutation, useGetIncomeTypesQuery } from "@/redux/features/pos/otherIncomeApi";
import { useGetAllVendorsQuery } from "@/redux/features/vendor/vendorApi";
import { formatMoney } from "@/lib/format";
import { toAccountOptions, toPartyOptions } from "@/lib/options";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Combobox from "../ui/Combobox";
import FormSection from "../ui/FormSection";
import SummaryPanel from "../ui/SummaryPanel";
import SetupNotice from "../ui/SetupNotice";
import QuickCustomerForm from "../send/QuickCustomerForm";
import CustomerPaymentSection, { initialPayment, resolvePayment, validatePayment } from "../send/CustomerPaymentSection";
import IncomeTypesModal from "./IncomeTypesModal";

const FORM_ID = "other-income-form";
const PAYMENT_ERROR_KEYS = ["paymentAccount", "cashTendered", "split"];
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// খরচ কীভাবে দেওয়া হলো
const COST_METHODS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "CreditCard", label: "Credit card" },
  { value: "Supplier", label: "Supplier (pay later)" },
];
const newCost = (label = "Cost") => ({ id: crypto.randomUUID(), label, amount: "", paidVia: "Cash", account: "" });

const initialState = () => ({
  incomeTypeId: "",
  customer: "",
  description: "",
  sellAmount: "",
  payment: initialPayment(),
  costs: [newCost("Cost"), newCost("Other cost")],
  supplier: "",
});

/**
 * ✅ নতুন Other Income — টিকিট, Visa, বিল জমা…
 * ধরন (তালিকা থেকে), বিল, Customer কীভাবে দিলেন (Cash / Bank / Credit / Split), প্রতিটা খরচ কীভাবে দেওয়া
 * (Cash / Bank / Credit card / Supplier — পরে দেবো); Confirm করলে Post হয়ে বিল / Receipt খোলে
 */
const OtherIncomeFormModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManageTypes = hasPermission("otherIncome:types");
  const canUseAnyDrawer = hasPermission("cashierSession:manage");

  const skip = { skip: !isOpen };
  const { data: typeData } = useGetIncomeTypesQuery({ status: "active" }, skip);
  const { data: customerData } = useGetAllCustomersQuery({ limit: 500, status: "active" }, skip);
  const { data: vendorData } = useGetAllVendorsQuery({ limit: 200, status: "active" }, skip);
  const { data: bankData } = useGetAllBankAccountsQuery({ limit: 100 }, skip);
  const { data: accountData } = useGetAllAccountsQuery({ type: "Liability", isGroup: false, status: "active", limit: 200 }, skip);
  const { data: sessionData } = useGetMyOpenSessionQuery(undefined, skip);
  const [createIncome, { isLoading }] = useCreateOtherIncomeMutation();

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [newCustomerText, setNewCustomerText] = useState(null);
  const [createdCustomers, setCreatedCustomers] = useState([]);
  const [submitMode, setSubmitMode] = useState("post");
  const [typesOpen, setTypesOpen] = useState(false);

  // ---------- Data ----------
  const types = typeData?.data || [];
  const customers = useMemo(() => {
    const list = customerData?.data?.data || [];
    const extra = createdCustomers.filter((c) => !list.some((x) => x._id === c._id));
    return [...extra, ...list];
  }, [customerData, createdCustomers]);
  const selectedCustomer = customers.find((c) => c._id === form.customer);
  const suppliers = vendorData?.data?.data || [];
  const bankAccounts = bankData?.data?.data || [];
  const cashDrawers = bankAccounts.filter((b) => b.accountType === "Cash" && b.account && b.status !== "inactive");
  const banks = bankAccounts.filter((b) => b.accountType === "Bank" && b.account && b.status !== "inactive");
  // Credit card — "Credit Card Payable" বা নিজের বানানো Liability (Supplier / Customer Payables না)
  const cards = (accountData?.data?.data || []).filter((a) => !a.isSystemAccount || a.systemKey === "CREDIT_CARD_PAYABLE");
  const defaultCard = cards.find((a) => a.systemKey === "CREDIT_CARD_PAYABLE")?._id || "";
  const mySession = sessionData?.data;
  const isSessionOpen = mySession?.status === "Open";
  const myDrawerId = isSessionOpen ? mySession?.cashAccount?._id || mySession?.cashAccount : "";

  const paymentOptions = {
    cash: cashDrawers
      .filter((b) => canUseAnyDrawer || b.account._id === myDrawerId)
      .map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.location || "Cash drawer", b.branch?.name].filter(Boolean).join(" · ") })),
    bank: banks.map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.bankName, b.bankAccountNumber].filter(Boolean).join(" · ") })),
    receivable: [],
  };
  const paymentDefaults = { cash: myDrawerId, bank: paymentOptions.bank.length === 1 ? paymentOptions.bank[0].value : "", receivable: "" };
  const accountOptionsFor = (paidVia) => (paidVia === "Cash" ? paymentOptions.cash : paidVia === "Bank" ? paymentOptions.bank : toAccountOptions(cards));
  const defaultAccountFor = (paidVia) => (paidVia === "Cash" ? paymentDefaults.cash : paidVia === "Bank" ? paymentDefaults.bank : paidVia === "CreditCard" ? defaultCard : "");

  // ---------- হিসাব ----------
  const sellAmount = Number(form.sellAmount) || 0;
  const payment = resolvePayment(form.payment, sellAmount, paymentDefaults);
  const costLines = form.costs.filter((c) => Number(c.amount) > 0);
  const totalCost = r2(costLines.reduce((sum, c) => sum + Number(c.amount), 0));
  const profit = r2(sellAmount - totalCost);
  const needsSupplier = costLines.some((c) => c.paidVia === "Supplier");

  // ---------- Handlers ----------
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const setCost = (id, patch) => {
    setForm((prev) => ({ ...prev, costs: prev.costs.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
    setErrors((prev) => ({ ...prev, [`cost-${id}`]: "", costs: "" }));
  };

  const selectCustomer = (id, customerDoc) => {
    const customer = customerDoc || customers.find((c) => c._id === id);
    const method = ["Cash", "Bank", "Credit", "Split"].includes(customer?.lastPaymentMethod) ? customer.lastPaymentMethod : "Cash";
    setForm((prev) => ({ ...prev, customer: id, payment: initialPayment(method) }));
    setErrors((prev) => ({ ...prev, customer: "" }));
    setNewCustomerText(null);
  };

  const handleClose = () => {
    setForm(initialState());
    setErrors({});
    setNewCustomerText(null);
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const validate = () => {
    const e = {};
    if (!form.incomeTypeId) e.incomeTypeId = "Choose the type of income";
    if (!(sellAmount > 0)) e.sellAmount = "Enter the bill amount";
    if (sellAmount > 0) Object.assign(e, validatePayment(form.payment, payment, paymentDefaults, { autoReceivable: true }));
    if (payment.onCredit > 0 && !form.customer) e.customer = "Choose the customer — they still have to pay part of the bill";
    costLines.forEach((c) => {
      if (c.paidVia !== "Supplier" && !(c.account || defaultAccountFor(c.paidVia))) {
        e[`cost-${c.id}`] = c.paidVia === "Cash" ? "Open your cashier session first" : c.paidVia === "Bank" ? "Choose the bank" : "Choose the credit card account";
      }
    });
    if (needsSupplier && !form.supplier) e.supplier = "Choose the supplier you will pay later";
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
      const res = await createIncome({
        incomeTypeId: form.incomeTypeId,
        customer: form.customer || undefined,
        description: form.description,
        sellAmount,
        payments: payment.payments.map(({ method, account, amount, tendered }) => ({ method, account, amount, tendered })),
        costs: costLines.map((c) => ({
          label: c.label,
          amount: Number(c.amount),
          paidVia: c.paidVia,
          ...(c.paidVia !== "Supplier" ? { account: c.account || defaultAccountFor(c.paidVia) } : {}),
        })),
        ...(needsSupplier ? { supplier: form.supplier } : {}),
        postNow,
        clientRequestId: requestId,
      }).unwrap();
      const income = res.data;
      handleClose();
      if (postNow) {
        toast.success(`${income.incomeNumber} confirmed`);
        router.push(`/pos/other-income/${income._id}/receipt`);
      } else {
        toast.success(`${income.incomeNumber} saved as draft`);
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
        title="New Other Income"
        description="Air tickets, visa, bill payments and other services"
        size="2xl"
        footer={
          <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline justify-between gap-3 lg:hidden">
              <span className="text-[13px] text-slate-500">Bill</span>
              <span className="text-lg font-semibold tabular-nums text-slate-900">{formatMoney(sellAmount)}</span>
            </div>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading} className="hidden lg:inline-flex">
              Cancel
            </Button>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={isLoading} className="col-span-2 sm:col-span-1 lg:hidden">
                Cancel
              </Button>
              <Button type="submit" form={FORM_ID} data-mode="draft" variant="secondary" isLoading={isLoading && submitMode === "draft"} disabled={isLoading}>
                Save as draft
              </Button>
              <Button type="submit" form={FORM_ID} data-mode="post" isLoading={isLoading && submitMode === "post"} disabled={isLoading}>
                {!(isLoading && submitMode === "post") && <Receipt className="h-4 w-4" />}
                Confirm & bill
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
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-7">
              {/* ① ধরন ও Customer */}
              <FormSection step={1} title="What was sold">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Combobox
                    id="incomeType"
                    label="Type of income"
                    required
                    value={form.incomeTypeId}
                    onChange={(v) => setField("incomeTypeId", v)}
                    options={types.map((t) => ({ value: t._id, label: t.name, sub: t.account?.name }))}
                    placeholder="Choose type"
                    emptyText="No income types yet"
                    error={errors.incomeTypeId}
                    hint={
                      canManageTypes ? (
                        <button type="button" onClick={() => setTypesOpen(true)} className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800">
                          <Settings2 className="h-3.5 w-3.5" />
                          Add or rename types
                        </button>
                      ) : undefined
                    }
                  />
                  <Input id="incomeDescription" label="Description" placeholder="e.g. KUL → DAC, 15 Nov, PNR AB12CD" value={form.description} onChange={(e) => setField("description", e.target.value)} />
                </div>
                <div className="mt-4">
                  {newCustomerText !== null ? (
                    <QuickCustomerForm
                      initialText={newCustomerText}
                      onCancel={() => setNewCustomerText(null)}
                      onCreated={(c) => {
                        setCreatedCustomers((prev) => [c, ...prev]);
                        selectCustomer(c._id, c);
                      }}
                    />
                  ) : (
                    <>
                      <Combobox
                        id="incomeCustomer"
                        label="Customer"
                        value={form.customer}
                        onChange={(id) => selectCustomer(id)}
                        options={toPartyOptions(customers)}
                        placeholder="Walk-in — or search customer"
                        searchPlaceholder="Name, phone or ID number…"
                        emptyText="No customer found"
                        onCreate={(text) => setNewCustomerText(text)}
                        createLabel={(q) => (q ? `Add "${q}" as a new customer` : "Add a new customer")}
                        error={errors.customer}
                        hint="Optional when paid in full — needed if they pay later"
                      />
                      {selectedCustomer && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                          <UserRound className="h-3.5 w-3.5" />
                          {[selectedCustomer.name, selectedCustomer.phone].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </FormSection>

              {/* ② বিল */}
              <FormSection step={2} title="Bill">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    id="sellAmount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    label="Bill amount"
                    required
                    prefix="RM"
                    value={form.sellAmount}
                    onChange={(e) => setField("sellAmount", e.target.value)}
                    error={errors.sellAmount}
                    hint="What the customer pays"
                  />
                </div>
              </FormSection>

              {/* ③ Customer কীভাবে দিলেন */}
              <FormSection step={3} title="Payment received" description="How the customer is paying the bill">
                <CustomerPaymentSection
                  autoReceivable
                  value={form.payment}
                  onChange={(next) => {
                    setForm((prev) => ({ ...prev, payment: next }));
                    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !PAYMENT_ERROR_KEYS.includes(k) && !k.startsWith("line-"))));
                  }}
                  total={sellAmount}
                  resolved={payment}
                  options={paymentOptions}
                  defaults={paymentDefaults}
                  errors={errors}
                  hints={{
                    Cash: !isSessionOpen && sessionData ? <SetupNotice compact message="Open your cashier session to take cash." actionLabel="Open session" href="/pos" permission="cashierSession:create" onNavigate={handleClose} /> : undefined,
                  }}
                  customer={selectedCustomer}
                />
              </FormSection>

              {/* ④ খরচ */}
              <FormSection step={4} title="Costs" description="What it cost us, and how we paid it">
                <div className="space-y-3">
                  {form.costs.map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="grid gap-3 sm:grid-cols-[1fr_130px_170px_auto] sm:items-start">
                        <Input id={`costLabel-${c.id}`} aria-label="Cost name" placeholder="e.g. Ticket price" value={c.label} onChange={(e) => setCost(c.id, { label: e.target.value })} />
                        <Input
                          id={`costAmount-${c.id}`}
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          prefix="RM"
                          aria-label={`${c.label || "Cost"} amount`}
                          placeholder="0.00"
                          value={c.amount}
                          onChange={(e) => setCost(c.id, { amount: e.target.value })}
                        />
                        <select
                          aria-label="Paid via"
                          value={c.paidVia}
                          onChange={(e) => setCost(c.id, { paidVia: e.target.value, account: "" })}
                          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                        >
                          {COST_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, costs: prev.costs.filter((x) => x.id !== c.id) }))}
                          disabled={form.costs.length === 1}
                          title="Remove"
                          aria-label="Remove cost"
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {Number(c.amount) > 0 && c.paidVia !== "Supplier" && (
                        <div className="mt-2 sm:max-w-sm">
                          <Combobox
                            id={`costAccount-${c.id}`}
                            value={c.account || defaultAccountFor(c.paidVia)}
                            onChange={(v) => setCost(c.id, { account: v })}
                            options={accountOptionsFor(c.paidVia)}
                            placeholder={c.paidVia === "Cash" ? "Cash drawer" : c.paidVia === "Bank" ? "Bank account" : "Credit card account"}
                            emptyText="Nothing to choose yet"
                            error={errors[`cost-${c.id}`]}
                            hint={c.paidVia === "CreditCard" ? "Owed to the card company until the card bill is paid" : undefined}
                          />
                        </div>
                      )}
                      {Number(c.amount) > 0 && c.paidVia === "Supplier" && <p className="mt-2 text-xs text-amber-700">Paid later — the supplier shows under To pay until a Payment Out.</p>}
                    </div>
                  ))}
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, costs: [...prev.costs, newCost("")] }))} className="flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-800">
                    <Plus className="h-4 w-4" />
                    Add cost
                  </button>
                  {needsSupplier && (
                    <Combobox
                      id="incomeSupplier"
                      label="Supplier to pay later"
                      required
                      value={form.supplier}
                      onChange={(v) => setField("supplier", v)}
                      options={toPartyOptions(suppliers)}
                      placeholder="Choose supplier"
                      emptyText="No suppliers yet"
                      error={errors.supplier}
                      hint={vendorData && suppliers.length === 0 ? <SetupNotice compact message="No suppliers yet." actionLabel="Add supplier" href="/vendor" permission="vendor:create" adminHint="Ask your admin to add one." onNavigate={handleClose} /> : undefined}
                    />
                  )}
                </div>
              </FormSection>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-0 lg:self-start">
              <SummaryPanel
                title="Summary"
                rows={[
                  { label: "Type", value: types.find((t) => t._id === form.incomeTypeId)?.name || "—", muted: !form.incomeTypeId },
                  { label: "Bill", value: formatMoney(sellAmount), emphasis: true },
                  payment.paidNow > 0 && payment.onCredit > 0 && { label: "Paid now", value: formatMoney(payment.paidNow) },
                  payment.onCredit > 0 && { label: "To collect later", value: formatMoney(payment.onCredit) },
                  payment.change > 0 && { label: "Change to give", value: formatMoney(payment.change) },
                  { label: "Costs", value: `− ${formatMoney(totalCost)}`, muted: totalCost === 0 },
                  { label: "Profit", value: formatMoney(profit), tone: "profit", rawValue: profit },
                ].filter(Boolean)}
              />
            </aside>
          </div>
        </form>
      </Modal>
      {canManageTypes && <IncomeTypesModal isOpen={typesOpen} onClose={() => setTypesOpen(false)} />}
    </>
  );
};

export default OtherIncomeFormModal;
