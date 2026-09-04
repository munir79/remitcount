"use client";
import { useState } from "react";
import { Loader2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetCashFlowQuery } from "@/redux/features/report/reportApi";
import PeriodSelector from "@/compoent/ui/PeriodSelector";
import BranchSelector from "@/compoent/ui/BranchSelector";
import Table from "@/compoent/ui/Table";


const COLUMNS = [
  { key: "account", label: "Account" },
  { key: "type", label: "Type" },
  { key: "inflow", label: "Inflow" },
  { key: "outflow", label: "Outflow" },
  { key: "net", label: "Net Change" },
  { key: "closing", label: "Closing Balance" },
];

const CashFlowPage = () => {
  const { hasPermission } = useAuth();
  const [period, setPeriod] = useState("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branch, setBranch] = useState("");

  const canFilterByBranch = hasPermission("cashierSession:manage");

  const queryParams = { ...(period === "custom" ? { fromDate, toDate } : { period }), branch: branch || undefined };
  const { data, isLoading, isFetching } = useGetCashFlowQuery(queryParams, {
    skip: period === "custom" && (!fromDate || !toDate),
  });

  const report = data?.data;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Cash Flow</h1>
        <p className="mt-0.5 text-sm text-slate-600">Movement of cash and bank accounts</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <PeriodSelector
          period={period}
          onPeriodChange={setPeriod}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
        />
        {canFilterByBranch && <BranchSelector branch={branch} onBranchChange={setBranch} className="w-56" />}
      </div>

      {isLoading || isFetching ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : !report ? (
        <p className="text-sm text-slate-500">Select a period to view the report</p>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-1.5">
                <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Inflow</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-emerald-600">৳ {Number(report.totalInflow).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-1.5">
                <ArrowUpCircle className="h-4 w-4 text-rose-600" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Outflow</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-rose-600">৳ {Number(report.totalOutflow).toFixed(2)}</p>
            </div>
            <div
              className={`rounded-xl border p-5 ${
                report.netCashFlow >= 0 ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Cash Flow</p>
              <p className={`mt-1 text-2xl font-bold ${report.netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                ৳ {Number(report.netCashFlow).toFixed(2)}
              </p>
            </div>
          </div>

          {report.rows.length === 0 ? (
            <p className="text-sm text-slate-500">No bank/cash accounts registered</p>
          ) : (
            <Table columns={COLUMNS}>
              {report.rows.map((row) => (
                <tr key={row.accountId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.accountName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.accountType}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600">৳ {row.inflow.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-rose-600">৳ {row.outflow.toFixed(2)}</td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-semibold ${
                      row.netChange >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    ৳ {row.netChange.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                    ৳ {Number(row.closingBalance).toFixed(2)}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
};

export default CashFlowPage;