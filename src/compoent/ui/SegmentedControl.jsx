"use client";

/**
 * ✅ এক Click এ বাছাই — যেমন Payment Term: Cash / Credit
 * options: [{ value, label, icon? }]
 */
const SegmentedControl = ({ label, value, onChange, options, className = "" }) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <span className="text-[13px] font-medium text-slate-700">{label}</span>}
      <div role="radiogroup" aria-label={label} className="grid h-10 auto-cols-fr grid-flow-col gap-1 rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200">
        {options.map((opt) => {
          const isActive = value === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.value)}
              className={`flex items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isActive ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SegmentedControl;
