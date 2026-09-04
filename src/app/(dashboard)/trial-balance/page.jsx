"use client";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetTrialBalanceQuery } from "@/redux/features/ledger/ledgerApi";
import BranchSelector from "@/compoent/ui/BranchSelector";
import Table from "@/compoent/ui/Table";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Badge from "@/compoent/ui/Badge";


const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Account" },
  { key: "type", label: "Type" },
  { key: "debit", label: "Debit" },
  { key: "credit", label: "Credit" },
];

const TrialBalancePage = () => {
  const { hasPermission } = useAuth();
  const [branch, setBranch] = useState("");
  const canFilterByBranch = hasPermission("cashierSession:manage");

  const { data, isLoading, refetch } = useGetTrialBalanceQuery({ branch: branch || undefined });

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Journal") refetch();
  });

  const report = data?.data;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Trial Balance</h1>
        {report && !report.isPartial && (
          <Badge variant={report.isBalanced ? "success" : "danger"}>
            {report.isBalanced ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Balanced
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> Not Balanced
              </span>
            )}
          </Badge>
        )}
      </div>

      {canFilterByBranch && (
        <div className="mb-4 w-56">
          <BranchSelector branch={branch} onBranchChange={setBranch} />
        </div>
      )}

      {report?.isPartial && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This is a <span className="font-semibold">partial view</span> showing only this branch&apos;s ledger movement — not
            the complete company-wide balance.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <Table columns={COLUMNS}>
          {report?.rows?.map((row) => (
            <tr key={row.accountId} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-500">{row.code}</td>
              <td className="px-4 py-3 text-slate-700">{row.name}</td>
              <td className="px-4 py-3 text-slate-500">{row.type}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                {row.debit > 0 ? `৳ ${row.debit.toFixed(2)}` : "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                {row.credit > 0 ? `৳ ${row.credit.toFixed(2)}` : "—"}
              </td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-bold">
            <td className="px-4 py-3" colSpan={3}>
              Total
            </td>
            <td className="px-4 py-3 text-right tabular-nums">৳ {report?.totalDebit?.toFixed(2)}</td>
            <td className="px-4 py-3 text-right tabular-nums">৳ {report?.totalCredit?.toFixed(2)}</td>
          </tr>
        </Table>
      )}
    </div>
  );
};

export default TrialBalancePage;