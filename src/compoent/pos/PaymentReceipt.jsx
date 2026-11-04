import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { ringgitInWords } from "@/lib/amountInWords";
import { APP_NAME } from "@/lib/brand";

/**
 * ✅ Payment In এর রসিদ / Payment Out এর Voucher — কোন বিলে কত শোধ, কত বাকি থাকলো
 * variant: "a4" অথবা "thermal" (80mm); direction: "in" | "out"
 */
const PaymentReceipt = ({ receipt, direction, variant = "a4" }) => {
  const compact = variant === "thermal";
  const r = receipt;
  const isIn = direction === "in";
  const isCancelled = r.status === "Cancelled";
  const small = compact ? "text-[10px]" : "text-xs";

  return (
    <article
      className={`relative mx-auto bg-white text-slate-900 ${
        compact ? "w-[72mm] px-1 py-2 font-mono text-[11px] leading-snug" : "w-full max-w-[720px] rounded-2xl border border-slate-200 p-8 text-sm shadow-card print:rounded-none print:border-0 print:p-0 print:shadow-none"
      }`}
    >
      {isCancelled && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="-rotate-12 rounded-lg border-4 border-rose-500/60 px-6 py-2 text-4xl font-bold uppercase tracking-widest text-rose-500/60">Cancelled</span>
        </div>
      )}

      <header className={compact ? "pb-2 text-center" : "flex items-start justify-between gap-6 border-b border-slate-200 pb-5"}>
        <div className={compact ? "" : "min-w-0"}>
          <p className={`font-bold ${compact ? "text-[13px]" : "text-lg"}`}>{r.company?.name || APP_NAME}</p>
          {r.branch?.name && <p className="text-slate-600">{r.branch.name}</p>}
          {(r.branch?.address || r.company?.address) && <p className="text-slate-500">{r.branch?.address || r.company?.address}</p>}
          {(r.branch?.phone || r.company?.phone) && <p className="text-slate-500">Tel: {r.branch?.phone || r.company?.phone}</p>}
        </div>
        <div className={compact ? "mt-2 border-y border-dashed border-slate-400 py-1" : "shrink-0 text-right"}>
          <p className={`font-semibold uppercase tracking-wide ${compact ? "text-[12px]" : "text-[13px] text-indigo-700"}`}>{isIn ? "Payment receipt" : "Payment voucher"}</p>
          <p className={compact ? "" : "mt-1 font-mono text-base font-semibold"}>No: {r.receiptNumber}</p>
          <p className="text-slate-500">{formatDateTime(r.date)}</p>
        </div>
      </header>

      {r.party?.name && (
        <section className={compact ? "border-t border-dashed border-slate-400 py-2" : "mt-5 rounded-lg border border-slate-200 p-4"}>
          <h3 className={`font-semibold uppercase tracking-wide text-slate-500 ${compact ? "mb-1 text-[10px]" : "mb-2 text-[11px]"}`}>{isIn ? "Received from" : "Paid to"}</h3>
          <p className="font-semibold">{r.party.name}</p>
          {r.party.phone && <p className="text-slate-600">{r.party.phone}</p>}
        </section>
      )}

      {r.allocations?.length > 0 && (
        <div className={compact ? "border-t border-dashed border-slate-400 py-2" : "mt-5 rounded-lg border border-slate-200 p-4"}>
          <div className={`flex justify-between gap-4 pb-1 font-semibold uppercase tracking-wide text-slate-500 ${compact ? "text-[10px]" : "text-[11px]"}`}>
            <span>For</span>
            <span>Paid</span>
          </div>
          {r.allocations.map((a, i) => (
            <div key={i} className={compact ? "py-0.5" : "py-1.5"}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-slate-800">{a.number || a.label}</span>
                <span className="tabular-nums text-slate-800">{formatMoney(a.amount)}</span>
              </div>
              <p className={`text-slate-500 ${small}`}>
                {a.date ? `${a.label} · ${formatDate(a.date)}` : "From before the system"}
                {a.dueAfter > 0 ? ` · ${formatMoney(a.dueAfter)} left on this` : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className={compact ? "border-t border-dashed border-slate-400 py-2" : "mt-4 rounded-lg bg-slate-50 p-4 print:border print:border-slate-200 print:bg-transparent"}>
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-semibold">{isIn ? "RECEIVED" : "PAID"}</span>
          <span className={`font-bold tabular-nums ${compact ? "text-[13px]" : "text-xl"}`}>{formatMoney(r.amount)}</span>
        </div>
        <p className={`mt-1 text-slate-500 ${small}`}>{ringgitInWords(r.amount)}</p>
        <p className={`mt-1 text-slate-600 ${small}`}>
          {r.method === "Bank" ? "By bank" : "In cash"}
          {r.moneyAccount ? ` — ${r.moneyAccount}` : ""}
        </p>
        {r.partyDueAfter !== null && r.partyDueAfter !== undefined && (
          <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-slate-200 pt-2">
            <span className="text-slate-500">{isIn ? "Balance still due" : "Still to pay"}</span>
            <span className="font-semibold tabular-nums">{formatMoney(r.partyDueAfter)}</span>
          </div>
        )}
        {r.notes && <p className={`mt-1 text-slate-500 ${small}`}>{r.notes}</p>}
      </div>

      <footer className={compact ? "border-t border-dashed border-slate-400 pt-2 text-center" : "mt-8"}>
        {!compact && (
          <div className="grid grid-cols-2 gap-10 text-xs text-slate-500">
            <div>
              <div className="h-10 border-b border-slate-400" />
              <p className="mt-1">{isIn ? "Customer signature" : "Received by (signature)"}</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400" />
              <p className="mt-1">Served by {r.cashier}</p>
            </div>
          </div>
        )}
        {compact && <p>Served by {r.cashier}</p>}
        {isIn && <p className={`text-slate-500 ${compact ? "mt-1 text-[10px]" : "mt-6 text-center text-xs"}`}>Thank you!</p>}
      </footer>
    </article>
  );
};

export default PaymentReceipt;
