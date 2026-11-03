"use client";
import { ArrowDownRight, ArrowUpRight, BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatRangeLabel, useReportPeriod } from "@/hooks/useReportPeriod";
import { useGetProfitLossQuery } from "@/redux/features/report/reportApi";
import { formatMoney } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import StatCard from "@/compoent/ui/StatCard";
import ReportFilters from "@/compoent/accounting/ReportFilters";
import StatementSection from "@/compoent/accounting/StatementSection";

const toRows = (rows = []) => rows.map((r) => ({ key: r.accountId, code: r.code, name: r.name, amount: r.amount }));

const ProfitLossPage = () => {
  const { hasPermission } = useAuth();
  const canFilterByBranch = hasPermission("cashierSession:manage");
  const filters = useReportPeriod("month");

  const { data, isLoading, isFetching } = useGetProfitLossQuery(filters.params, { skip: filters.skip });
  const report = data?.data;
  const netProfit = Number(report?.netProfit || 0);
  const isProfit = netProfit >= 0;
  const margin = report?.totalIncome > 0 ? (netProfit / report.totalIncome) * 100 : 0;
  const rangeLabel = formatRangeLabel(report?.dateRange);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PrintHeader title="Profit & Loss Statement" subtitle={rangeLabel} />
      <PageHeader title="Profit & Loss" description="Income and expenses for a period" actions={report && <PrintButton />} />

      <ReportFilters periodState={filters} showBranch={canFilterByBranch} branch={filters.branch} onBranchChange={filters.setBranch} />

      {filters.skip ? (
        <EmptyState icon={BarChart3} title="Choose a date range" description="Select both From and To dates to run the report." />
      ) : isLoading || !report ? (
        <PageLoader />
      ) : (
        <div className={isFetching ? "opacity-70 transition-opacity" : ""}>
          <div className="mb-6 grid gap-4 sm:grid-cols-3 print:grid-cols-3">
            <StatCard label="Income" value={formatMoney(report.totalIncome)} icon={ArrowDownRight} tone="emerald" />
            <StatCard label="Expenses" value={formatMoney(report.totalExpense)} icon={ArrowUpRight} tone="rose" />
            <StatCard
              label={isProfit ? "Net profit" : "Net loss"}
              value={formatMoney(netProfit)}
              icon={isProfit ? TrendingUp : TrendingDown}
              tone={isProfit ? "emerald" : "rose"}
              valueClassName={isProfit ? "text-emerald-600" : "text-rose-600"}
              hint={report.totalIncome > 0 ? `${margin.toFixed(1)}% margin` : undefined}
            />
          </div>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8 print:border-0 print:p-0">
            <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2 print:hidden">
              <h2 className="text-base font-semibold text-slate-900">Statement</h2>
              <span className="text-sm text-slate-500">
                {rangeLabel}
                {report.branch ? " · single branch" : ""}
              </span>
            </header>

            <div className="space-y-8">
              <StatementSection title="Income" rows={toRows(report.incomeRows)} totalLabel="Total income" total={report.totalIncome} emptyText="No income in this period" />
              <StatementSection title="Expenses" rows={toRows(report.expenseRows)} totalLabel="Total expenses" total={report.totalExpense} emptyText="No expenses in this period" />

              <div
                className={`flex items-baseline justify-between rounded-xl px-4 py-3.5 ${
                  isProfit ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                } print:rounded-none print:border-y-2 print:border-slate-900 print:bg-transparent print:px-0 print:text-slate-900`}
              >
                <span className="text-sm font-semibold">{isProfit ? "Net profit" : "Net loss"}</span>
                <span className="text-lg font-semibold tabular-nums">{formatMoney(netProfit)}</span>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default ProfitLossPage;
