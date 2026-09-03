import { ChevronDown } from "lucide-react";

const Select = ({ id, label, error, required, children, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`h-10 w-full appearance-none rounded-lg border bg-white px-3.5 pr-9 text-[14px] text-slate-900
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            ${error ? "border-rose-400" : "border-slate-300 hover:border-slate-400"}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
};

export default Select;