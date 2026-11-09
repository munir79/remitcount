"use client";
import Link from "next/link";
import { ArrowUpCircle, ReceiptText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";
import { describeRate } from "@/lib/currencyMath";
import { useCancelSellCurrencyMutation, useGetAllSellCurrencyQuery, usePostSellCurrencyMutation } from "@/redux/features/pos/sellCurrencyApi";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import SellCurrencyFormModal from "@/compoent/pos/SellCurrencyFormModal";
import { PaymentMethodBadge } from "@/compoent/send/SendDetailModal";
import Badge from "@/compoent/ui/Badge";
import Select from "@/compoent/ui/Select";
import { DocCell, ForeignAmountCell, MoneyCell, PartyCell, STATUS_VARIANT, TD } from "@/compoent/ui/TableCells";

const PAYMENT_METHOD_FILTERS = [
  { value: "", label: "Any method" },
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "Credit", label: "Credit" },
  { value: "Split", label: "Split" },
];
const PAYMENT_STATUS_FILTERS = [
  { value: "", label: "Any" },
  { value: "Due", label: "To collect" },
  { value: "Paid", label: "Fully paid" },
];

/** Customer কত দিলেন, কীভাবে, কোন Drawer / Bank এ, আর বাকি আছে কিনা */
const CustomerPaidCell = ({ r }) => {
  const showStatus = r.status === "Posted" && r.paymentStatus !== "Paid";
  const accountNames = (r.customerPayments || []).map((p) => p.account?.name).filter(Boolean).join(" + ");
  return (
    <td className={`${TD} text-right`}>
      <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatMoney(r.totalAmountMYR)}</p>
      <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
        {r.paymentMethod && <PaymentMethodBadge method={r.paymentMethod} />}
        {showStatus && (
          <Badge variant={STATUS_VARIANT[r.paymentStatus] || "neutral"} dot={false}>
            To collect {formatMoney(r.dueAmount)}
          </Badge>
        )}
      </div>
      {accountNames && <p className="mt-0.5 truncate text-[11px] text-slate-400">{accountNames}</p>}
    </td>
  );
};

const SellFilters = ({ filters, currencies }) => {
  const field = (key, label, options, width = "w-40") => (
    <Select id={`sell-${key}`} label={label} value={filters.extra[key] || ""} onChange={(e) => filters.setExtra(key, e.target.value)} className={width}>
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
      {field("paymentMethod", "Paid by", PAYMENT_METHOD_FILTERS)}
      {field("customerPayment", "Customer payment", PAYMENT_STATUS_FILTERS)}
    </>
  );
};

const SellCurrencyListPage = () => {
  const { hasPermission } = useAuth();
  const canSeeCost = hasPermission("rate:update"); // লাভ — শুধু Admin
  const { data: boardData } = useGetRateBoardQuery();
  const currencies = (boardData?.data || []).map((b) => b.currency);

  const columns = [
    { key: "number", label: "Sell No." },
    { key: "customer", label: "Customer" },
    { key: "amount", label: "Sold", align: "right" },
    { key: "paid", label: "Customer paid", align: "right" },
    ...(canSeeCost ? [{ key: "profit", label: "Profit", align: "right" }] : []),
  ];

  return (
    <DocumentListPage
      exportType="sell"
      title="Sell Currency"
      description="Foreign currency sold to customers — the notes come out of the cashier's drawer"
      newLabel="New Sell"
      icon={ArrowUpCircle}
      emptyTitle="No currency sales yet"
      emptyDescription="Record your first sale of foreign currency to a customer."
      searchPlaceholder="Sell no, customer, phone…"
      useListQuery={useGetAllSellCurrencyQuery}
      usePostMutation={usePostSellCurrencyMutation}
      useCancelMutation={useCancelSellCurrencyMutation}
      socketModule="SellCurrency"
      entityType="SellCurrency"
      numberField="sellNumber"
      cancelPermission="currencyStock:delete"
      // Sell এর সময় পাওয়া টাকা Cancel এ ফেরত যায়; আটকায় শুধু পরে Payment In হলে
      canCancelRecord={(r) => {
        if (r.status === "Cancelled") return false;
        if (r.status !== "Posted") return true;
        const upfront = (r.customerPayments || []).reduce((sum, p) => sum + p.amount, 0);
        return r.valueMYR == null ? r.paymentTerm !== "Credit" || r.paidAmount === 0 : r.paidAmount <= upfront + 0.001;
      }}
      postDescription="This takes the notes out of the drawer and updates currency stock and account balances."
      FormModal={SellCurrencyFormModal}
      manualApply
      renderFilters={(filters) => <SellFilters filters={filters} currencies={currencies} />}
      renderExtraActions={(r) =>
        r.status !== "Draft" && (
          <Link
            href={`/pos/sell-currency/${r._id}/receipt`}
            title="View receipt"
            aria-label={`Receipt for ${r.sellNumber}`}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            <ReceiptText className="h-4 w-4" />
            Receipt
          </Link>
        )
      }
      columns={columns}
      renderCells={(r) => {
        const currency = { code: r.currencyCode || r.currencyStock?.currencyCode, quoteStyle: r.quoteStyle };
        return (
          <>
            <DocCell number={r.sellNumber} date={r.date} />
            <PartyCell name={r.customer?.name} sub={r.holdingDrawer?.name && `From ${r.holdingDrawer.name}`} />
            <ForeignAmountCell value={r.foreignAmount} currency={currency.code} sub={r.quoteStyle ? describeRate(r.rate, currency) : undefined} />
            <CustomerPaidCell r={r} />
            {canSeeCost && <MoneyCell value={r.profitAmount} tone="profit" />}
          </>
        );
      }}
    />
  );
};

export default SellCurrencyListPage;
