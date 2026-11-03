"use client";
import { useState } from "react";
import Link from "next/link";
import { Gift, ReceiptText, Settings2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";
import { useCancelOtherIncomeMutation, useGetAllOtherIncomesQuery, useGetIncomeTypesQuery, usePostOtherIncomeMutation } from "@/redux/features/pos/otherIncomeApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import OtherIncomeFormModal from "@/compoent/pos/OtherIncomeFormModal";
import IncomeTypesModal from "@/compoent/pos/IncomeTypesModal";
import { PaymentMethodBadge } from "@/compoent/send/SendDetailModal";
import Badge from "@/compoent/ui/Badge";
import Select from "@/compoent/ui/Select";
import { DocCell, MoneyCell, PartyCell, STATUS_VARIANT, TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "number", label: "No." },
  { key: "type", label: "Type / Customer" },
  { key: "bill", label: "Bill", align: "right" },
  { key: "cost", label: "Cost", align: "right" },
  { key: "profit", label: "Profit", align: "right" },
];
const PAYMENT_METHOD_FILTERS = [
  { value: "", label: "Any method" },
  { value: "Cash", label: "Cash" },
  { value: "Bank", label: "Bank" },
  { value: "Credit", label: "Credit" },
  { value: "Split", label: "Split" },
];
const DUE_FILTERS = (dueLabel) => [
  { value: "", label: "Any" },
  { value: "Due", label: dueLabel },
  { value: "Paid", label: "Fully paid" },
];

/** বিল — কত, কীভাবে পাওয়া, বাকি আছে কিনা */
const BillCell = ({ r }) => (
  <td className={`${TD} text-right`}>
    <p className="whitespace-nowrap font-semibold tabular-nums text-slate-900">{formatMoney(r.sellAmount)}</p>
    <div className="mt-1 flex flex-wrap items-center justify-end gap-1.5">
      {r.paymentMethod && <PaymentMethodBadge method={r.paymentMethod} />}
      {r.status === "Posted" && r.paymentStatus !== "Paid" && (
        <Badge variant={STATUS_VARIANT[r.paymentStatus] || "neutral"} dot={false}>
          To collect {formatMoney(r.dueAmount)}
        </Badge>
      )}
    </div>
  </td>
);

/** খরচ — মোট, আর Supplier কে দেওয়া বাকি থাকলে */
const CostCell = ({ r }) => {
  const total = Number(r.costAmount || 0) + Number(r.otherCost || 0);
  return (
    <td className={`${TD} text-right`}>
      <p className="whitespace-nowrap tabular-nums text-slate-700">{formatMoney(total)}</p>
      {r.status === "Posted" && r.supplierDueAmount > 0 && <p className="mt-0.5 text-xs text-amber-700">To pay {r.supplier?.name || "supplier"} {formatMoney(r.supplierDueAmount)}</p>}
    </td>
  );
};

const IncomeFilters = ({ filters, types }) => {
  const field = (key, label, options, width = "w-40") => (
    <Select id={`income-${key}`} label={label} value={filters.extra[key] || ""} onChange={(e) => filters.setExtra(key, e.target.value)} className={width}>
      {options.map((o) => (
        <option key={o.value || "any"} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
  return (
    <>
      {field("incomeType", "Type", [{ value: "", label: "All types" }, ...types.map((t) => ({ value: t._id, label: t.name }))], "w-48")}
      {field("paymentMethod", "Paid by", PAYMENT_METHOD_FILTERS)}
      {field("customerPayment", "Customer payment", DUE_FILTERS("To collect"))}
      {field("supplierPayment", "Supplier payment", DUE_FILTERS("To pay"))}
    </>
  );
};

const OtherIncomeListPage = () => {
  const { hasPermission } = useAuth();
  const canManageTypes = hasPermission("otherIncome:types");
  const { data: typeData } = useGetIncomeTypesQuery();
  const types = typeData?.data || [];
  const [typesOpen, setTypesOpen] = useState(false);

  return (
    <>
      {canManageTypes && (
        <div className="flex justify-end px-4 pt-4 sm:px-6 lg:px-8 print:hidden">
          <button type="button" onClick={() => setTypesOpen(true)} className="flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-800">
            <Settings2 className="h-4 w-4" />
            Income types
          </button>
        </div>
      )}
      <DocumentListPage
        title="Other Income"
        description="Air tickets, visa, bill payments and other services — with cost and profit"
        newLabel="New Income"
        icon={Gift}
        emptyTitle="No other income yet"
        emptyDescription="Record tickets, visas or bills you sell to customers."
        searchPlaceholder="No., type, description, customer…"
        useListQuery={useGetAllOtherIncomesQuery}
        usePostMutation={usePostOtherIncomeMutation}
        useCancelMutation={useCancelOtherIncomeMutation}
        socketModule="OtherIncome"
        entityType="OtherIncome"
        numberField="incomeNumber"
        cancelPermission="otherIncome:delete"
        // বিলের সময় পাওয়া টাকা Cancel এ ফেরত যায়; আটকায় পরে Payment In বা Supplier কে Payment Out হলে
        canCancelRecord={(r) => {
          if (r.status === "Cancelled") return false;
          if (r.status !== "Posted") return true;
          if (r.supplierPaidAmount > 0) return false;
          const upfront = (r.customerPayments || []).reduce((sum, p) => sum + p.amount, 0);
          const isLegacy = !r.customerPayments?.length && !r.customerReceivableAccount;
          return isLegacy ? r.paymentTerm !== "Credit" || r.paidAmount === 0 : r.paidAmount <= upfront + 0.001;
        }}
        postDescription="This posts the bill and its costs to the books."
        FormModal={OtherIncomeFormModal}
        manualApply
        renderFilters={(filters) => <IncomeFilters filters={filters} types={types} />}
        renderExtraActions={(r) =>
          r.status !== "Draft" && (
            <Link
              href={`/pos/other-income/${r._id}/receipt`}
              title="View bill"
              aria-label={`Bill for ${r.incomeNumber}`}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <ReceiptText className="h-4 w-4" />
              Bill
            </Link>
          )
        }
        columns={COLUMNS}
        renderCells={(r) => (
          <>
            <DocCell number={r.incomeNumber} date={r.date} />
            <PartyCell name={r.incomeType} sub={[r.customer?.name || "Walk-in", r.description].filter(Boolean).join(" · ")} />
            <BillCell r={r} />
            <CostCell r={r} />
            <MoneyCell value={r.profitAmount} tone="profit" />
          </>
        )}
      />
      {canManageTypes && <IncomeTypesModal isOpen={typesOpen} onClose={() => setTypesOpen(false)} />}
    </>
  );
};

export default OtherIncomeListPage;
