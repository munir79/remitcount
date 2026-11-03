/**
 * ✅ Form এর Live হিসাব — প্রতিটা Row: { label, value, tone?, emphasis?, muted? }
 * tone: "profit" (লাভ সবুজ/ক্ষতি লাল), "positive", "negative"
 * emphasis: true হলে বড় করে উপরে দাগ সহ (Total Row)
 *
 * value String হলে সরাসরি দেখায়; profit tone এর জন্য rawValue (Number) দিতে হয়
 */
const toneClass = (row) => {
  if (row.tone === "profit") return Number(row.rawValue) >= 0 ? "text-emerald-600" : "text-rose-600";
  if (row.tone === "positive") return "text-emerald-600";
  if (row.tone === "negative") return "text-rose-600";
  return row.emphasis ? "text-slate-900" : "text-slate-700";
};

const SummaryPanel = ({ title, rows = [], footer, className = "" }) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/70 ${className}`}>
      {title && <p className="border-b border-slate-200/70 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>}
      <dl className="px-4 py-2">
        {rows.filter(Boolean).map((row) => (
          <div
            key={row.label}
            className={`flex items-baseline justify-between gap-4 ${row.emphasis ? "mt-1 border-t border-slate-200 pt-3 pb-1.5" : "py-1.5"}`}
          >
            <dt className={`text-sm ${row.emphasis ? "font-semibold text-slate-900" : row.muted ? "text-slate-400" : "text-slate-500"}`}>{row.label}</dt>
            <dd className={`tabular-nums ${row.emphasis ? "text-xl font-semibold tracking-tight" : "text-sm font-medium"} ${toneClass(row)}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {footer && <div className="border-t border-slate-200/70 px-4 py-2.5 text-xs text-slate-500">{footer}</div>}
    </div>
  );
};

export default SummaryPanel;
