"use client";
import { useState } from "react";
import Link from "next/link";
import { BookOpenText, Briefcase, Clock, Receipt, ReceiptText, Settings2, Truck, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";
import { useCancelPosExpenseMutation, useGetAllPosExpensesQuery, useGetExpenseTypesQuery, usePostPosExpenseMutation } from "@/redux/features/pos/posExpenseApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import PosExpenseFormModal from "@/compoent/pos/PosExpenseFormModal";
import ExpenseTypesModal from "@/compoent/pos/ExpenseTypesModal";
import Badge from "@/compoent/ui/Badge";
import Select from "@/compoent/ui/Select";
import StatCard from "@/compoent/ui/StatCard";
import { DocCell, MoneyCell, PartyCell, TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "number", label: "No." },
  { key: "type", label: "Expense" },
  { key: "classification", label: "Class" },
  { key: "paidFrom", label: "Paid from" },
  { key: "amount", label: "Amount", align: "right" },
];

const ExpenseFilters = ({ filters, types }) => {
  const field = (key, label, options, width = "w-40") => (
    <Select id={`expense-${key}`} label={label} value={filters.extra[key] || ""} onChange={(e) => filters.setExtra(key, e.target.value)} className={width}>
      {options.map((o) => (
        <option key={o.value || "any"} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
  return (
    <>
      {field("expenseType", "Type", [{ value: "", label: "All types" }, ...types.map((t) => ({ value: t._id, label: t.name }))], "w-48")}
      {field("classification", "Class", [
        { value: "", label: "Admin & Direct" },
        { value: "Admin", label: "Admin" },
        { value: "Direct", label: "Direct" },
      ])}
      {field("paymentMethod", "Paid by", [
        { value: "", label: "Cash & Bank" },
        { value: "Cash", label: "Cash" },
        { value: "Bank", label: "Bank" },
      ])}
      {field("approval", "Approval", [
        { value: "", label: "Any" },
        { value: "Waiting", label: "Waiting approval" },
      ])}
    </>
  );
};

const ExpenseSummary = ({ summary }) => (
  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <StatCard label="Admin expenses" value={formatMoney(summary.admin)} icon={Briefcase} tone="indigo" hint="Rent, salaries, bills…" />
    <StatCard label="Direct expenses" value={formatMoney(summary.direct)} icon={Truck} tone="sky" hint="Cost of transactions" />
    <StatCard label="Total" value={formatMoney(summary.total)} icon={Wallet} tone="rose" hint={`${summary.count} confirmed · drafts & cancelled not counted`} />
    <StatCard
      label="Waiting approval"
      value={summary.waitingApproval.toLocaleString("en-MY")}
      icon={Clock}
      tone={summary.waitingApproval > 0 ? "amber" : "slate"}
      hint="Above the cashier limit"
    />
  </div>
);

const ExpenseListPage = () => {
  const { user, hasPermission } = useAuth();
  const canManageTypes = hasPermission("posExpense:types");
  const canApprove = hasPermission("posExpense:approve");
  const { data: typeData } = useGetExpenseTypesQuery();
  const types = typeData?.data || [];
  const [typesOpen, setTypesOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end gap-4 px-4 pt-4 sm:px-6 lg:px-8 print:hidden">
        <Link href="/pos/expense/ledger" className="flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-800">
          <BookOpenText className="h-4 w-4" />
          Expense ledger
        </Link>
        {canManageTypes && (
          <button type="button" onClick={() => setTypesOpen(true)} className="flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-800">
            <Settings2 className="h-4 w-4" />
            Expense types
          </button>
        )}
      </div>
      <DocumentListPage
        exportType="expense"
        title="Expenses"
        description="Admin and direct expenses — paid by cash or bank"
        newLabel="New Expense"
        icon={Receipt}
        emptyTitle="No expenses yet"
        emptyDescription="Record rent, salaries, utilities and other costs."
        searchPlaceholder="No., type, description, paid to…"
        useListQuery={useGetAllPosExpensesQuery}
        usePostMutation={usePostPosExpenseMutation}
        useCancelMutation={useCancelPosExpenseMutation}
        socketModule="PosExpense"
        entityType="PosExpense"
        numberField="expenseNumber"
        cancelPermission="posExpense:delete"
        canCancelRecord={(r) => r.status !== "Cancelled"}
        // সীমার বেশি → শুধু Admin / Manager; Cashier শুধু নিজের Draft
        canPostRecord={(r) => canApprove || (!r.awaitingApproval && (r.createdBy?._id || r.createdBy) === user?._id)}
        renderStatusExtra={(r) =>
          r.status === "Draft" &&
          r.awaitingApproval && (
            <Badge variant="warning" dot={false}>
              Waiting approval
            </Badge>
          )
        }
        postDescription="This takes the money out of the drawer or bank and records the expense."
        FormModal={PosExpenseFormModal}
        manualApply
        renderFilters={(filters) => <ExpenseFilters filters={filters} types={types} />}
        renderSummary={(summary) => <ExpenseSummary summary={summary} />}
        renderExtraActions={(r) =>
          r.status !== "Draft" && (
            <Link
              href={`/pos/expense/${r._id}/voucher`}
              title="View voucher"
              aria-label={`Voucher for ${r.expenseNumber}`}
              className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              <ReceiptText className="h-4 w-4" />
              Voucher
            </Link>
          )
        }
        columns={COLUMNS}
        renderCells={(r) => (
          <>
            <DocCell number={r.expenseNumber} date={r.date} />
            <PartyCell name={r.expenseType} sub={[r.description, r.paidTo && `to ${r.paidTo}`].filter(Boolean).join(" · ") || r.expenseAccount?.name} />
            <td className={TD}>
              <Badge variant={r.classification === "Admin" ? "primary" : "info"} dot={false}>
                {r.classification}
              </Badge>
            </td>
            <td className={`${TD} text-slate-600`}>{r.paymentAccount?.name || "—"}</td>
            <MoneyCell value={r.amount} strong />
          </>
        )}
      />
      {canManageTypes && <ExpenseTypesModal isOpen={typesOpen} onClose={() => setTypesOpen(false)} />}
    </>
  );
};

export default ExpenseListPage;
