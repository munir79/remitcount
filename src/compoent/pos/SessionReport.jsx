"use client";
import { useAuth } from "@/hooks/useAuth";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import Badge from "../ui/Badge";

export const SESSION_STATUS = {
  Open: { label: "Open", variant: "success" },
  PendingApproval: { label: "Waiting for approval", variant: "warning" },
  Closed: { label: "Closed", variant: "neutral" },
};

const Row = ({ label, value, strong, tone = "text-slate-800", sub }) => (
  <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
    <span className={strong ? "font-semibold text-slate-900" : "text-slate-600"}>
      {label}
      {sub && <span className="ml-1.5 text-xs text-slate-400">{sub}</span>}
    </span>
    <span className={`tabular-nums ${strong ? "font-semibold" : ""} ${tone}`}>{value}</span>
  </div>
);

/**
 * ✅ Foreign Currency গোনা — খোলা আর বন্ধের সময়; গরমিলের RM মূল্য (গড় খরচে) শুধু Admin দেখেন
 */
const CurrencyCounts = ({ title, rows, showValue }) =>
  rows?.length ? (
    <div className="rounded-xl border border-slate-200 px-4 py-2 print:border-slate-400">
      <p className="py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.currencyCode} className="flex items-baseline justify-between gap-4 py-2 text-sm">
            <span className="text-slate-600">
              <span className="font-mono font-semibold text-slate-800">{r.currencyCode}</span>
              <span className="ml-2 text-xs text-slate-400">
                system {formatNumber(r.systemQty)} · counted {formatNumber(r.countedQty)}
              </span>
            </span>
            <span className={`tabular-nums font-semibold ${!r.varianceQty ? "text-emerald-700" : r.varianceQty > 0 ? "text-sky-700" : "text-rose-600"}`}>
              {!r.varianceQty ? "Matches" : `${r.varianceQty > 0 ? "+" : "−"} ${formatNumber(Math.abs(r.varianceQty))} ${r.varianceQty > 0 ? "over" : "short"}`}
              {showValue && r.varianceMYR ? <span className="ml-2 text-xs font-normal text-slate-500">({formatMoney(r.varianceMYR)})</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  ) : null;

/**
 * ✅ Session এর হিসাব — Opening (গোনা) + ঢোকা − বের হওয়া = Expected; গোনা আর পার্থক্য
 * summary = Backend getSessionSummary: { session, lines, totalIn, totalOut, expected, approvalLimit }
 * counted দিলে (বন্ধের সময় Live) সেটাই দেখায়; না দিলে Session এ Save করা গোনা
 * summary.blind — Cashier এর Session বন্ধ হয়নি: System এর সংখ্যা আসে না, শুধু কে / কখন
 */
const SessionReport = ({ summary, counted }) => {
  const { hasPermission } = useAuth();
  const s = summary.session;
  const status = SESSION_STATUS[s.status] || SESSION_STATUS.Open;
  const countedValue = counted !== undefined && counted !== "" ? Number(counted) : s.closingPhysicalCash;
  const hasCount = countedValue !== null && countedValue !== undefined && Number.isFinite(Number(countedValue));
  // বন্ধ Session এ System এর Save করা হিসাব (তখনকার), খোলা থাকলে Ledger থেকে এখনকার
  const expected = s.status === "Open" ? summary.expected : s.closingSystemBalance ?? summary.expected;
  const diff = hasCount ? Math.round((Number(countedValue) - expected) * 100) / 100 : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3 print:bg-transparent print:p-0">
        <div>
          <p className="text-xs text-slate-500">Cashier</p>
          <p className="font-semibold text-slate-900">{s.cashier?.name}</p>
          <p className="text-xs text-slate-500">{[s.cashAccount?.name, s.branch?.name].filter(Boolean).join(" · ")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Opened</p>
          <p className="font-medium text-slate-900">{formatDateTime(s.openedAt)}</p>
          {s.assignedBy && <p className="text-xs text-slate-500">Assigned by {s.assignedBy.name}</p>}
        </div>
        <div>
          <p className="text-xs text-slate-500">Status</p>
          <Badge variant={status.variant}>{status.label}</Badge>
          {s.closedAt && <p className="mt-1 text-xs text-slate-500">Closed {formatDateTime(s.closedAt)}</p>}
        </div>
      </div>

      {summary.blind ? (
        <p className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">The figures appear here after the session is closed.</p>
      ) : (
      <>
      <div className="rounded-xl border border-slate-200 px-4 py-1 print:border-slate-400">
        <div className="divide-y divide-slate-100">
          <Row
            label="Opening (counted)"
            value={formatMoney(s.openingBalance)}
            sub={
              [
                s.openingVariance ? `system was ${formatMoney(s.openingSystemBalance)} (${s.openingVariance > 0 ? "+" : "−"}${formatMoney(Math.abs(s.openingVariance))})` : "",
                s.openingGiven ? `includes ${formatMoney(s.openingGiven)} given` : "",
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          />
          {summary.lines.length === 0 ? (
            <Row label="No cash transactions" value="—" tone="text-slate-400" />
          ) : (
            summary.lines.map((l) => (
              <div key={l.key} className="py-2 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-slate-600">
                    {l.label}
                    <span className="ml-1.5 text-xs text-slate-400">× {l.count}</span>
                  </span>
                  <span className="flex gap-4 tabular-nums">
                    {l.cashIn > 0 && <span className="text-emerald-700">+ {formatMoney(l.cashIn)}</span>}
                    {l.cashOut > 0 && <span className="text-rose-600">− {formatMoney(l.cashOut)}</span>}
                  </span>
                </div>
              </div>
            ))
          )}
          <Row label="Expected in drawer" value={formatMoney(expected)} strong />
          <Row label="Counted" value={hasCount ? formatMoney(countedValue) : "—"} tone={hasCount ? "text-slate-900" : "text-slate-400"} />
          {diff !== null && (
            <Row
              label={diff === 0 ? "Difference" : diff > 0 ? "Cash over" : "Cash short"}
              value={diff === 0 ? "Matches" : `${diff > 0 ? "+" : "−"} ${formatMoney(Math.abs(diff))}`}
              strong
              tone={diff === 0 ? "text-emerald-700" : diff > 0 ? "text-sky-700" : "text-rose-600"}
            />
          )}
        </div>
      </div>

      <CurrencyCounts title="Foreign currency — opening count" rows={s.openingCurrencyCounts} showValue={hasPermission("rate:update")} />
      <CurrencyCounts
        title={s.status === "PendingApproval" ? "Foreign currency — closing count (waiting for approval)" : "Foreign currency — closing count"}
        rows={s.closingCurrencyCounts}
        showValue={hasPermission("rate:update")}
      />

      {(s.approvedBy || s.reviewNote) && (
        <p className="text-xs text-slate-500">
          {s.approvedBy ? `Difference approved by ${s.approvedBy.name}${s.approvedAt ? ` on ${formatDateTime(s.approvedAt)}` : ""}` : "Manager note"}
          {s.reviewNote ? ` — "${s.reviewNote}"` : ""}
        </p>
      )}
      </>
      )}
    </div>
  );
};

export default SessionReport;
