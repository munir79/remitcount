"use client";

const Input = ({ id, label, error, hint, required, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <input
        id={id}
        className={`h-10 w-full rounded-lg border bg-white px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
          ${error ? "border-rose-400" : "border-slate-300 hover:border-slate-400"}`}
        {...props}
      />
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
};

export default Input;