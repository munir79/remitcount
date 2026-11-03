"use client";

/**
 * ✅ prefix/suffix দিয়ে Input এর ভেতরে লেখা দেখানো যায় — যেমন prefix="RM", suffix="USD"
 */
const Input = ({ id, label, error, hint, required, prefix, suffix, className = "", inputClassName = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[13px] font-medium text-slate-500">
            {prefix}
          </span>
        )}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          className={`h-10 w-full rounded-lg border bg-white text-sm text-slate-900 shadow-[0_1px_2px_rgb(16_24_40/0.04)]
            placeholder:text-slate-400 transition-[border-color,box-shadow] duration-150
            focus:outline-none focus:ring-4
            disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500
            ${prefix ? "pl-11" : "pl-3.5"} ${suffix ? (typeof suffix === "string" ? "pr-14" : "pr-11") : "pr-3.5"}
            ${error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
              : "border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/15"}
            ${inputClassName}`}
          {...props}
        />
        {suffix && (
          // Text Suffix Click আটকায় না; Button Suffix (যেমন Password 👁) Click করা যায়
          <span
            className={`absolute inset-y-0 right-0 flex items-center pr-3.5 text-[13px] font-medium text-slate-500 ${
              typeof suffix === "string" ? "pointer-events-none" : ""
            }`}
          >
            {suffix}
          </span>
        )}
      </div>
      {hint && !error && <span className="text-xs text-slate-500">{hint}</span>}
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
};

export default Input;
