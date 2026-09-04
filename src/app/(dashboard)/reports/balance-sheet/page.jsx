"use client";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { useGetBalanceSheetQuery } from "@/redux/features/report/reportApi";
import { useAuth } from "@/hooks/useAuth";
import Badge from "@/compoent/ui/Badge";
import Input from "@/compoent/ui/Input";
import BranchSelector from "@/compoent/ui/BranchSelector";
import Table from "@/compoent/ui/Table";


const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Account" },
  { key: "balance", label: "Balance (MYR)" },
];

const BalanceSheetPage = () => {
  const { hasPermission } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [asOfDate, setAsOfDate] = useState(today);
  const [branch, setBranch] = useState("");

  const canFilterByBranch = hasPermission("cashierSession:manage");

  const { data, isLoading, isFetching } = useGetBalanceSheetQuery({ asOfDate, branch: branch || undefined });
  const report = data?.data;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Balance Sheet</h1>
          <p className="mt-0.5 text-sm text-slate-600">Financial position as of a specific date</p>
        </div>
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

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <Input id="asOfDate" type="date" label="As of Date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="w-48" />
        {canFilterByBranch && <BranchSelector branch={branch} onBranchChange={setBranch} className="w-56" />}
      </div>

      {report?.isPartial && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This is a <span className="font-semibold">partial view</span> showing only this branch&apos;s transaction activity —
            not a complete balance snapshot (Opening Balances are company-wide and not attributable to a single branch).
          </p>
        </div>
      )}

      {isLoading || isFetching ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : !report ? (
        <p className="text-sm text-slate-500">No data available</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <p className="mb-3 text-sm font-bold text-slate-800">Assets</p>
            <Table columns={COLUMNS}>
              {report.assets.map((row) => (
                <tr key={row.accountId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{row.code}</td>
                  <td className="px-4 py-3 text-slate-700">{row.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {row.balance.toFixed(2)}</td>
                </tr>
              ))}
            </Table>
            <div className="mt-2 flex justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">
              <span>Total Assets</span>
              <span>৳ {Number(report.totalAssets).toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-slate-800">Liabilities</p>
            <Table columns={COLUMNS}>
              {report.liabilities.map((row) => (
                <tr key={row.accountId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{row.code}</td>
                  <td className="px-4 py-3 text-slate-700">{row.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {row.balance.toFixed(2)}</td>
                </tr>
              ))}
            </Table>
            <div className="mt-2 flex justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">
              <span>Total Liabilities</span>
              <span>৳ {Number(report.totalLiabilities).toFixed(2)}</span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold text-slate-800">Equity</p>
            <Table columns={COLUMNS}>
              {report.equity.map((row) => (
                <tr key={row.accountId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{row.code}</td>
                  <td className="px-4 py-3 text-slate-700">{row.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {row.balance.toFixed(2)}</td>
                </tr>
              ))}
            </Table>
            <div className="mt-2 flex justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">
              <span>Total Equity</span>
              <span>৳ {Number(report.totalEquity).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheetPage;