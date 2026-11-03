import { ChevronDown } from "lucide-react";

const Select = ({ id, label, error, hint, required, children, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          aria-invalid={Boolean(error)}
          className={`h-10 w-full cursor-pointer appearance-none rounded-lg border bg-white pl-3.5 pr-9 text-sm text-slate-900
            shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-[border-color,box-shadow] duration-150
            focus:outline-none focus:ring-4
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/15"}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
};

export default Select;
