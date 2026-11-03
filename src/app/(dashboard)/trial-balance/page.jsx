"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Scale, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetTrialBalanceQuery } from "@/redux/features/ledger/ledgerApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatMoney, formatNumber } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import BranchSelector from "@/compoent/ui/BranchSelector";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import { TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "code", label: "Code", className: "w-24" },
  { key: "name", label: "Account" },
  { key: "debit", label: "Debit (MYR)", align: "right" },
  { key: "credit", label: "Credit (MYR)", align: "right" },
];

const TYPE_ORDER = ["Asset", "Liability", "Equity", "Income", "Expense"];

const amountCell = (value) => (value > 0 ? formatNumber(value) : <span className="text-slate-300">—</span>);

const TrialBalancePage = () => {
  const { hasPermission } = useAuth();
  const [branch, setBranch] = useState("");
  const canFilterByBranch = hasPermission("cashierSession:manage");

  const { data, isLoading, isFetching, refetch } = useGetTrialBalanceQuery({ branch: branch || undefined });

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Journal") refetch();
  });

  const report = data?.data;
  const rows = report?.rows || [];
  const difference = Math.abs(Number(report?.totalDebit || 0) - Number(report?.totalCredit || 0));

  // Account Type অনুযায়ী ভাগ — প্রতিটা ভাগের নিচে Subtotal
  const groups = TYPE_ORDER.map((type) => {
    const items = rows.filter((r) => r.type === type).sort((a, b) => String(a.code).localeCompare(String(b.code)));
    return {
      type,
      items,
      debit: items.reduce((s, r) => s + r.debit, 0),
      credit: items.reduce((s, r) => s + r.credit, 0),
    };
  }).filter((g) => g.items.length > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PrintHeader title="Trial Balance" subtitle={report?.isPartial ? "Branch movement only" : "Company-wide, as of today"} />
      <PageHeader
        title="Trial Balance"
        description="Every account's balance — total debits must equal total credits"
        actions={
          <>
            {canFilterByBranch && <BranchSelector branch={branch} onBranchChange={setBranch} label={null} className="w-52" />}
            <PrintButton />
          </>
        }
      />

      {report && !report.isPartial && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 ring-1 ring-inset ${
            report.isBalanced ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20" : "bg-rose-50 text-rose-800 ring-rose-600/20"
          }`}
        >
          {report.isBalanced ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
          <div>
            <p className="text-sm font-semibold">{report.isBalanced ? "Books are balanced" : "Books are NOT balanced"}</p>
            <p className="text-[13px] opacity-80">
              {report.isBalanced
                ? `Total debits and credits both equal ${formatMoney(report.totalDebit)}.`
                : `Difference of ${formatMoney(difference)} between debits and credits. Please check recent entries.`}
            </p>
          </div>
        </div>
      )}

      {report?.isPartial && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <span className="font-semibold">Partial view.</span> Shows only this branch&apos;s ledger movement, not the full company balance, so
            debits and credits may not match.
          </p>
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <EmptyState icon={Scale} title="No balances yet" description="Post a journal or POS transaction to see the trial balance." />
      ) : (
        <Table columns={COLUMNS} className={isFetching ? "opacity-70 transition-opacity" : ""}>
          {groups.map((group) => (
            <GroupRows key={group.type} group={group} />
          ))}
          <tr className="border-t-2 border-slate-300 bg-slate-50">
            <td className={`${TD} font-semibold text-slate-900`} colSpan={2}>
              Total
            </td>
            <td className={`${TD} text-right font-semibold tabular-nums text-slate-900`}>{formatNumber(report?.totalDebit)}</td>
            <td className={`${TD} text-right font-semibold tabular-nums text-slate-900`}>{formatNumber(report?.totalCredit)}</td>
          </tr>
        </Table>
      )}
    </div>
  );
};

const GroupRows = ({ group }) => (
  <>
    <tr className="bg-slate-50/60">
      <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {group.type}
      </td>
    </tr>
    {group.items.map((row) => (
      <tr key={row.accountId}>
        <td className={`${TD} font-mono text-xs text-slate-500`}>{row.code}</td>
        <td className={`${TD} text-slate-800`}>{row.name}</td>
        <td className={`${TD} text-right tabular-nums text-slate-700`}>{amountCell(row.debit)}</td>
        <td className={`${TD} text-right tabular-nums text-slate-700`}>{amountCell(row.credit)}</td>
      </tr>
    ))}
    <tr>
      <td className={`${TD} text-[13px] text-slate-500`} colSpan={2}>
        Total {group.type}
      </td>
      <td className={`${TD} text-right text-[13px] font-medium tabular-nums text-slate-600`}>{group.debit > 0 ? formatNumber(group.debit) : ""}</td>
      <td className={`${TD} text-right text-[13px] font-medium tabular-nums text-slate-600`}>{group.credit > 0 ? formatNumber(group.credit) : ""}</td>
    </tr>
  </>
);

export default TrialBalancePage;
