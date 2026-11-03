import { formatDateTime, formatMoney } from "@/lib/format";
import { ringgitInWords } from "@/lib/amountInWords";
import { APP_NAME } from "@/lib/brand";

const Row = ({ label, value, strong = false, compact }) => (
  <div className={`flex items-baseline justify-between gap-4 ${compact ? "py-0.5" : "py-1.5"}`}>
    <span className="text-slate-500">{label}</span>
    <span className={`text-right ${strong ? "font-semibold text-slate-900" : "text-slate-800"}`}>{value}</span>
  </div>
);

/**
 * ✅ খরচের Payment Voucher — কী খরচ, কাকে, কত, কোথা থেকে; কে বানালেন / অনুমোদন দিলেন, টাকা যিনি নিলেন তাঁর সই
 * variant: "a4" অথবা "thermal" (80mm)
 */
const ExpenseVoucher = ({ voucher, variant = "a4" }) => {
  const compact = variant === "thermal";
  const v = voucher;
  const isCancelled = v.status === "Cancelled";

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
          <p className={`font-bold ${compact ? "text-[13px]" : "text-lg"}`}>{v.company?.name || APP_NAME}</p>
          {v.branch?.name && <p className="text-slate-600">{v.branch.name}</p>}
          {(v.branch?.address || v.company?.address) && <p className="text-slate-500">{v.branch?.address || v.company?.address}</p>}
          {(v.branch?.phone || v.company?.phone) && <p className="text-slate-500">Tel: {v.branch?.phone || v.company?.phone}</p>}
        </div>
        <div className={compact ? "mt-2 border-y border-dashed border-slate-400 py-1" : "shrink-0 text-right"}>
          <p className={`font-semibold uppercase tracking-wide ${compact ? "text-[12px]" : "text-[13px] text-indigo-700"}`}>Payment voucher</p>
          <p className={compact ? "" : "mt-1 font-mono text-base font-semibold"}>No: {v.voucherNumber}</p>
          <p className="text-slate-500">{formatDateTime(v.date)}</p>
        </div>
      </header>

      <div className={compact ? "border-t border-dashed border-slate-400 py-2" : "mt-5 rounded-lg border border-slate-200 p-4"}>
        <Row compact={compact} label="Expense" value={v.expenseType} strong />
        <Row compact={compact} label="Class" value={v.classification === "Admin" ? "Admin expense" : "Direct expense"} />
        {v.account && <Row compact={compact} label="Account" value={v.account} />}
        {v.paidTo && <Row compact={compact} label="Paid to" value={v.paidTo} />}
        {v.description && <Row compact={compact} label="Description" value={v.description} />}
        <Row compact={compact} label="Paid from" value={`${v.paidFrom}${v.paymentMethod ? ` (${v.paymentMethod})` : ""}`} />
        <div className={`mt-2 flex items-baseline justify-between gap-4 border-t pt-2 ${compact ? "border-dashed border-slate-400" : "border-slate-300"}`}>
          <span className="font-semibold">AMOUNT</span>
          <span className={`font-bold tabular-nums ${compact ? "text-[13px]" : "text-xl"}`}>{formatMoney(v.amount)}</span>
        </div>
        <p className={`mt-1 text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>{ringgitInWords(v.amount)}</p>
      </div>

      <footer className={compact ? "border-t border-dashed border-slate-400 pt-2" : "mt-10"}>
        {compact ? (
          <>
            <p>Prepared by {v.preparedBy}</p>
            {v.approvedBy && <p>Approved by {v.approvedBy}</p>}
            <p className="mt-4 border-t border-slate-400 pt-1">Received by</p>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-8 text-xs text-slate-500">
            <div>
              <div className="flex h-10 items-end border-b border-slate-400 pb-1 text-slate-800">{v.preparedBy}</div>
              <p className="mt-1">Prepared by</p>
            </div>
            <div>
              <div className="flex h-10 items-end border-b border-slate-400 pb-1 text-slate-800">{v.approvedBy}</div>
              <p className="mt-1">Approved by</p>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400" />
              <p className="mt-1">Received by (signature)</p>
            </div>
          </div>
        )}
      </footer>
    </article>
  );
};

export default ExpenseVoucher;
