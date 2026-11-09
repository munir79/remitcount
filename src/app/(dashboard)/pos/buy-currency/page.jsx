"use client";
import Link from "next/link";
import { ArrowDownCircle, ReceiptText } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { describeRate } from "@/lib/currencyMath";
import { useCancelBuyCurrencyMutation, useGetAllBuyCurrencyQuery, usePostBuyCurrencyMutation } from "@/redux/features/pos/buyCurrencyApi";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import BuyCurrencyFormModal from "@/compoent/pos/BuyCurrencyFormModal";
import { PaymentMethodBadge } from "@/compoent/send/SendDetailModal";
import Badge from "@/compoent/ui/Badge";
import Select from "@/compoent/ui/Select";
import { DocCell, ForeignAmountCell, PartyCell, STATUS_VARIANT, TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "number", label: "Buy No." },
  { key: "customer", label: "Customer" },
  { key: "amount", label: "Bought", align: "right" },
  { key: "paid", label: "Customer got", align: "right" },
];

const PAYMENT_METHOD_FILTERS = [
  { value: "", label: "Any method" },
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "Credit", label: "Pay later" },
  { value: "Split", label: "Split" },
];
const PAYMENT_STATUS_FILTERS = [
  { value: "", label: "Any" },
  { value: "Due", label: "To pay" },
  { value: "Paid", label: "Fully paid" },
];

/** Customer কত পেলেন, কীভাবে, আর এখনো দিতে বাকি কিনা */
const CustomerGotCell = ({ r }) => {
  const showStatus = r.status === "Posted" && r.paymentStatus !== "Paid";
  const accountNames = (r.payments || []).map((p) => p.account?.name).filter(Boolean).join(" + ");
  return (
    <td className={`${TD} text-right`}>
      <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatMoney(r.totalAmountMYR)}</p>
      <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
        {r.paymentMethod && <PaymentMethodBadge method={r.paymentMethod} />}
        {showStatus && (
          <Badge variant={STATUS_VARIANT[r.paymentStatus] || "neutral"} dot={false}>
            To pay {formatMoney(r.dueAmount)}
          </Badge>
        )}
      </div>
      {accountNames && <p className="mt-0.5 truncate text-[11px] text-slate-400">{accountNames}</p>}
    </td>
  );
};

const BuyFilters = ({ filters, currencies }) => {
  const field = (key, label, options, width = "w-40") => (
    <Select id={`buy-${key}`} label={label} value={filters.extra[key] || ""} onChange={(e) => filters.setExtra(key, e.target.value)} className={width}>
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

const BuyCurrencyListPage = () => {
  const { data: boardData } = useGetRateBoardQuery();
  const currencies = (boardData?.data || []).map((b) => b.currency);

  return (
    <DocumentListPage
      exportType="buy"
      title="Buy Currency"
      description="Foreign currency bought from customers — the notes go into the cashier's drawer"
      newLabel="New Buy"
      icon={ArrowDownCircle}
      emptyTitle="No currency purchases yet"
      emptyDescription="Record your first purchase of foreign currency from a customer."
      searchPlaceholder="Buy no, customer, phone…"
      useListQuery={useGetAllBuyCurrencyQuery}
      usePostMutation={usePostBuyCurrencyMutation}
      useCancelMutation={useCancelBuyCurrencyMutation}
      socketModule="BuyCurrency"
      entityType="BuyCurrency"
      numberField="buyNumber"
      cancelPermission="currencyStock:delete"
      // Buy এর সময় দেওয়া টাকা Cancel এ ফেরত আসে; আটকায় শুধু পরে Payment Out হলে (Server ও নোট বেচা হয়ে গেলে আটকায়)
      canCancelRecord={(r) => {
        if (r.status === "Cancelled") return false;
        if (r.status !== "Posted") return true;
        const upfront = (r.payments || []).reduce((sum, p) => sum + p.amount, 0);
        return r.valueMYR == null ? r.paymentTerm !== "Credit" || r.paidAmount === 0 : r.paidAmount <= upfront + 0.001;
      }}
      postDescription="This will add the notes to the drawer and update currency stock and account balances."
      FormModal={BuyCurrencyFormModal}
      manualApply
      renderFilters={(filters) => <BuyFilters filters={filters} currencies={currencies} />}
      renderExtraActions={(r) =>
        r.status !== "Draft" && (
          <Link
            href={`/pos/buy-currency/${r._id}/receipt`}
            title="View receipt"
            aria-label={`Receipt for ${r.buyNumber}`}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            <ReceiptText className="h-4 w-4" />
            Receipt
          </Link>
        )
      }
      columns={COLUMNS}
      renderCells={(r) => {
        const currency = { code: r.currencyCode || r.currencyStock?.currencyCode, quoteStyle: r.quoteStyle };
        return (
          <>
            <DocCell number={r.buyNumber} date={r.date} />
            <PartyCell name={r.customer?.name} sub={r.drawerAccount?.name && `Notes in ${r.drawerAccount.name}`} />
            <ForeignAmountCell value={r.foreignAmount} currency={currency.code} sub={r.quoteStyle ? describeRate(r.rate, currency) : undefined} />
            <CustomerGotCell r={r} />
          </>
        );
      }}
    />
  );
};

export default BuyCurrencyListPage;
