"use client";

const Input = ({ id, label, error, suffix, hint, className = "", ...props }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={`h-10 w-full rounded-md border bg-white px-3 text-[14px] text-neutral-900 placeholder:text-neutral-400
            shadow-xs transition-all duration-150
            focus:outline-none focus:ring-[3px] focus:ring-indigo-500/15 focus:border-indigo-500
            ${error ? "border-rose-400 focus:ring-rose-500/15 focus:border-rose-500" : "border-neutral-300 hover:border-neutral-400"}
            ${suffix ? "pr-10" : ""}`}
          {...props}
        />
        {suffix && <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>}
      </div>
      {hint && !error && <span className="text-xs text-neutral-400">{hint}</span>}
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </div>
  );
};

export default Input;