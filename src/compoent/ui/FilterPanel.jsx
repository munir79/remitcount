"use client";
import { toast } from "sonner";
import { AlertTriangle, Check, X } from "lucide-react";
import SearchInput from "./SearchInput";
import BranchSelector from "./BranchSelector";
import Button from "./Button";
import { PeriodFilter } from "./ListToolbar";

/**
 * ✅ Filter বাছাই করে "Apply" (বা Enter) চাপলে তবেই ফলাফল — useListFilters({ manualApply: true }) এর সাথে
 * তারিখ ভুল হলে Apply হয় না, কারণ লেখা থাকে; বদলানো কিন্তু Apply না করা Filter থাকলে মনে করিয়ে দেয়
 * children — Page এর নিজের Filter (যেমন Send এ Currency / Supplier)
 */
const FilterPanel = ({ filters, searchPlaceholder = "Search…", supportsPeriod = true, showBranch = false, children }) => {
  const submit = (e) => {
    e.preventDefault();
    if (!filters.apply()) toast.error(filters.error);
  };

  // Dropdown এ Enter চাপলে Browser নিজে Form Submit করে না — তাই এখানে
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.target.tagName === "SELECT") submit(e);
  };

  return (
    <form onSubmit={submit} onKeyDown={handleKeyDown} className="mb-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card print:hidden">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-1.5 sm:w-64">
          <label htmlFor="listSearch" className="text-[13px] font-medium text-slate-700">
            Search
          </label>
          <SearchInput id="listSearch" value={filters.search} onChange={(e) => filters.setSearch(e.target.value)} placeholder={searchPlaceholder} className="w-full" />
        </div>
        {supportsPeriod && (
          <PeriodFilter
            label="Date"
            period={filters.period}
            onPeriodChange={filters.setPeriod}
            fromDate={filters.fromDate}
            toDate={filters.toDate}
            onFromDateChange={filters.setFromDate}
            onToDateChange={filters.setToDate}
            error={filters.error}
          />
        )}
        {showBranch && <BranchSelector branch={filters.branch} onBranchChange={filters.setBranch} className="sm:w-52" />}
        {children}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="text-[13px]">
          {filters.error ? (
            <span className="flex items-center gap-1.5 font-medium text-rose-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {filters.error}
            </span>
          ) : filters.isDirty ? (
            <span className="font-medium text-amber-700">Filters changed — press Apply (or Enter) to see the results.</span>
          ) : (
            <span className="text-slate-500">Choose filters, then press Apply or Enter.</span>
          )}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={filters.clearAll} disabled={!filters.hasActiveFilters && !filters.isDirty}>
            <X className="h-4 w-4" />
            Clear all
          </Button>
          <Button type="submit" disabled={Boolean(filters.error) || !filters.isDirty}>
            <Check className="h-4 w-4" />
            Apply filters
          </Button>
        </div>
      </div>
    </form>
  );
};

export default FilterPanel;
