"use client";
import PeriodSelector from "../ui/PeriodSelector";
import BranchSelector from "../ui/BranchSelector";

/**
 * ✅ Report এর উপরের Filter — Period (দিলে) + অন্য Field (children) + Admin হলে Branch। Print এ লুকায়
 * periodState — useReportPeriod() এর ফলাফল; না দিলে Period Selector দেখায় না
 */
const ReportFilters = ({ periodState, showBranch, branch, onBranchChange, children }) => (
  <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card print:hidden">
    {periodState && (
      <PeriodSelector
        period={periodState.period}
        onPeriodChange={periodState.setPeriod}
        fromDate={periodState.fromDate}
        toDate={periodState.toDate}
        onFromDateChange={periodState.setFromDate}
        onToDateChange={periodState.setToDate}
      />
    )}
    {children}
    {showBranch && <BranchSelector branch={branch} onBranchChange={onBranchChange} className="w-56" />}
  </div>
);

export default ReportFilters;
