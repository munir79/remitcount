"use client";

import Input from "./Input";
import Select from "./Select";


const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

const PeriodSelector = ({ period, onPeriodChange, fromDate, toDate, onFromDateChange, onToDateChange }) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Select id="period" label="Period" value={period} onChange={(e) => onPeriodChange(e.target.value)} className="w-48">
        {PERIODS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </Select>

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