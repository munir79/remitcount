import { ChevronDown } from "lucide-react";

const Select = ({ id, label, error, children, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`h-11 w-full appearance-none rounded-lg border bg-white px-3.5 pr-9 text-sm text-neutral-900
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500
            ${error ? "border-rose-400" : "border-neutral-300 hover:border-neutral-400"}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      </div>
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
};

export default Select;