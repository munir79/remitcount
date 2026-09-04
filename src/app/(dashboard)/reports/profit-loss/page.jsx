"use client";
import { useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useGetProfitLossQuery } from "@/redux/features/report/reportApi";
import PeriodSelector from "@/compoent/ui/PeriodSelector";
import BranchSelector from "@/compoent/ui/BranchSelector";
import Table from "@/compoent/ui/Table";
import { useAuth } from "@/hooks/useAuth";


const COLUMNS = [
  { key: "code", label: "Code" },
  { key: "name", label: "Account" },
  { key: "amount", label: "Amount (MYR)" },
];

const ProfitLossPage = () => {
  const { hasPermission } = useAuth();
  const [period, setPeriod] = useState("month");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [branch, setBranch] = useState("");

  const canFilterByBranch = hasPermission("cashierSession:manage"); // Admin Indicator

  const queryParams = { ...(period === "custom" ? { fromDate, toDate } : { period }), branch: branch || undefined };
  const { data, isLoading, isFetching } = useGetProfitLossQuery(queryParams, { skip: period === "custom" && (!fromDate || !toDate) });

  const report = data?.data;
  const isPositive = (report?.netProfit || 0) >= 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Profit &amp; Loss</h1>
        <p className="mt-0.5 text-sm text-slate-600">Income vs Expense summary</p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Income</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">৳ {Number(report.totalIncome).toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Expense</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">৳ {Number(report.totalExpense).toFixed(2)}</p>
            </div>
            <div className={`rounded-xl border p-5 ${isPositive ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
              <div className="flex items-center gap-1.5">
                {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-rose-600" />}
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Profit</p>
              </div>
              <p className={`mt-1 text-2xl font-bold ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
                ৳ {Number(report.netProfit).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-bold text-slate-800">Income</p>
              {report.incomeRows.length === 0 ? (
                <p className="text-sm text-slate-500">No income in this period</p>
              ) : (
                <Table columns={COLUMNS}>
                  {report.incomeRows.map((row) => (
                    <tr key={row.accountId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{row.code}</td>
                      <td className="px-4 py-3 text-slate-700">{row.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>

            <div>
              <p className="mb-3 text-sm font-bold text-slate-800">Expense</p>
              {report.expenseRows.length === 0 ? (
                <p className="text-sm text-slate-500">No expense in this period</p>
              ) : (
                <Table columns={COLUMNS}>
                  {report.expenseRows.map((row) => (
                    <tr key={row.accountId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{row.code}</td>
                      <td className="px-4 py-3 text-slate-700">{row.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfitLossPage;