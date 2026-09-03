const VARIANTS = {
  primary: "bg-indigo-50 text-indigo-800 ring-1 ring-inset ring-indigo-600/20",
  success: "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/20",
  danger: "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-600/20",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20",
  neutral: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20",
};

const Badge = ({ children, variant = "neutral", className = "" }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;