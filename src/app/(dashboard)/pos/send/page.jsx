"use client";
import { useState } from "react";
import Link from "next/link";
import { HandCoins, ReceiptText, Send, TrendingUp, Truck, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";
import { useCancelSendMutation, useGetAllSendsQuery, usePostSendMutation } from "@/redux/features/pos/sendApi";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import { useGetAllVendorsQuery } from "@/redux/features/vendor/vendorApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import SendFormModal from "@/compoent/pos/SendFormModal";
import SendDetailModal, { getSendPayments, PaymentMethodBadge, upfrontPaid } from "@/compoent/send/SendDetailModal";
import Badge from "@/compoent/ui/Badge";
import Select from "@/compoent/ui/Select";
import StatCard from "@/compoent/ui/StatCard";
import { DocCell, ForeignAmountCell, MoneyCell, PartyCell, STATUS_VARIANT, TD } from "@/compoent/ui/TableCells";

/**
 * ✅ Customer Payment Column — কত, কীভাবে (Cash / Bank / Credit), কোন Account এ, আর Paid / Partial / Unpaid
 * (আগে Bank দিয়ে দেওয়া Send ও "Cash" দেখাত)
 */
const CustomerPaymentCell = ({ r }) => {
  const method = r.paymentMethod || r.paymentTerm || "Cash";
  const showStatus = r.status === "Posted" && (method === "Credit" || r.customerPaymentStatus !== "Paid");
  // কোন Drawer / Bank এ এসেছে — Split হলে "Cash in Hand + Maybank"
  const accountNames = getSendPayments(r)
    .map((p) => p.account?.name)
    .filter(Boolean)
    .join(" + ");
  return (
    <td className={`${TD} text-right`}>
      <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatMoney(r.customerTotalMYR)}</p>
      <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
        <PaymentMethodBadge method={method} />
        {showStatus && (
          <Badge variant={STATUS_VARIANT[r.customerPaymentStatus] || "neutral"} dot={false}>
            {r.customerPaymentStatus === "Paid" ? "Paid" : `Due ${formatMoney(r.customerDueAmount)}`}
          </Badge>
        )}
      </div>
      {accountNames && <p className="mt-0.5 truncate text-[11px] text-slate-400">{accountNames}</p>}
    </td>
  );
};

/** Supplier — নাম আর তাকে দেওয়া বাকি আছে কিনা (Rate/খরচ এখানে দেখায় না) */
const SupplierCell = ({ r }) => (
  <td className={TD}>
    <p className="font-medium text-slate-800">{r.supplier?.name || "—"}</p>
    {r.status === "Posted" && (
      <p className={`mt-0.5 text-xs ${r.supplierDueAmount > 0 ? "text-amber-700" : "text-slate-400"}`}>
        {r.supplierDueAmount > 0 ? `To pay ${formatMoney(r.supplierDueAmount)}` : "Supplier paid"}
      </p>
    )}
  </td>
);

const PAYMENT_METHOD_FILTERS = [
  { value: "", label: "Any method" },
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "Credit", label: "Credit" },
  { value: "Split", label: "Split" },
];
const PAYMENT_STATUS_FILTERS = (dueLabel) => [
  { value: "", label: "Any" },
  { value: "Due", label: dueLabel },
  { value: "Paid", label: "Fully paid" },
];

/** ✅ Send এর নিজের Filter — Currency, Supplier, Customer কীভাবে দিলেন, কার বাকি */
const SendFilters = ({ filters, currencies, suppliers }) => {
  const field = (key, label, options, width = "w-40") => (
    <Select id={`send-${key}`} label={label} value={filters.extra[key] || ""} onChange={(e) => filters.setExtra(key, e.target.value)} className={width}>
      {options.map((o) => (
        <option key={o.value || "any"} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
  return (
    <>
      {field("currency", "Currency", [{ value: "", label: "All currencies" }, ...currencies.map((c) => ({ value: c._id, label: `${c.code} — ${c.name}` }))], "w-48")}
      {field("supplier", "Supplier", [{ value: "", label: "All suppliers" }, ...suppliers.map((v) => ({ value: v._id, label: v.name }))], "w-48")}
      {field("paymentMethod", "Paid by", PAYMENT_METHOD_FILTERS)}
      {field("customerPayment", "Customer payment", PAYMENT_STATUS_FILTERS("To collect"))}
      {field("supplierPayment", "Supplier payment", PAYMENT_STATUS_FILTERS("To pay"))}
    </>
  );
};

/** ✅ Filter এর সব Send এর মোট (শুধু এই পাতার না) — Cancelled বাদ */
const SendSummary = ({ summary }) => (
  <div className={`mb-4 grid gap-3 sm:grid-cols-2 ${summary.profit !== undefined ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
    <StatCard label="Sends" value={summary.count.toLocaleString("en-MY")} icon={Send} tone="indigo" hint="Cancelled not counted" />
    <StatCard label="Total charged" value={formatMoney(summary.customerTotal)} icon={Wallet} tone="sky" hint="Sending amount + fees" />
    <StatCard
      label="To collect from customers"
      value={formatMoney(summary.customerDue)}
      icon={HandCoins}
      tone={summary.customerDue > 0 ? "amber" : "slate"}
      hint="Collect with Payment In"
    />
    <StatCard
      label="To pay suppliers"
      value={formatMoney(summary.supplierDue)}
      icon={Truck}
      tone={summary.supplierDue > 0 ? "rose" : "slate"}
      hint="Pay with Payment Out"
    />
    {summary.profit !== undefined && <StatCard label="Profit" value={formatMoney(summary.profit)} icon={TrendingUp} tone="emerald" hint="Posted sends only" />}
  </div>
);

const SendListPage = () => {
  const { hasPermission } = useAuth();
  const canSeeCost = hasPermission("rate:update"); // লাভ — শুধু Admin
  const [detailId, setDetailId] = useState(null);
  const { data: boardData } = useGetRateBoardQuery();
  const { data: vendorData } = useGetAllVendorsQuery({ limit: 200 });
  const currencies = (boardData?.data || []).map((b) => b.currency);
  const suppliers = vendorData?.data?.data || [];

  const columns = [
    { key: "number", label: "Send No." },
    { key: "customer", label: "Customer / Receiver" },
    { key: "amount", label: "Sending", align: "right" },
    { key: "payment", label: "Customer payment", align: "right" },
    { key: "supplier", label: "Supplier" },
    ...(canSeeCost ? [{ key: "profit", label: "Profit", align: "right" }] : []),
  ];

  return (
    <>
      <DocumentListPage
        exportType="send"
        title="Send"
        description="Remittance transfers — click a row to see how the customer paid, what is left to collect and to pay"
        newLabel="New Send"
        icon={Send}
        emptyTitle="No remittances yet"
        emptyDescription="Create your first send to an overseas receiver."
        searchPlaceholder="Send no, customer, phone, receiver…"
        useListQuery={useGetAllSendsQuery}
        usePostMutation={usePostSendMutation}
        useCancelMutation={useCancelSendMutation}
        socketModule="Send"
        entityType="Send"
        numberField="sendNumber"
        cancelPermission="send:delete"
        // Send এর সময় পাওয়া টাকা Cancel এ ফেরত যায়; আটকায় শুধু পরে Payment In / Supplier কে Payment Out হলে
        canCancelRecord={(r) => r.status !== "Cancelled" && !(r.status === "Posted" && r.customerPaidAmount > upfrontPaid(r) + 0.001) && r.supplierPaidAmount === 0}
        FormModal={SendFormModal}
        postDescription="This will post the remittance and update customer and supplier balances."
        onRowClick={(r) => setDetailId(r._id)}
        manualApply
        renderFilters={(filters) => <SendFilters filters={filters} currencies={currencies} suppliers={suppliers} />}
        renderSummary={(summary) => <SendSummary summary={summary} />}
        // Confirm হওয়া (Posted / Cancelled) Send এর Receipt — আবার দেখা, Print, PDF
        renderExtraActions={(r) =>
          r.status !== "Draft" && (
            <Link
              href={`/pos/send/${r._id}/receipt`}
              title="View receipt"
              aria-label={`Receipt for ${r.sendNumber}`}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <ReceiptText className="h-4 w-4" />
              Receipt
            </Link>
          )
        }
        columns={columns}
        renderCells={(r) => (
          <>
            <DocCell number={r.sendNumber} date={r.date} />
            <PartyCell
              name={r.customer?.name}
              sub={r.receiverBankDetails?.name && `→ ${r.receiverBankDetails.name}${r.receiverBankDetails.bank ? ` · ${r.receiverBankDetails.bank}` : ""}`}
            />
            <ForeignAmountCell value={r.foreignAmount} currency={r.currencyCode} />
            <CustomerPaymentCell r={r} />
            <SupplierCell r={r} />
            {canSeeCost && <MoneyCell value={r.profitAmount} tone="profit" />}
          </>
        )}
      />
      <SendDetailModal sendId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
};

export default SendListPage;
