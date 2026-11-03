"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Scale, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetBalanceSheetQuery } from "@/redux/features/report/reportApi";
import { formatDate, formatMoney, todayInCompany } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Input from "@/compoent/ui/Input";
import ReportFilters from "@/compoent/accounting/ReportFilters";
import StatementSection from "@/compoent/accounting/StatementSection";

const toRows = (rows = []) => rows.map((r) => ({ key: r.accountId, code: r.code, name: r.name, amount: r.balance, isComputed: r.isComputed }));
// ✅ Fix — আজকের তারিখ Malaysia সময়ে (আগে toISOString দিয়ে UTC নিত, সকাল ৮টার আগে আগের দিন দেখাত)

const BalanceSheetPage = () => {
  const { hasPermission } = useAuth();
  const canFilterByBranch = hasPermission("cashierSession:manage");
  const [asOfDate, setAsOfDate] = useState(todayInCompany);
  const [branch, setBranch] = useState("");

  const { data, isLoading, isFetching } = useGetBalanceSheetQuery({ asOfDate, branch: branch || undefined }, { skip: !asOfDate });
  const report = data?.data;
  const liabilitiesAndEquity = Number(report?.totalLiabilities || 0) + Number(report?.totalEquity || 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PrintHeader title="Balance Sheet" subtitle={`As of ${formatDate(asOfDate)}`} />
      <PageHeader title="Balance Sheet" description="What the business owns and owes on a date" actions={report && <PrintButton />} />

      <ReportFilters showBranch={canFilterByBranch} branch={branch} onBranchChange={setBranch}>
        <Input id="asOfDate" type="date" label="As of" value={asOfDate} max={todayInCompany()} onChange={(e) => setAsOfDate(e.target.value)} className="w-48" />
      </ReportFilters>

      {!asOfDate ? (
        <EmptyState icon={Scale} title="Choose a date" description="Pick the date to see the financial position." />
      ) : isLoading || !report ? (
        <PageLoader />
      ) : (
        <div className={isFetching ? "opacity-70 transition-opacity" : ""}>
          {report.isPartial ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                <span className="font-semibold">Partial view.</span> Shows only this branch&apos;s activity (opening balances excluded), so it may not
                balance.
              </p>
            </div>
          ) : (
            <div
              className={`mb-6 flex items-center gap-3 rounded-2xl px-5 py-4 ring-1 ring-inset print:hidden ${
                report.isBalanced ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20" : "bg-rose-50 text-rose-800 ring-rose-600/20"
              }`}
            >
              {report.isBalanced ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
              <p className="text-sm">
                <span className="font-semibold">{report.isBalanced ? "Balanced." : "Not balanced."}</span>{" "}
                {report.isBalanced
                  ? `Assets equal liabilities plus equity (${formatMoney(report.totalAssets)}).`
                  : `Difference of ${formatMoney(Math.abs(report.difference ?? report.totalAssets - liabilitiesAndEquity))}. Check opening balances and recent entries.`}
              </p>
            </div>
          )}

          <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card sm:p-8 print:border-0 print:p-0">
            <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2 print:hidden">
              <h2 className="text-base font-semibold text-slate-900">Statement of financial position</h2>
              <span className="text-sm text-slate-500">As of {formatDate(asOfDate)}</span>
            </header>

            <div className="grid gap-10 lg:grid-cols-2 print:grid-cols-2">
              <div className="space-y-8">
                <StatementSection title="Assets" rows={toRows(report.assets)} totalLabel="Total assets" total={report.totalAssets} accent="text-indigo-700" />
              </div>
              <div className="space-y-8">
                <StatementSection title="Liabilities" rows={toRows(report.liabilities)} totalLabel="Total liabilities" total={report.totalLiabilities} emptyText="No liabilities" />
                <StatementSection title="Equity" rows={toRows(report.equity)} totalLabel="Total equity" total={report.totalEquity} emptyText="No equity" />
                <div className="flex items-baseline justify-between border-t-2 border-slate-900 pt-3 text-sm font-semibold">
                  <span className="text-slate-900">Total liabilities & equity</span>
                  <span className="tabular-nums text-indigo-700">{formatMoney(liabilitiesAndEquity)}</span>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
};

export default BalanceSheetPage;
