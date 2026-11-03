const TONES = {
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  slate: "bg-slate-50 text-slate-600 ring-slate-200",
};

/**
 * ✅ Dashboard এর একটা সংখ্যা দেখানোর Card
 * <StatCard label="Today's Profit" value="RM 1,250.00" icon={TrendingUp} tone="emerald" hint="vs yesterday" />
 */
const StatCard = ({ label, value, icon: Icon, tone = "indigo", hint, valueClassName = "", isLoading = false }) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {Icon && (
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${TONES[tone] || TONES.indigo}`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="mt-2 h-8 w-32 animate-pulse rounded-md bg-slate-100" />
      ) : (
        <p className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-900 ${valueClassName}`}>{value}</p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
};

export default StatCard;
