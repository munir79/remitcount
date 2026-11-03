"use client";
import SearchInput from "./SearchInput";
import BranchSelector from "./BranchSelector";
import Select from "./Select";
import Input from "./Input";

export const DOCUMENT_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Posted", label: "Posted" },
  { value: "Cancelled", label: "Cancelled" },
];

export const PERIOD_OPTIONS = [
  { value: "", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Pick dates…" },
];

/**
 * ✅ Period + নির্দিষ্ট তারিখ — "Pick dates…" বাছলে From / To আসে (একদিনের জন্য দুটোতে একই তারিখ)
 * label দিলে উপরে Label (Filter Panel এ), না দিলে শুধু aria-label (Toolbar এ)
 */
export const PeriodFilter = ({ period, onPeriodChange, fromDate, toDate, onFromDateChange, onToDateChange, label, error }) => (
  <>
    <Select id="periodFilter" label={label} aria-label="Period" value={period} onChange={(e) => onPeriodChange(e.target.value)} className="sm:w-40">
      {PERIOD_OPTIONS.map((p) => (
        <option key={p.value || "all"} value={p.value}>
          {p.label}
        </option>
      ))}
    </Select>
    {period === "custom" && (
      <div className="flex items-end gap-2">
        <Input
          id="fromDateFilter"
          type="date"
          label={label ? "From" : undefined}
          aria-label="From date"
          value={fromDate || ""}
          max={toDate || undefined}
          onChange={(e) => onFromDateChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className="sm:w-40"
        />
        <span className="pb-2.5 text-[13px] text-slate-400">to</span>
        <Input
          id="toDateFilter"
          type="date"
          label={label ? "To" : undefined}
          aria-label="To date"
          value={toDate || ""}
          min={fromDate || undefined}
          onChange={(e) => onToDateChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className="sm:w-40"
        />
      </div>
    )}
  </>
);

/** Status Tab — সাথে সাথে বদলায় */
export const StatusTabs = ({ options, status, onChange }) => (
  <div role="tablist" aria-label="Filter by status" className="inline-flex w-fit items-center rounded-lg bg-slate-200/60 p-1">
    {options.map((opt) => {
      const isActive = (status || "") === opt.value;
      return (
        <button
          key={opt.value || "all"}
          role="tab"
          aria-selected={isActive}
          onClick={() => onChange(opt.value)}
          className={`h-8 rounded-md px-3.5 text-[13px] font-medium transition ${isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

/**
 * ✅ List Page এর উপরের Filter Bar — বামে Status Tabs, ডানে Search / Period / Branch
 * কোনো Prop না দিলে সেই Filter দেখায় না
 */
const ListToolbar = ({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  statusOptions,
  status,
  onStatusChange,
  period,
  onPeriodChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  showBranch = false,
  branch,
  onBranchChange,
  children,
}) => {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
      {statusOptions ? <StatusTabs options={statusOptions} status={status} onChange={onStatusChange} /> : <div />}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {children}
        {onPeriodChange && (
          <PeriodFilter
            period={period}
            onPeriodChange={onPeriodChange}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
          />
        )}
        {showBranch && <BranchSelector branch={branch} onBranchChange={onBranchChange} label={null} className="sm:w-52" />}
        {onSearchChange && <SearchInput value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="sm:w-64" />}
      </div>
    </div>
  );
};

export default ListToolbar;
