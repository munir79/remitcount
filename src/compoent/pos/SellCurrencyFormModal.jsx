"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeftRight, Lock, Receipt, UserRound, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetAllCustomersQuery } from "@/redux/features/customer/customerApi";
import { useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { useGetAllCurrencyStocksQuery, useGetMyDrawerHoldingsQuery } from "@/redux/features/pos/currencyStockApi";
import { useCreateSellCurrencyMutation } from "@/redux/features/pos/sellCurrencyApi";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import { baseToForeign, describeInverse, describeRate, foreignToBase, rateUnitLabel } from "@/lib/currencyMath";
import { formatMoney, formatNumber, isBusinessToday, timeAgo } from "@/lib/format";
import { toPartyOptions } from "@/lib/options";
import { getCountryName } from "@/lib/countries";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Combobox from "../ui/Combobox";
import FormSection from "../ui/FormSection";
import SummaryPanel from "../ui/SummaryPanel";
import SetupNotice from "../ui/SetupNotice";
import RateDisplay from "../ui/RateDisplay";
import QuickCustomerForm from "../send/QuickCustomerForm";
import CustomerPaymentSection, { initialPayment, resolvePayment, validatePayment } from "../send/CustomerPaymentSection";

const FORM_ID = "sell-form";
const PAYMENT_ERROR_KEYS = ["paymentAccount", "cashTendered", "split"];
const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const initialState = () => ({
  customer: "",
  currency: "",
  amountMode: "foreign", // কোন ঘরে টাইপ হচ্ছে — অন্যটা হিসাব করে বসে
  foreignInput: "",
  myrInput: "",
  fees: "0",
  rateOverride: "",
  payment: initialPayment(), // Cash (ফেরত সহ) / Bank / Credit / Split — Customer দেন
});

/**
 * ✅ নতুন Sell — Customer RM দেন, আমরা Foreign Currency দিই (নিজের Drawer থেকে)
 * Rate আসে Rate Board এর "We sell" থেকে; Fee দামের উপরে; লাভ (গড় খরচ থেকে) শুধু Admin দেখেন
 */
const SellCurrencyFormModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canOverrideRate = hasPermission("rate:override");
  const canSeeCost = hasPermission("rate:update"); // গড় খরচ ও লাভ — শুধু Admin
  const canUseAnyDrawer = hasPermission("cashierSession:manage");

  const skip = { skip: !isOpen };
  const { data: customerData } = useGetAllCustomersQuery({ limit: 500, status: "active" }, skip);
  const { data: boardData } = useGetRateBoardQuery(undefined, skip);
  const { data: bankData } = useGetAllBankAccountsQuery({ limit: 100 }, skip);
  const { data: sessionData } = useGetMyOpenSessionQuery(undefined, skip);
  const { data: holdingData } = useGetMyDrawerHoldingsQuery(undefined, { ...skip, refetchOnMountOrArgChange: true });
  const { data: stockData } = useGetAllCurrencyStocksQuery({ limit: 200 }, { skip: !isOpen || !canSeeCost });
  const [createSell, { isLoading }] = useCreateSellCurrencyMutation();

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [newCustomerText, setNewCustomerText] = useState(null); // null = Quick Form বন্ধ
  const [createdCustomers, setCreatedCustomers] = useState([]);
  const [currencySource, setCurrencySource] = useState(null); // Currency নিজে থেকে কেন বসল — Hint এ দেখানো
  const [submitMode, setSubmitMode] = useState("post");

  // ---------- Data ----------
  const customers = useMemo(() => {
    const list = customerData?.data?.data || [];
    const extra = createdCustomers.filter((c) => !list.some((x) => x._id === c._id));
    return [...extra, ...list];
  }, [customerData, createdCustomers]);
  const selectedCustomer = customers.find((c) => c._id === form.customer);
  // শুধু যেসব Currency র আজকের "We sell" Rate আছে
  const board = useMemo(() => (boardData?.data || []).filter((b) => b.sellRate), [boardData]);
  const boardRow = board.find((b) => b.currency._id === form.currency);
  const currency = boardRow?.currency;
  const decimals = currency?.decimals ?? 2;

  // নিজের Drawer এ কোন Currency কত
  const holdings = holdingData?.data?.holdings || [];
  const heldQty = (currencyId) => holdings.find((h) => h.currency === currencyId)?.qty || 0;
  const inDrawer = currency ? heldQty(currency._id) : 0;
  // Admin — দোকানের গড় খরচ (লাভ দেখানোর জন্য)
  const averageCost = canSeeCost && currency ? (stockData?.data?.data || []).find((s) => s.currency === currency._id || s.currencyCode === currency.code)?.averageCost || 0 : 0;

  const bankAccounts = bankData?.data?.data || [];
  const cashDrawers = bankAccounts.filter((b) => b.accountType === "Cash" && b.account && b.status !== "inactive");
  const banks = bankAccounts.filter((b) => b.accountType === "Bank" && b.account && b.status !== "inactive");
  const mySession = sessionData?.data;
  const isSessionOpen = mySession?.status === "Open";
  const myDrawerId = isSessionOpen ? mySession?.cashAccount?._id || mySession?.cashAccount : "";
  const myDrawerName = isSessionOpen ? mySession?.cashAccount?.name : "";

  const paymentOptions = {
    cash: cashDrawers
      .filter((b) => canUseAnyDrawer || b.account._id === myDrawerId)
      .map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.location || "Cash drawer", b.branch?.name].filter(Boolean).join(" · ") })),
    bank: banks.map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.bankName, b.bankAccountNumber].filter(Boolean).join(" · ") })),
    receivable: [],
  };
  const paymentDefaults = { cash: myDrawerId, bank: paymentOptions.bank.length === 1 ? paymentOptions.bank[0].value : "", receivable: "" };

  // ---------- হিসাব (Backend এর সাথে একই সূত্র) ----------
  const rate = canOverrideRate && Number(form.rateOverride) > 0 ? Number(form.rateOverride) : boardRow?.sellRate || 0;
  const isRateOverridden = canOverrideRate && Number(form.rateOverride) > 0 && Number(form.rateOverride) !== boardRow?.sellRate;
  const foreignAmount =
    form.amountMode === "foreign" ? Number(form.foreignInput) || 0 : currency && rate ? baseToForeign(Number(form.myrInput) || 0, rate, currency.quoteStyle, decimals) : 0;
  const valueMYR = currency && rate ? foreignToBase(foreignAmount, rate, currency.quoteStyle) : 0;
  const fees = Number(form.fees) || 0;
  const customerPays = r2(valueMYR + fees);
  const payment = resolvePayment(form.payment, customerPays, paymentDefaults);
  const notEnoughNotes = currency && foreignAmount > 0 && foreignAmount > inDrawer;
  const cost = r2(foreignAmount * averageCost);
  const profit = r2(valueMYR - cost);

  // ---------- Handlers ----------
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /**
   * ✅ Customer বাছলে:
   *  - Currency — Nationality র দেশের Currency ("We sell" Rate থাকলে); Staff বদলাতে পারেন
   *  - Payment — শেষবার যেভাবে দিয়েছিলেন (প্রথমবার Cash)
   */
  const selectCustomer = (id, customerDoc) => {
    const customer = customerDoc || customers.find((c) => c._id === id);
    const method = ["Cash", "Bank", "Credit", "Split"].includes(customer?.lastPaymentMethod) ? customer.lastPaymentMethod : "Cash";
    const nationalityCurrency = customer?.nationality ? board.find((b) => b.currency.country === customer.nationality)?.currency : null;
    setForm((prev) => ({
      ...prev,
      customer: id,
      payment: initialPayment(method),
      ...(nationalityCurrency && nationalityCurrency._id !== prev.currency ? { currency: nationalityCurrency._id, rateOverride: "" } : {}),
    }));
    setCurrencySource(nationalityCurrency ? `Auto · ${getCountryName(customer.nationality)} nationality — change if they want another currency` : null);
    setErrors((prev) => ({ ...prev, customer: "", ...(nationalityCurrency ? { currency: "" } : {}) }));
    setNewCustomerText(null);
  };

  const handleClose = () => {
    setForm(initialState());
    setErrors({});
    setNewCustomerText(null);
    setCurrencySource(null);
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const nationalityCode = selectedCustomer?.nationality;
  const nationalityHasNoRate =
    nationalityCode && !board.some((b) => b.currency.country === nationalityCode) && (boardData?.data || []).some((b) => b.currency.country === nationalityCode);
  const currencyHint = currency
    ? [currencySource, `Your drawer has ${currency.code} ${formatNumber(inDrawer, decimals)}`].filter(Boolean).join(" · ")
    : nationalityHasNoRate
      ? `${getCountryName(nationalityCode)}'s currency has no sell rate today`
      : undefined;

  const validate = () => {
    const e = {};
    if (!form.customer) e.customer = "Select or add a customer";
    if (!form.currency) e.currency = "Choose a currency";
    if (!(foreignAmount > 0)) e.amount = "Enter the amount";
    else if (notEnoughNotes) e.amount = `Your drawer has only ${currency.code} ${formatNumber(inDrawer, decimals)}`;
    if (fees < 0) e.fees = "Cannot be negative";
    if (!isSessionOpen) e.session = "Open your cashier session first — the notes come out of your drawer";
    if (customerPays > 0) Object.assign(e, validatePayment(form.payment, payment, paymentDefaults, { autoReceivable: true }));
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
      const res = await createSell({
        customer: form.customer,
        currency: form.currency,
        foreignAmount,
        fees,
        ...(isRateOverridden ? { rate } : {}),
        payments: payment.payments.map(({ method, account, amount, tendered }) => ({ method, account, amount, tendered })),
        postNow,
        clientRequestId: requestId,
      }).unwrap();
      const sell = res.data;
      handleClose();
      if (postNow) {
        toast.success(`${sell.sellNumber} confirmed`);
        router.push(`/pos/sell-currency/${sell._id}/receipt`);
      } else {
        toast.success(`${sell.sellNumber} saved as draft`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create sell");
    }
  };

  // Code, নাম বা দেশ লিখে খোঁজা যায়; নিজের Drawer এ কত আছে সাথে
  const currencyOptions = board.map((b) => ({
    value: b.currency._id,
    label: b.currency.code,
    sub: [
      b.currency.name,
      b.currency.country && getCountryName(b.currency.country),
      `We sell ${describeRate(b.sellRate, b.currency)}`,
      `in your drawer ${formatNumber(heldQty(b.currency._id), b.currency.decimals ?? 2)}`,
    ]
      .filter(Boolean)
      .join(" · "),
  }));

  const sessionNotice =
    sessionData && !isSessionOpen ? (
      mySession?.status === "PendingApproval" ? (
        <SetupNotice compact message="Your last session is waiting for manager approval." actionLabel="View report" href={`/pos/cash/session/${mySession._id}`} onNavigate={handleClose} />
      ) : (
        <SetupNotice compact message="Open your cashier session — the foreign notes come out of your drawer." actionLabel="Open session" href="/pos" permission="cashierSession:create" onNavigate={handleClose} />
      )
    ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Sell"
      description="The customer pays RM — we give foreign currency from your drawer"
      size="2xl"
      footer={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline justify-between gap-3 lg:hidden">
            <span className="text-[13px] text-slate-500">{form.payment.method === "Credit" ? "To collect later" : "Customer pays"}</span>
            <span className="text-lg font-semibold tabular-nums text-slate-900">{formatMoney(customerPays)}</span>
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
              Confirm & receipt
            </Button>
          </div>
        </div>
      }
    >
      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        noValidate
        // Input এ Enter চাপলে Browser প্রথম Submit Button (Draft) চাপে — সেটা বন্ধ; Confirm শুধু Button এ
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
        }}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-7">
            {/* ① Customer */}
            <FormSection step={1} title="Customer (buying from us)">
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
                    id="sellCustomer"
                    value={form.customer}
                    onChange={(id) => selectCustomer(id)}
                    options={toPartyOptions(customers)}
                    placeholder="Search customer by name, phone or IC / passport"
                    searchPlaceholder="Name, phone or ID number…"
                    emptyText="No customer found"
                    onCreate={(text) => setNewCustomerText(text)}
                    createLabel={(q) => (q ? `Add "${q}" as a new customer` : "Add a new customer")}
                    error={errors.customer}
                  />
                  {selectedCustomer && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium text-slate-800">
                        <UserRound className="h-3.5 w-3.5" />
                        {selectedCustomer.name}
                      </span>
                      {selectedCustomer.phone && <span>{selectedCustomer.phone}</span>}
                      {selectedCustomer.idNumber ? (
                        <span>
                          {selectedCustomer.idType}: {selectedCustomer.idNumber}
                        </span>
                      ) : (
                        <span className="text-amber-600">No IC / passport on file</span>
                      )}
                      {selectedCustomer.nationality && <span>{getCountryName(selectedCustomer.nationality)}</span>}
                    </div>
                  )}
                </>
              )}
            </FormSection>

            {/* ② Currency ও Amount */}
            <FormSection step={2} title="Currency the customer gets">
              {boardData && board.length === 0 && (
                <SetupNotice
                  className="mb-3"
                  message="No sell rate is set for today. Set “We sell” for each currency you sell."
                  actionLabel="Set today's rates"
                  href="/pos/rates"
                  permission="rate:update"
                  adminHint="Ask your admin to set today's rates."
                  onNavigate={handleClose}
                />
              )}
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <Combobox
                  id="sellCurrency"
                  label="Currency"
                  required
                  value={form.currency}
                  onChange={(v) => {
                    setForm((prev) => (v === prev.currency ? prev : { ...prev, currency: v, rateOverride: "" }));
                    setErrors((prev) => ({ ...prev, currency: "", amount: "" }));
                    setCurrencySource(null); // Staff নিজে বদলালে আর "Auto" না
                  }}
                  options={currencyOptions}
                  placeholder="Choose"
                  searchPlaceholder="Code, name or country…"
                  emptyText="No currency has a sell rate today"
                  error={errors.currency}
                  hint={currencyHint}
                />
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                  <Input
                    id="sellForeignAmount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    label="Customer gets"
                    required
                    suffix={currency?.code}
                    value={form.amountMode === "foreign" ? form.foreignInput : foreignAmount ? String(foreignAmount) : ""}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, amountMode: "foreign", foreignInput: e.target.value }));
                      setErrors((prev) => ({ ...prev, amount: "" }));
                    }}
                    error={errors.amount}
                    disabled={!currency}
                  />
                  <ArrowLeftRight className="mt-9 h-4 w-4 text-slate-400" aria-hidden="true" />
                  <Input
                    id="sellMyrAmount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    label="Price (MYR)"
                    prefix="RM"
                    value={form.amountMode === "myr" ? form.myrInput : valueMYR ? String(valueMYR) : ""}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, amountMode: "myr", myrInput: e.target.value }));
                      setErrors((prev) => ({ ...prev, amount: "" }));
                    }}
                    hint="Type either side"
                    disabled={!currency}
                  />
                </div>
              </div>

              {notEnoughNotes && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Your drawer has only {currency.code} {formatNumber(inDrawer, decimals)}. Ask your manager to move {currency.code} into your drawer.
                </p>
              )}
              {boardRow?.checkedAt && !isBusinessToday(boardRow.checkedAt) && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  The {currency.code} rate was last checked {timeAgo(boardRow.checkedAt)}, not today — make sure it is still correct.
                </p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {canOverrideRate ? (
                  <Input
                    id="sellRate"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    label={`Rate${currency ? ` (${rateUnitLabel(currency)})` : ""}`}
                    placeholder={boardRow ? String(boardRow.sellRate) : ""}
                    value={form.rateOverride}
                    onChange={(e) => setField("rateOverride", e.target.value)}
                    hint={
                      isRateOverridden
                        ? `${describeInverse(rate, currency)} · board is ${describeRate(boardRow?.sellRate, currency)}`
                        : boardRow
                          ? `We sell · ${describeRate(boardRow.sellRate, currency)} · ${describeInverse(boardRow.sellRate, currency)}`
                          : "Choose a currency"
                    }
                    disabled={!currency}
                  />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-slate-700">Rate</span>
                    <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm">
                      <span className="font-medium tabular-nums text-slate-900">{boardRow ? describeRate(boardRow.sellRate, currency) : "—"}</span>
                      <Lock className="h-3.5 w-3.5 text-slate-400" aria-label="Set by admin" />
                    </div>
                    <span className="text-xs text-slate-500">{boardRow ? `${describeInverse(boardRow.sellRate, currency)} · set by admin` : "Today's sell rate, set by admin"}</span>
                  </div>
                )}
                <Input
                  id="sellFee"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  label="Service fee"
                  prefix="RM"
                  value={form.fees}
                  onChange={(e) => setField("fees", e.target.value)}
                  error={errors.fees}
                  hint="Added on top of the price"
                />
              </div>
              {/* Admin — গড় খরচের নিচে বেচলে লোকসান */}
              {canSeeCost && averageCost > 0 && foreignAmount > 0 && profit < 0 && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Below cost — our average cost is RM {formatNumber(averageCost, averageCost < 1 ? 6 : 4)} per 1 {currency.code}. This sell loses {formatMoney(-profit)}.
                </p>
              )}
            </FormSection>

            {/* ③ Customer কীভাবে দিলেন */}
            <FormSection step={3} title="Payment received" description="How the customer is paying">
              <CustomerPaymentSection
                autoReceivable
                value={form.payment}
                onChange={(next) => {
                  setForm((prev) => ({ ...prev, payment: next }));
                  setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !PAYMENT_ERROR_KEYS.includes(k) && !k.startsWith("line-"))));
                }}
                total={customerPays}
                resolved={payment}
                options={paymentOptions}
                defaults={paymentDefaults}
                errors={errors}
                hints={{
                  Cash: sessionNotice || undefined,
                  Bank: bankData && banks.length === 0 ? <SetupNotice compact message="No bank account yet." actionLabel="Add bank account" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin to add one." onNavigate={handleClose} /> : undefined,
                }}
                customer={selectedCustomer}
              />
            </FormSection>

            {/* নোট কোথা থেকে যাবে */}
            <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[13px] text-slate-600">
              <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              {isSessionOpen ? (
                <span>
                  The {currency?.code || "foreign"} notes come out of <span className="font-semibold text-slate-800">{myDrawerName || "your drawer"}</span>
                  {currency && (
                    <>
                      {" "}
                      · it has {currency.code} {formatNumber(inDrawer, decimals)}
                    </>
                  )}
                </span>
              ) : (
                sessionNotice || <span>Checking your cashier session…</span>
              )}
            </div>
            {errors.session && <p className="-mt-5 text-xs font-medium text-rose-600">{errors.session}</p>}
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-0 lg:self-start">
            <SummaryPanel
              title="Summary"
              rows={[
                { label: "Customer gets", value: currency ? `${currency.code} ${formatNumber(foreignAmount, decimals)}` : "—" },
                { label: "Rate", value: currency && rate ? <RateDisplay rate={rate} currency={currency} className="items-end" /> : "—", muted: !rate },
                { label: "Price", value: formatMoney(valueMYR) },
                { label: "Service fee", value: `+ ${formatMoney(fees)}`, muted: fees === 0 },
                { label: "Customer pays", value: formatMoney(customerPays), emphasis: true },
                payment.paidNow > 0 && payment.onCredit > 0 && { label: "Paid now", value: formatMoney(payment.paidNow) },
                payment.onCredit > 0 && { label: "On credit", value: formatMoney(payment.onCredit) },
                payment.change > 0 && { label: "Change to give", value: formatMoney(payment.change) },
                canSeeCost && averageCost > 0 && foreignAmount > 0 && { label: "Our cost", value: `− ${formatMoney(cost)}` },
                canSeeCost && averageCost > 0 && foreignAmount > 0 && { label: "Exchange profit", value: formatMoney(profit), tone: "profit", rawValue: profit },
              ].filter(Boolean)}
            />
          </aside>
        </div>
      </form>
    </Modal>
  );
};

export default SellCurrencyFormModal;
