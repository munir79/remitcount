"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeftRight, Lock, Pencil, Receipt, Settings2, UserRound } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetAllCustomersQuery } from "@/redux/features/customer/customerApi";
import { useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { useCreateSendMutation, useGetCustomerBeneficiariesQuery } from "@/redux/features/pos/sendApi";
import { useGetRateBoardQuery, useGetSupplierRatesQuery } from "@/redux/features/rate/rateApi";
import { useGetAllVendorsQuery } from "@/redux/features/vendor/vendorApi";
import { baseToForeign, describeInverse, describeRate, foreignToBase, profitPerThousand, rateUnitLabel } from "@/lib/currencyMath";
import { formatMoney, formatNumber, isBusinessToday, timeAgo } from "@/lib/format";
import { toAccountOptions, toPartyOptions } from "@/lib/options";
import { getCountryName } from "@/lib/countries";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Combobox from "../ui/Combobox";
import FormSection from "../ui/FormSection";
import SummaryPanel from "../ui/SummaryPanel";
import QuickCustomerForm from "../send/QuickCustomerForm";
import ReceiverPicker from "../send/ReceiverPicker";
import CustomerPaymentSection, { initialPayment, resolvePayment, validatePayment } from "../send/CustomerPaymentSection";
import SetupNotice from "../ui/SetupNotice";
import RateDisplay from "../ui/RateDisplay";

const FORM_ID = "send-form";
const EMPTY_RECEIVER = { name: "", bankName: "", accountNumber: "", bankBranch: "" };
const PAYMENT_ERROR_KEYS = ["paymentAccount", "cashTendered", "receivableAccount", "split"];

const initialState = () => ({
  customer: "",
  beneficiary: "new", // Saved Receiver id অথবা "new"
  receiver: EMPTY_RECEIVER,
  saveReceiver: true,
  currency: "",
  amountMode: "foreign", // কোন ঘরে টাইপ হচ্ছে — অন্যটা হিসাব করে বসে
  foreignInput: "",
  myrInput: "",
  customerFee: "0",
  rateOverride: "",
  supplier: "", // Staff নিজে বাছলে; না বাছলে Currency র Best Supplier
  supplierFor: "", // কোন Currency র জন্য বাছা হয়েছিল — Currency বদলালে আবার Best এ ফেরে
  supplierFee: "", // খালি = Supplier rate এর সাথে Save করা Fee
  supplierRateOverride: "",
  payment: initialPayment(), // Cash / Bank / Credit / Split — CustomerPaymentSection
  supplierPayableAccount: "",
  profitAccount: "",
});

/** প্রতি RM 1,000 এ Rate থেকে লাভ — সবুজ, ক্ষতি হলে লাল */
const ProfitPerThousand = ({ value }) =>
  value === null ? null : value >= 0 ? (
    <span className="text-emerald-700">Profit {formatMoney(value)} per RM 1,000 sent</span>
  ) : (
    <span className="font-medium text-rose-600">Loss {formatMoney(-value)} per RM 1,000 sent — check the rates</span>
  );

/** Currency বদলানো — আগের Currency র জন্য লেখা Rate / Supplier Rate / Supplier Fee আর খাটে না */
const withCurrency = (prev, currencyId) =>
  currencyId === prev.currency ? prev : { ...prev, currency: currencyId, rateOverride: "", supplierRateOverride: "", supplierFee: "" };

// System Account আগে (systemKey), না থাকলে প্রথমটা — Cashier কে Accounting Account বাছতে হয় না
const preferSystem = (accounts, key) => (accounts.find((a) => a.systemKey === key) || accounts[0])?._id || "";

/**
 * ✅ নতুন Send — Customer খোঁজা/নতুন, Saved Receiver, Rate Board এর Rate, দুই দিক থেকে Amount,
 * Confirm করলেই Post হয়ে Receipt খোলে
 */
const SendFormModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canOverrideRate = hasPermission("rate:override");
  const canSeeCost = hasPermission("rate:update"); // Supplier Rate ও লাভ — শুধু Admin
  const canUseAnyDrawer = hasPermission("cashierSession:manage"); // Manager অন্যের খোলা Drawer এও নিতে পারেন

  const skip = { skip: !isOpen };
  const { data: customerData } = useGetAllCustomersQuery({ limit: 500, status: "active" }, skip);
  const { data: vendorData } = useGetAllVendorsQuery({ limit: 200, status: "active" }, skip);
  const { data: boardData } = useGetRateBoardQuery(undefined, skip);
  const { data: supplierRateData } = useGetSupplierRatesQuery(undefined, { skip: !isOpen || !canSeeCost });
  const { data: bankData } = useGetAllBankAccountsQuery({ limit: 100 }, skip);
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, status: "active", limit: 500 }, skip);
  const { data: sessionData } = useGetMyOpenSessionQuery(undefined, skip);
  const [createSend, { isLoading }] = useCreateSendMutation();

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [newCustomerText, setNewCustomerText] = useState(null); // null = Quick Form বন্ধ
  const [createdCustomers, setCreatedCustomers] = useState([]); // এইমাত্র তৈরি — List Refresh এর আগেই দেখানোর জন্য
  const [showAccounts, setShowAccounts] = useState(false);
  const [currencySource, setCurrencySource] = useState(null); // Currency নিজে থেকে কেন বসল — Hint এ দেখানো
  const [submitMode, setSubmitMode] = useState("post");

  const { data: receiverData, isFetching: isReceiversLoading } = useGetCustomerBeneficiariesQuery(form.customer, { skip: !isOpen || !form.customer });

  // ---------- Data ----------
  const customers = useMemo(() => {
    const list = customerData?.data?.data || [];
    const extra = createdCustomers.filter((c) => !list.some((x) => x._id === c._id));
    return [...extra, ...list];
  }, [customerData, createdCustomers]);
  const selectedCustomer = customers.find((c) => c._id === form.customer);
  const receivers = receiverData?.data || [];
  const board = useMemo(() => (boardData?.data || []).filter((b) => b.sendRate), [boardData]);
  const boardRow = board.find((b) => b.currency._id === form.currency);
  const currency = boardRow?.currency;
  const decimals = currency?.decimals ?? 2;

  const suppliers = vendorData?.data?.data || [];
  // ✅ এই Currency তে কোন Supplier দিয়ে পাঠানো যায় — Board থেকে, সবচেয়ে লাভজনক আগে (Rate নিজে আসে না — Cashier দেখেন না)
  const rateSuppliers = boardRow?.sendSuppliers || [];
  const rateSupplierIds = new Set(rateSuppliers.map((v) => v._id));
  const isSupplierPicked = Boolean(form.supplier) && form.supplierFor === form.currency;
  const supplierId = isSupplierPicked ? form.supplier : rateSuppliers[0]?._id || "";
  const selectedSupplier = suppliers.find((v) => v._id === supplierId) || rateSuppliers.find((v) => v._id === supplierId);
  const supplierOptions = currency
    ? [
        ...rateSuppliers.map((v) => ({ value: v._id, label: v.name, sub: v.isBest && rateSuppliers.length > 1 ? "Best rate" : `${currency.code} rate set` })),
        ...suppliers.filter((v) => !rateSupplierIds.has(v._id)).map((v) => ({ value: v._id, label: v.name, sub: `No ${currency.code} rate yet` })),
      ]
    : toPartyOptions(suppliers);
  const bankAccounts = bankData?.data?.data || [];
  const cashDrawers = bankAccounts.filter((b) => b.accountType === "Cash" && b.account);
  const banks = bankAccounts.filter((b) => b.accountType === "Bank" && b.account);
  const registeredIds = new Set(bankAccounts.map((b) => b.account?._id));
  const accounts = accountData?.data?.data || [];
  // Customer এর বাকি — Accounts Receivable, অথবা নিজের বানানো Asset (Inventory এর মতো System Account না)
  const receivableAccounts = accounts.filter(
    (a) => a.type === "Asset" && !registeredIds.has(a._id) && (!a.isSystemAccount || a.systemKey === "ACCOUNTS_RECEIVABLE")
  );
  // System Account হলে শুধু ঠিকটা (Server ও আটকায়) — যেমন Customer Payables বা SST এ Supplier এর দেনা যায় না
  const liabilityAccounts = accounts.filter((a) => a.type === "Liability" && (!a.isSystemAccount || a.systemKey === "SUPPLIER_PAYABLE"));
  const incomeAccounts = accounts.filter((a) => a.type === "Income" && (!a.isSystemAccount || a.systemKey === "REMITTANCE_INCOME"));

  const mySession = sessionData?.data;
  const isSessionOpen = mySession?.status === "Open";
  const myDrawerId = isSessionOpen ? mySession?.cashAccount?._id || mySession?.cashAccount : "";

  // ---------- Default (Derived — State বদলায় না) ----------
  const paymentOptions = {
    cash: cashDrawers
      .filter((b) => canUseAnyDrawer || b.account._id === myDrawerId)
      .map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.location || "Cash drawer", b.branch?.name].filter(Boolean).join(" · ") })),
    bank: banks.map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.bankName, b.bankAccountNumber].filter(Boolean).join(" · ") })),
    receivable: toAccountOptions(receivableAccounts),
  };
  // Cash — নিজের Open Session এর Drawer; Bank — একটাই থাকলে সেটা; Receivable — Accounts Receivable
  const paymentDefaults = {
    cash: myDrawerId, // নিজের খোলা Session এর Drawer — অন্য কারো Drawer নিজে থেকে বসে না
    bank: paymentOptions.bank.length === 1 ? paymentOptions.bank[0].value : "",
    receivable: receivableAccounts.find((a) => a.systemKey === "ACCOUNTS_RECEIVABLE")?._id || (receivableAccounts.length === 1 ? receivableAccounts[0]._id : ""),
  };
  const supplierPayableAccount = form.supplierPayableAccount || preferSystem(liabilityAccounts, "SUPPLIER_PAYABLE");
  const profitAccount = form.profitAccount || preferSystem(incomeAccounts, "REMITTANCE_INCOME");

  // ---------- হিসাব (Backend এর সাথে একই সূত্র) ----------
  const rate = canOverrideRate && Number(form.rateOverride) > 0 ? Number(form.rateOverride) : boardRow?.sendRate || 0;
  const isRateOverridden = canOverrideRate && Number(form.rateOverride) > 0 && Number(form.rateOverride) !== boardRow?.sendRate;
  const foreignAmount =
    form.amountMode === "foreign" ? Number(form.foreignInput) || 0 : currency ? baseToForeign(Number(form.myrInput) || 0, rate, currency.quoteStyle, decimals) : 0;
  const amountMYR = currency ? foreignToBase(foreignAmount, rate, currency.quoteStyle) : 0;
  const customerFee = Number(form.customerFee) || 0;
  const customerTotal = Math.round((amountMYR + customerFee) * 100) / 100;

  const supplierRateRow = (supplierRateData?.data || []).find((r) => r.vendor?._id === supplierId && r.currency?._id === form.currency);
  const supplierRate = canOverrideRate && Number(form.supplierRateOverride) > 0 ? Number(form.supplierRateOverride) : supplierRateRow?.rate || 0;
  // ✅ Supplier Fee — Settings থেকে (Supplier rates); শুধু Override Permission থাকলে এই Send এর জন্য বদলানো যায়
  const supplierFeeOverridden = canOverrideRate && form.supplierFee !== "";
  const supplierFee = supplierFeeOverridden ? Number(form.supplierFee) || 0 : Number(supplierRateRow?.fee) || 0;
  const supplierTotal = currency && supplierRate ? Math.round((foreignToBase(foreignAmount, supplierRate, currency.quoteStyle) + supplierFee) * 100) / 100 : 0;
  const profit = Math.round((customerTotal - supplierTotal) * 100) / 100;
  // লাভের ভাগ — Rate থেকে কত, Fee থেকে কত (শুধু Admin দেখেন)
  const feeProfit = Math.round((customerFee - supplierFee) * 100) / 100;
  const rateProfit = Math.round((profit - feeProfit) * 100) / 100;
  const supplierOverridden = canOverrideRate && Number(form.supplierRateOverride) > 0;
  const payment = resolvePayment(form.payment, customerTotal, paymentDefaults);

  // ---------- Handlers ----------
  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /**
   * ✅ Customer বাছলে:
   *  - Currency — Nationality র দেশের Currency (আজকের Send Rate থাকলে)
   *  - Payment — শেষবার যেভাবে দিয়েছিলেন (প্রথমবার হলে Cash)
   * দুটোই Staff বদলাতে পারেন
   * customerDoc — এইমাত্র তৈরি হওয়া Customer (List এ এখনো আসেনি)
   */
  const selectCustomer = (id, customerDoc) => {
    const customer = customerDoc || customers.find((c) => c._id === id);
    const nationalityCurrency = customer?.nationality ? board.find((b) => b.currency.country === customer.nationality)?.currency : null;

    setForm((prev) => ({
      ...withCurrency(prev, nationalityCurrency?._id || prev.currency),
      customer: id,
      beneficiary: "new",
      receiver: EMPTY_RECEIVER,
      saveReceiver: true,
      payment: initialPayment(customer?.lastPaymentMethod || "Cash"),
    }));
    setCurrencySource(nationalityCurrency ? `Auto · ${getCountryName(customer.nationality)} nationality` : null);
    setErrors((prev) => ({ ...prev, customer: "", currency: "" }));
    setNewCustomerText(null);
  };

  const selectReceiver = (r) => {
    if (!r) {
      setForm((prev) => ({ ...prev, beneficiary: "new", receiver: EMPTY_RECEIVER, saveReceiver: true }));
      return;
    }
    // Receiver এর নিজের Currency (আজকের Rate থাকলে) — Nationality র চেয়ে বেশি নির্দিষ্ট, তাই এটাই আগে
    const receiverCurrency = r.currency?._id && board.some((b) => b.currency._id === r.currency._id) ? r.currency : null;
    setForm((prev) => ({
      ...withCurrency(prev, receiverCurrency?._id || prev.currency),
      beneficiary: r._id,
      receiver: { name: r.name, bankName: r.bankName || "", accountNumber: r.accountNumber || "", bankBranch: r.bankBranch || "" },
      saveReceiver: false,
    }));
    if (receiverCurrency) setCurrencySource(`Auto · ${r.name}'s usual currency`);
    setErrors((prev) => ({ ...prev, receiverName: "" }));
  };

  const setReceiverField = (name, value) => {
    setForm((prev) => ({ ...prev, receiver: { ...prev.receiver, [name]: value } }));
    if (name === "name") setErrors((prev) => ({ ...prev, receiverName: "" }));
  };

  const savedReceiver = receivers.find((r) => r._id === form.beneficiary);
  const receiverEdited =
    savedReceiver &&
    (form.receiver.name !== savedReceiver.name ||
      form.receiver.bankName !== (savedReceiver.bankName || "") ||
      form.receiver.accountNumber !== (savedReceiver.accountNumber || "") ||
      form.receiver.bankBranch !== (savedReceiver.bankBranch || ""));

  const handleClose = () => {
    setForm(initialState());
    setErrors({});
    setNewCustomerText(null);
    setShowAccounts(false);
    setCurrencySource(null);
    setRequestId(crypto.randomUUID());
    onClose();
  };

  // ---------- কিছু না থাকলে কী করতে হবে (Setup Hint) ----------
  const loaded = Boolean(bankData && accountData);
  const paymentHints = !loaded ? {} : {
    Cash: cashDrawers.length === 0 ? (
      <SetupNotice compact message="No cash drawer yet." actionLabel="Add cash drawer" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin to add one." onNavigate={handleClose} />
    ) : mySession?.status === "PendingApproval" ? (
      <SetupNotice compact message="Your last session is waiting for manager approval — cash can't be taken yet." actionLabel="View report" href={`/pos/cash/session/${mySession._id}`} onNavigate={handleClose} />
    ) : !isSessionOpen ? (
      <SetupNotice compact message="Open your cashier session to take cash." actionLabel="Open session" href="/pos" permission="cashierSession:create" onNavigate={handleClose} />
    ) : undefined,
    Bank: banks.length === 0 ? (
      <SetupNotice compact message="No bank account yet." actionLabel="Add bank account" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin to add one." onNavigate={handleClose} />
    ) : undefined,
    Credit: receivableAccounts.length === 0 ? (
      <SetupNotice compact message="No receivable account yet." actionLabel="Create in Chart of Accounts" href="/accounts" permission="account:create" adminHint="Ask your admin to create one." onNavigate={handleClose} />
    ) : undefined,
  };

  // Currency র Hint — কেন নিজে থেকে বসল, অথবা Nationality র দেশের Currency তে আজ Rate নেই
  const nationalityCode = selectedCustomer?.nationality;
  const nationalityHasNoRate =
    nationalityCode && !board.some((b) => b.currency.country === nationalityCode) && (boardData?.data || []).some((b) => b.currency.country === nationalityCode);
  const currencyHint = currencySource && currency
    ? currencySource
    : nationalityHasNoRate
      ? `${getCountryName(nationalityCode)}'s currency has no send rate today`
      : undefined;
  const missingAccounts = loaded && (liabilityAccounts.length === 0 || incomeAccounts.length === 0);

  const validate = () => {
    const e = {};
    if (!form.customer) e.customer = "Select or add a customer";
    if (!form.receiver.name.trim()) e.receiverName = "Enter the receiver's name";
    if (!form.currency) e.currency = "Choose a currency";
    if (!(foreignAmount > 0)) e.amount = "Enter the amount";
    if (customerFee < 0) e.customerFee = "Cannot be negative";
    if (supplierFeeOverridden && Number(form.supplierFee) < 0) e.supplierFee = "Cannot be negative";
    if (!supplierId) e.supplier = currency && suppliers.length > 0 ? `No supplier has a ${currency.code} rate yet — ask your admin to set one` : "Choose a supplier";
    else if (currency && boardRow?.sendSuppliers && !rateSupplierIds.has(supplierId) && !supplierOverridden)
      e.supplier = `${selectedSupplier?.name || "This supplier"} has no ${currency.code} rate — choose another supplier`;
    if (!supplierPayableAccount || !profitAccount) e.accounts = "Supplier payable and remittance income accounts are required";
    if (customerTotal > 0) Object.assign(e, validatePayment(form.payment, payment, paymentDefaults));
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

    // কোন Button চাপা হয়েছে — State এ রাখলে Submit এর মুহূর্তে পুরনো মান পড়ে
    const postNow = (event.nativeEvent?.submitter?.dataset?.mode || "post") === "post";
    setSubmitMode(postNow ? "post" : "draft");
    try {
      const res = await createSend({
        customer: form.customer,
        beneficiary: form.beneficiary !== "new" ? form.beneficiary : undefined,
        receiver: form.receiver,
        saveReceiver: form.beneficiary === "new" && form.saveReceiver,
        updateReceiver: Boolean(savedReceiver && receiverEdited && form.saveReceiver),
        currency: form.currency,
        foreignAmount,
        customerFee,
        ...(isRateOverridden ? { customerRate: rate } : {}),
        supplier: supplierId,
        ...(supplierFeeOverridden ? { supplierFee } : {}),
        ...(canOverrideRate && Number(form.supplierRateOverride) > 0 ? { supplierRate: Number(form.supplierRateOverride) } : {}),
        payments: payment.payments.map(({ method, account, amount, tendered }) => ({ method, account, amount, tendered })),
        receivableAccount: payment.receivableAccount || undefined,
        supplierPayableAccount,
        profitAccount,
        postNow,
        clientRequestId: requestId,
      }).unwrap();
      const send = res.data;
      handleClose();
      if (postNow) {
        toast.success(`${send.sendNumber} confirmed`);
        router.push(`/pos/send/${send._id}/receipt`);
      } else {
        toast.success(`${send.sendNumber} saved as draft`);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create send");
    }
  };

  const currencyOptions = board.map((b) => ({
    value: b.currency._id,
    label: b.currency.code,
    // Code, নাম বা দেশ লিখে খোঁজা যায়
    sub: [b.currency.name, b.currency.country && getCountryName(b.currency.country), describeRate(b.sendRate, b.currency), describeInverse(b.sendRate, b.currency)].filter(Boolean).join(" · "),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Send"
      description="Remittance to an overseas receiver"
      size="2xl"
      footer={
        <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* ছোট Screen এ Summary নিচে চলে যায় — তাই মোট টাকাটা Button এর পাশেই */}
          <div className="flex items-baseline justify-between gap-3 lg:hidden">
            <span className="text-[13px] text-slate-500">{form.payment.method === "Credit" ? "To collect later" : "Customer pays"}</span>
            <span className="text-lg font-semibold tabular-nums text-slate-900">{formatMoney(customerTotal)}</span>
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
            <FormSection step={1} title="Sender (customer)">
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
                    id="sendCustomer"
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
                      {selectedCustomer.nationality ? (
                        <span>{getCountryName(selectedCustomer.nationality)}</span>
                      ) : (
                        <span className="text-slate-400">Nationality not set</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </FormSection>

            {/* ② Receiver */}
            {form.customer && (
              <FormSection step={2} title="Receiver" description={receivers.length ? "Choose a saved receiver or add a new one" : undefined}>
                <ReceiverPicker receivers={receivers} value={form.beneficiary} onSelect={selectReceiver} isLoading={isReceiversLoading && receivers.length === 0} />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input id="receiverName" label="Receiver name" required value={form.receiver.name} onChange={(e) => setReceiverField("name", e.target.value)} error={errors.receiverName} />
                  <Input id="receiverBank" label="Bank / wallet" placeholder="e.g. Sonali Bank, bKash" value={form.receiver.bankName} onChange={(e) => setReceiverField("bankName", e.target.value)} />
                  <Input id="receiverAccount" label="Account / wallet no." value={form.receiver.accountNumber} onChange={(e) => setReceiverField("accountNumber", e.target.value)} />
                  <Input id="receiverBranch" label="Branch" value={form.receiver.bankBranch} onChange={(e) => setReceiverField("bankBranch", e.target.value)} />
                </div>
                {(form.beneficiary === "new" || receiverEdited) && (
                  <label className="mt-3 flex items-center gap-2.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.saveReceiver}
                      onChange={(e) => setField("saveReceiver", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {receiverEdited ? (
                      <span className="flex items-center gap-1.5">
                        <Pencil className="h-3.5 w-3.5 text-slate-400" />
                        Update this saved receiver with the new details
                      </span>
                    ) : (
                      "Save this receiver for next time"
                    )}
                  </label>
                )}
              </FormSection>
            )}

            {/* ③ Amount */}
            <FormSection step={form.customer ? 3 : 2} title="Amount">
              {boardData && board.length === 0 && (
                <SetupNotice
                  className="mb-3"
                  message={
                    (boardData?.data || []).length === 0
                      ? "No currencies are active yet, so nothing can be sent."
                      : "No send rate is set for today. Set the rate for each currency you send."
                  }
                  actionLabel={(boardData?.data || []).length === 0 ? "Add currency" : "Set today's rates"}
                  href={(boardData?.data || []).length === 0 ? "/currencies" : "/pos/rates"}
                  permission={(boardData?.data || []).length === 0 ? "currency:manage" : "rate:update"}
                  adminHint="Ask your admin to set today's rates."
                  onNavigate={handleClose}
                />
              )}
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <Combobox
                  id="sendCurrency"
                  label="Currency"
                  required
                  value={form.currency}
                  onChange={(v) => {
                    setForm((prev) => withCurrency(prev, v));
                    setErrors((prev) => ({ ...prev, currency: "" }));
                    setCurrencySource(null); // Staff নিজে বদলালে আর "Auto" না
                  }}
                  options={currencyOptions}
                  placeholder="Choose"
                  searchPlaceholder="Code, name or country…"
                  emptyText="No currency has a send rate"
                  error={errors.currency}
                  hint={currencyHint}
                />
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
                  <Input
                    id="foreignAmount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    label="Receiver gets"
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
                    id="myrAmount"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    label="In MYR"
                    prefix="RM"
                    value={form.amountMode === "myr" ? form.myrInput : amountMYR ? String(amountMYR) : ""}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, amountMode: "myr", myrInput: e.target.value }));
                      setErrors((prev) => ({ ...prev, amount: "" }));
                    }}
                    hint="Type either side"
                    disabled={!currency}
                  />
                </div>
              </div>

              {boardRow?.checkedAt && !isBusinessToday(boardRow.checkedAt) && (
                <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  The {currency.code} rate was last checked {timeAgo(boardRow.checkedAt)}, not today — make sure it is still correct.
                </p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {canOverrideRate ? (
                  <Input
                    id="sendRate"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    label={`Rate${currency ? ` (${rateUnitLabel(currency)})` : ""}`}
                    placeholder={boardRow ? String(boardRow.sendRate) : ""}
                    value={form.rateOverride}
                    onChange={(e) => setField("rateOverride", e.target.value)}
                    hint={
                      isRateOverridden
                        ? `${describeInverse(rate, currency)} · board is ${describeRate(boardRow?.sendRate, currency)}`
                        : boardRow
                          ? `Board rate · ${describeRate(boardRow.sendRate, currency)} · ${describeInverse(boardRow.sendRate, currency)}`
                          : "Choose a currency"
                    }
                    disabled={!currency}
                  />
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium text-slate-700">Rate</span>
                    <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm">
                      <span className="font-medium tabular-nums text-slate-900">{boardRow ? describeRate(boardRow.sendRate, currency) : "—"}</span>
                      <Lock className="h-3.5 w-3.5 text-slate-400" aria-label="Set by admin" />
                    </div>
                    <span className="text-xs text-slate-500">{boardRow ? `${describeInverse(boardRow.sendRate, currency)} · set by admin` : "Today's rate, set by admin"}</span>
                  </div>
                )}
                <Input
                  id="customerFee"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  label="Service fee"
                  prefix="RM"
                  value={form.customerFee}
                  onChange={(e) => setField("customerFee", e.target.value)}
                  error={errors.customerFee}
                />
              </div>
            </FormSection>

            {/* ④ Payment received — Customer কীভাবে দিলেন */}
            <FormSection step={form.customer ? 4 : 3} title="Payment received" description="How the customer is paying for this send">
              <CustomerPaymentSection
                value={form.payment}
                onChange={(next) => {
                  setForm((prev) => ({ ...prev, payment: next }));
                  setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !PAYMENT_ERROR_KEYS.includes(k) && !k.startsWith("line-"))));
                }}
                total={customerTotal}
                resolved={payment}
                options={paymentOptions}
                defaults={paymentDefaults}
                errors={errors}
                hints={paymentHints}
                customer={selectedCustomer}
              />
            </FormSection>

            {/* ⑤ Supplier — কাকে দিয়ে পাঠানো হবে */}
            <FormSection step={form.customer ? 5 : 4} title="Supplier">
              <div className="grid gap-4 sm:grid-cols-2">
                <Combobox
                  id="sendSupplier"
                  label="Supplier"
                  required
                  value={supplierId}
                  onChange={(v) => {
                    setForm((prev) => ({ ...prev, supplier: v, supplierFor: prev.currency }));
                    setErrors((prev) => ({ ...prev, supplier: "" }));
                  }}
                  options={supplierOptions}
                  placeholder={currency ? "Choose supplier" : "Choose a currency first"}
                  emptyText="No suppliers yet"
                  error={errors.supplier}
                  hint={
                    vendorData && suppliers.length === 0 ? (
                      <SetupNotice compact message="No suppliers yet." actionLabel="Add supplier" href="/vendor" permission="vendor:create" adminHint="Ask your admin to add one." onNavigate={handleClose} />
                    ) : currency && supplierId && !rateSupplierIds.has(supplierId) && !supplierOverridden ? (
                      <SetupNotice compact message={`No ${currency.code} rate for this supplier.`} actionLabel="Set supplier rate" href="/pos/rates" permission="rate:update" adminHint="Choose another supplier." onNavigate={handleClose} />
                    ) : canSeeCost && supplierRateRow ? (
                      // Admin — Supplier এর Rate দুই দিকে আর প্রতি RM 1,000 এ লাভ
                      <span className="flex flex-col gap-0.5">
                        <span>
                          Supplier gives <RateDisplay inline rate={supplierRateRow.rate} currency={currency} />
                        </span>
                        <ProfitPerThousand value={profitPerThousand(rate, supplierRate, currency.quoteStyle)} />
                      </span>
                    ) : !isSupplierPicked && supplierId && rateSuppliers.length > 1 ? (
                      `Auto · best rate for ${currency.code}`
                    ) : undefined
                  }
                />
              </div>

              {missingAccounts && (
                <SetupNotice
                  className="mt-4"
                  message="A supplier payable (liability) and a remittance income account are needed to record sends."
                  actionLabel="Open Chart of Accounts"
                  href="/accounts"
                  permission="account:create"
                  adminHint="Ask your admin to create them."
                  onNavigate={handleClose}
                />
              )}

              {canSeeCost && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAccounts((v) => !v)}
                    aria-expanded={showAccounts}
                    className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800"
                  >
                    <Settings2 className="h-4 w-4" />
                    {showAccounts ? "Hide" : "Show"} cost & accounting (admin)
                  </button>
                  {showAccounts && (
                    <div className="mt-3 grid gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2">
                      <Input
                        id="supplierRateOverride"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        label={`Supplier rate${currency ? ` (${rateUnitLabel(currency)})` : ""}`}
                        placeholder={supplierRateRow ? String(supplierRateRow.rate) : "Not set"}
                        value={form.supplierRateOverride}
                        onChange={(e) => setField("supplierRateOverride", e.target.value)}
                        hint={supplierOverridden && currency ? describeInverse(form.supplierRateOverride, currency) : "Leave empty to use the saved supplier rate"}
                      />
                      <Input
                        id="supplierFee"
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        label="Supplier fee"
                        prefix="RM"
                        placeholder={String(Number(supplierRateRow?.fee) || 0)}
                        value={form.supplierFee}
                        onChange={(e) => setField("supplierFee", e.target.value)}
                        error={errors.supplierFee}
                        hint="Leave empty to use the saved supplier fee"
                        disabled={!canOverrideRate}
                      />
                      <Combobox id="supplierPayable" label="Supplier payable account" value={supplierPayableAccount} onChange={(v) => setField("supplierPayableAccount", v)} options={toAccountOptions(liabilityAccounts)} />
                      <Combobox id="profitAccount" label="Remittance income account" value={profitAccount} onChange={(v) => setField("profitAccount", v)} options={toAccountOptions(incomeAccounts)} error={errors.accounts} />
                    </div>
                  )}
                </div>
              )}
            </FormSection>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-0 lg:self-start">
            <SummaryPanel
              title="Summary"
              rows={[
                { label: "Receiver gets", value: currency ? `${currency.code} ${formatNumber(foreignAmount, decimals)}` : "—" },
                { label: "Rate", value: currency && rate ? <RateDisplay rate={rate} currency={currency} className="items-end" /> : "—", muted: !rate },
                { label: "Amount", value: formatMoney(amountMYR) },
                { label: "Service fee", value: `+ ${formatMoney(customerFee)}`, muted: customerFee === 0 },
                { label: "Customer pays", value: formatMoney(customerTotal), emphasis: true },
                payment.paidNow > 0 && payment.onCredit > 0 && { label: "Paid now", value: formatMoney(payment.paidNow) },
                payment.onCredit > 0 && { label: "On credit", value: formatMoney(payment.onCredit) },
                payment.change > 0 && { label: "Change to give", value: formatMoney(payment.change) },
                canSeeCost && supplierTotal > 0 && { label: "Supplier cost", value: `− ${formatMoney(supplierTotal)}` },
                canSeeCost && supplierTotal > 0 && { label: "Profit", value: formatMoney(profit), tone: "profit", rawValue: profit },
                canSeeCost && supplierTotal > 0 && { label: "· from rate", value: formatMoney(rateProfit), muted: true },
                canSeeCost && supplierTotal > 0 && { label: "· from fees", value: formatMoney(feeProfit), muted: true },
              ]}
              footer={
                isRateOverridden
                  ? "Rate differs from today's board — this will be recorded."
                  : canSeeCost && supplierTotal > 0 && profit < 0
                    ? "Warning: this send is at a loss."
                    : "Confirm posts the send and opens the receipt."
              }
            />
          </aside>
        </div>
      </form>
    </Modal>
  );
};

export default SendFormModal;
