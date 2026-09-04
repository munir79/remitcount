"use client";
import Link from "next/link";
import { ListTree, BookOpen, Scale, BarChart3, Landmark, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { useGetProfitLossQuery } from "@/redux/features/report/reportApi";

const QUICK_LINKS = [
  { label: "Chart of Accounts", href: "/accounts", icon: ListTree },
  { label: "Journal Entries", href: "/journal", icon: BookOpen },
  { label: "Ledger", href: "/ledger", icon: BookOpen },
  { label: "Trial Balance", href: "/trial-balance", icon: Scale },
  { label: "Bank Accounts", href: "/bank-account", icon: Landmark },
  { label: "Reports", href: "/reports/profit-loss", icon: BarChart3 },
];

const AccountingDashboardPage = () => {
  const { data, isLoading } = useGetProfitLossQuery({ period: "month" });
  const report = data?.data;
  const isPositive = (report?.netProfit || 0) >= 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Accounting Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-600">Overview of your accounting workspace</p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Income (This Month)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">৳ {Number(report?.totalIncome || 0).toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Expense (This Month)</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">৳ {Number(report?.totalExpense || 0).toFixed(2)}</p>
          </div>
          <div className={`rounded-xl border p-5 ${isPositive ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
            <div className="flex items-center gap-1.5">
              {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-rose-600" />}
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Profit (This Month)</p>
            </div>
            <p className={`mt-1 text-2xl font-bold ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
              ৳ {Number(report?.netProfit || 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <p className="mb-4 text-sm font-bold text-slate-800">Quick Access</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-center transition hover:border-indigo-300 hover:shadow-sm"
          >
            <link.icon className="h-6 w-6 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-700">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AccountingDashboardPage;