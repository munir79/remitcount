"use client";
import { ArrowDownCircle, ArrowUpCircle, Landmark, Wallet, Waves } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatRangeLabel, useReportPeriod } from "@/hooks/useReportPeriod";
import { useGetCashFlowQuery } from "@/redux/features/report/reportApi";
import { formatMoney, formatNumber } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import StatCard from "@/compoent/ui/StatCard";
import Table from "@/compoent/ui/Table";
import { TD } from "@/compoent/ui/TableCells";
import ReportFilters from "@/compoent/accounting/ReportFilters";

const COLUMNS = [
  { key: "account", label: "Account" },
  { key: "opening", label: "Opening", align: "right" },
  { key: "inflow", label: "Money in", align: "right" },
  { key: "outflow", label: "Money out", align: "right" },
  { key: "net", label: "Net change", align: "right" },
  { key: "closing", label: "Closing", align: "right" },
];

const num = (v) => <span className="tabular-nums">{formatNumber(v)}</span>;

const CashFlowPage = () => {
  const { hasPermission } = useAuth();
  const canFilterByBranch = hasPermission("cashierSession:manage");
  const filters = useReportPeriod("month");

  const { data, isLoading, isFetching } = useGetCashFlowQuery(filters.params, { skip: filters.skip });
  const report = data?.data;
  const net = Number(report?.netCashFlow || 0);
  const rangeLabel = formatRangeLabel(report?.dateRange);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PrintHeader title="Cash Flow" subtitle={rangeLabel} />
      <PageHeader title="Cash Flow" description="Money in and out of cash drawers and bank accounts" actions={report && <PrintButton />} />

      <ReportFilters periodState={filters} showBranch={canFilterByBranch} branch={filters.branch} onBranchChange={filters.setBranch} />

      {filters.skip ? (
        <EmptyState icon={Waves} title="Choose a date range" description="Select both From and To dates to run the report." />
      ) : isLoading || !report ? (
        <PageLoader />
      ) : report.rows.length === 0 ? (
        <EmptyState icon={Landmark} title="No cash or bank accounts" description="Add cash drawers and bank accounts in Cash & Bank first." />
      ) : (
        <div className={isFetching ? "opacity-70 transition-opacity" : ""}>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
            <StatCard label="Opening balance" value={formatMoney(report.totalOpening)} icon={Wallet} tone="slate" />
            <StatCard label="Money in" value={formatMoney(report.totalInflow)} icon={ArrowDownCircle} tone="emerald" />
            <StatCard label="Money out" value={formatMoney(report.totalOutflow)} icon={ArrowUpCircle} tone="rose" />
            <StatCard
              label="Closing balance"
              value={formatMoney(report.totalClosing)}
              icon={Landmark}
              tone="indigo"
              hint={`Net ${net >= 0 ? "+" : "−"}${formatMoney(Math.abs(net))}`}
            />
          </div>

          <p className="mb-3 text-sm text-slate-500 print:hidden">
            {rangeLabel}
            {report.branch ? " · single branch (opening balances excluded)" : ""}
          </p>

          <Table columns={COLUMNS}>
            {report.rows.map((row) => (
              <tr key={row.accountId}>
                <td className={TD}>
                  <div className="flex items-center gap-2.5">
                    {row.accountType === "Cash" ? <Wallet className="h-4 w-4 text-amber-500" /> : <Landmark className="h-4 w-4 text-sky-500" />}
                    <span className="font-medium text-slate-800">{row.accountName}</span>
                  </div>
                </td>
                <td className={`${TD} text-right text-slate-600`}>{num(row.openingBalance)}</td>
                <td className={`${TD} text-right text-emerald-600`}>{num(row.inflow)}</td>
                <td className={`${TD} text-right text-rose-600`}>{num(row.outflow)}</td>
                <td className={`${TD} text-right font-medium ${row.netChange >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {row.netChange >= 0 ? "+" : "−"}
                  {num(Math.abs(row.netChange))}
                </td>
                <td className={`${TD} text-right font-semibold text-slate-900`}>{num(row.closingBalance)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
              <td className={`${TD} text-slate-900`}>Total</td>
              <td className={`${TD} text-right text-slate-700`}>{num(report.totalOpening)}</td>
              <td className={`${TD} text-right text-emerald-700`}>{num(report.totalInflow)}</td>
              <td className={`${TD} text-right text-rose-700`}>{num(report.totalOutflow)}</td>
              <td className={`${TD} text-right ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {net >= 0 ? "+" : "−"}
                {num(Math.abs(net))}
              </td>
              <td className={`${TD} text-right text-indigo-700`}>{num(report.totalClosing)}</td>
            </tr>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CashFlowPage;
