"use client";

import Input from "./Input";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

/** Segmented Control — এক Click এ Period বদলানো যায় */
const PeriodSelector = ({ period, onPeriodChange, fromDate, toDate, onFromDateChange, onToDateChange }) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate-700">Period</span>
        <div className="inline-flex h-10 items-center rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPeriodChange(p.value)}
              className={`h-8 rounded-md px-3 text-[13px] font-medium transition ${
                period === p.value ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <>
          <Input id="fromDate" type="date" label="From" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} className="w-40" />
          <Input id="toDate" type="date" label="To" value={toDate} onChange={(e) => onToDateChange(e.target.value)} className="w-40" />
        </>
      )}
    </div>
  );
};

export default PeriodSelector;
