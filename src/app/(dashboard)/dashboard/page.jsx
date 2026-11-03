"use client";
import Link from "next/link";
import { ListTree, BookOpen, Scale, BarChart3, Landmark, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import PageHeader from "@/compoent/ui/PageHeader";
import StatCard from "@/compoent/ui/StatCard";
import { formatMoney, getTimezone } from "@/lib/format";
import { useGetProfitLossQuery } from "@/redux/features/report/reportApi";

const QUICK_LINKS = [
  { label: "Chart of Accounts", hint: "Account structure", href: "/accounts", icon: ListTree },
  { label: "Journal Entries", hint: "Manual & contra", href: "/journal", icon: BookOpen },
  { label: "Ledger", hint: "Account history", href: "/ledger", icon: BookOpen },
  { label: "Trial Balance", hint: "Debit = credit check", href: "/trial-balance", icon: Scale },
  { label: "Bank & Cash", hint: "Drawers and banks", href: "/bank-account", icon: Landmark },
  { label: "Reports", hint: "P&L, balance sheet", href: "/reports/profit-loss", icon: BarChart3 },
];

/** Account অনুযায়ী Income/Expense এর ভাগ — সবচেয়ে বড় থেকে ছোট, অনুপাত Bar সহ */
const BreakdownCard = ({ title, rows = [], total = 0, tone, icon: Icon, isLoading }) => {
  const sorted = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 6);
  const barColor = tone === "emerald" ? "bg-emerald-500" : "bg-rose-500";

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone === "emerald" ? "text-emerald-600" : "text-rose-600"}`} />
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        </div>
        <span className="text-sm font-semibold tabular-nums text-slate-900">{formatMoney(total)}</span>
      </div>

      {isLoading ? (
        <div className="space-y-4 p-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">No entries this month.</p>
      ) : (
        <ul className="space-y-4 p-5">
          {sorted.map((row) => {
            const pct = total > 0 ? Math.max(2, Math.round((row.amount / total) * 100)) : 0;
            return (
              <li key={row.accountId}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate text-slate-700">
                    <span className="mr-2 font-mono text-xs text-slate-400">{row.code}</span>
                    {row.name}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums text-slate-900">{formatMoney(row.amount)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const AccountingDashboardPage = () => {
  const { data, isLoading } = useGetProfitLossQuery({ period: "month" });
  const report = data?.data;
  const netProfit = Number(report?.netProfit || 0);
  const isPositive = netProfit >= 0;
  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: getTimezone() });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Accounting overview" description={`Financial performance for ${monthLabel}`} />

      <section aria-label="This month" className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Income" value={formatMoney(report?.totalIncome)} icon={ArrowDownRight} tone="emerald" hint="This month" isLoading={isLoading} />
        <StatCard label="Expenses" value={formatMoney(report?.totalExpense)} icon={ArrowUpRight} tone="rose" hint="This month" isLoading={isLoading} />
        <StatCard
          label="Net Profit"
          value={formatMoney(netProfit)}
          icon={isPositive ? TrendingUp : TrendingDown}
          tone={isPositive ? "emerald" : "rose"}
          valueClassName={isPositive ? "text-emerald-600" : "text-rose-600"}
          hint="Income − expenses"
          isLoading={isLoading}
        />
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <BreakdownCard title="Income by account" rows={report?.incomeRows} total={report?.totalIncome} tone="emerald" icon={ArrowDownRight} isLoading={isLoading} />
        <BreakdownCard title="Expenses by account" rows={report?.expenseRows} total={report?.totalExpense} tone="rose" icon={ArrowUpRight} isLoading={isLoading} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick access</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition
              hover:border-indigo-200 hover:shadow-elevated
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <link.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{link.label}</p>
              <p className="truncate text-xs text-slate-500">{link.hint}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AccountingDashboardPage;
