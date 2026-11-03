import { formatNumber } from "@/lib/format";

/**
 * ✅ Financial Statement এর একটা অংশ — যেমন "Income" বা "Assets"
 * rows: [{ key, code, name, amount, isComputed? }]
 * isComputed — হিসাব করে বের করা Row (যেমন Current earnings), Italic দেখায়
 */
const StatementSection = ({ title, rows = [], totalLabel, total, emptyText = "Nothing to show", accent = "text-slate-900" }) => (
  <section className="break-inside-avoid">
    <h3 className="border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
    {rows.length === 0 ? (
      <p className="py-3 text-sm text-slate-400">{emptyText}</p>
    ) : (
      <ul className="divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.key} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <span className={`min-w-0 truncate ${row.isComputed ? "italic text-slate-500" : "text-slate-700"}`}>
              {row.code && <span className="mr-2 font-mono text-xs text-slate-400">{row.code}</span>}
              {row.name}
            </span>
            <span className={`shrink-0 tabular-nums ${row.amount < 0 ? "text-rose-600" : "text-slate-800"}`}>{formatNumber(row.amount)}</span>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-slate-300 pt-2.5 text-sm font-semibold">
      <span className="text-slate-900">{totalLabel}</span>
      <span className={`tabular-nums ${accent}`}>{formatNumber(total)}</span>
    </div>
  </section>
);

export default StatementSection;
