const VARIANTS = {
  primary: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/10",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10",
  danger: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/10",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10",
  neutral: "bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-500/10",
};

const Badge = ({ children, variant = "neutral", className = "" }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;