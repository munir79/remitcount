const VARIANTS = {
  primary: { box: "bg-indigo-50 text-indigo-700 ring-indigo-600/15", dot: "bg-indigo-500" },
  success: { box: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", dot: "bg-emerald-500" },
  danger: { box: "bg-rose-50 text-rose-700 ring-rose-600/15", dot: "bg-rose-500" },
  warning: { box: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  info: { box: "bg-sky-50 text-sky-700 ring-sky-600/15", dot: "bg-sky-500" },
  neutral: { box: "bg-slate-100 text-slate-600 ring-slate-500/15", dot: "bg-slate-400" },
};

/** Status দেখানোর জন্য — dot={false} দিলে বাম পাশের ছোট বিন্দু থাকবে না */
const Badge = ({ children, variant = "neutral", dot = true, className = "" }) => {
  const style = VARIANTS[variant] || VARIANTS.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.box} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />}
      {children}
    </span>
  );
};

export default Badge;
