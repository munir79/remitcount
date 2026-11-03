import { describeInverse, describeRate } from "@/lib/currencyMath";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { ringgitInWords } from "@/lib/amountInWords";
import { APP_NAME } from "@/lib/brand";

const Row = ({ label, value, strong = false, compact }) => (
  <div className={`flex items-baseline justify-between gap-4 ${compact ? "py-0.5" : "py-1.5"}`}>
    <span className="text-slate-500">{label}</span>
    <span className={`text-right tabular-nums ${strong ? "font-semibold text-slate-900" : "text-slate-800"}`}>{value}</span>
  </div>
);

/**
 * ✅ Buy Receipt — Customer কে দেওয়ার কপি: কত Foreign দিলেন, কোন Rate, কত RM পেলেন
 * variant: "a4" অথবা "thermal" (80mm); আমাদের খরচ / গড় খরচ কখনো আসে না (Backend এ নেই)
 */
const BuyReceipt = ({ receipt, variant = "a4" }) => {
  const compact = variant === "thermal";
  const r = receipt;
  const currency = r.currency || { code: r.currencyCode, quoteStyle: r.quoteStyle };
  const decimals = r.currency?.decimals ?? 2;
  const isCancelled = r.status === "Cancelled";
  const box = compact ? "border-t border-dashed border-slate-400 py-2" : "mt-5 rounded-lg border border-slate-200 p-4";

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
          <p className={`font-semibold uppercase tracking-wide ${compact ? "text-[12px]" : "text-[13px] text-indigo-700"}`}>Currency Purchase</p>
          <p className={compact ? "" : "mt-1 font-mono text-base font-semibold"}>No: {r.receiptNumber}</p>
          <p className="text-slate-500">{formatDateTime(r.createdAt || r.date)}</p>
        </div>
      </header>

      <section className={compact ? "border-t border-dashed border-slate-400 py-2" : "mt-5 rounded-lg border border-slate-200 p-4"}>
        <h3 className={`font-semibold uppercase tracking-wide text-slate-500 ${compact ? "mb-1 text-[10px]" : "mb-2 text-[11px]"}`}>Customer</h3>
        <p className="font-semibold">{r.customer?.name}</p>
        {r.customer?.phone && <p className="text-slate-600">{r.customer.phone}</p>}
        {r.customer?.idNumberMasked && (
          <p className="text-slate-600">
            {r.customer.idType || "ID"}: {r.customer.idNumberMasked}
          </p>
        )}
        {r.customer?.nationality && <p className="text-slate-600">{r.customer.nationality}</p>}
      </section>

      <div className={box}>
        <Row compact={compact} label="Currency received from you" value={`${r.currencyCode} ${formatNumber(r.foreignAmount, decimals)}`} strong />
        <Row compact={compact} label="Exchange rate" value={describeRate(r.rate, currency)} />
        <Row compact={compact} label="" value={describeInverse(r.rate, currency)} />
        <Row compact={compact} label="Value (MYR)" value={formatMoney(r.valueMYR)} />
        <Row compact={compact} label="Service fee" value={`− ${formatMoney(r.fee)}`} />
        <div className={`mt-1 flex items-baseline justify-between gap-4 border-t pt-2 ${compact ? "border-dashed border-slate-400" : "border-slate-300"}`}>
          <span className="font-semibold">YOU RECEIVE</span>
          <span className={`font-bold tabular-nums ${compact ? "text-[13px]" : "text-xl"}`}>{formatMoney(r.total)}</span>
        </div>
        <p className={`mt-1 text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>{ringgitInWords(r.total)}</p>
      </div>

      <div className={compact ? "border-t border-dashed border-slate-400 py-2" : "mt-4 rounded-lg bg-slate-50 p-4 print:border print:border-slate-200 print:bg-transparent"}>
        {r.payments?.map((p, i) => (
          <Row key={i} compact={compact} label={p.method === "Bank" ? "Paid by bank transfer" : "Paid in cash"} value={formatMoney(p.amount)} />
        ))}
        <Row compact={compact} label="Total paid to you" value={formatMoney(r.paidAmount)} strong={Number(r.dueAmount) <= 0} />
        {Number(r.dueAmount) > 0 && <Row compact={compact} label="Still to pay you" value={formatMoney(r.dueAmount)} strong />}
      </div>

      <footer className={compact ? "border-t border-dashed border-slate-400 pt-2 text-center" : "mt-8"}>
        {!compact && (
          <div className="grid grid-cols-2 gap-10 text-xs text-slate-500">
            <div>
              <div className="h-10 border-b border-slate-400" />
              <p className="mt-1">Customer signature</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400" />
              <p className="mt-1">Served by {r.cashier}</p>
            </div>
          </div>
        )}
        {compact && <p>Served by {r.cashier}</p>}
        <p className={`text-slate-500 ${compact ? "mt-1 text-[10px]" : "mt-6 text-center text-xs"}`}>Please count your money before leaving the counter. Thank you!</p>
      </footer>
    </article>
  );
};

export default BuyReceipt;
