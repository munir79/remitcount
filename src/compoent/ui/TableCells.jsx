import { CheckCircle2, XCircle } from "lucide-react";
import Badge from "./Badge";
import Button from "./Button";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";

// সব List Table এ একই Cell Style
export const TD = "px-4 py-3.5 align-middle";

export const STATUS_VARIANT = {
  Draft: "warning",
  Posted: "success",
  Cancelled: "neutral",
  Reversed: "neutral",
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  Paid: "success",
  Partial: "info",
  Unpaid: "warning",
  Open: "success",
  Closed: "neutral",
  active: "success",
  inactive: "neutral",
};

/** Document নম্বর + নিচে তারিখ */
export const DocCell = ({ number, date }) => (
  <td className={TD}>
    <p className="font-mono text-[13px] font-semibold text-slate-900">{number}</p>
    {date && <p className="mt-0.5 text-xs text-slate-500">{formatDate(date)}</p>}
  </td>
);

/** নাম + নিচে ছোট লেখা (যেমন Phone, Currency) */
export const PartyCell = ({ name, sub }) => (
  <td className={TD}>
    <p className="font-medium text-slate-800">{name || "—"}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
  </td>
);

/** MYR Amount — ডানে Align, tone="profit" দিলে লাভ সবুজ / ক্ষতি লাল */
export const MoneyCell = ({ value, tone, strong = false, sub }) => {
  const n = Number(value || 0);
  const color = tone === "profit" ? (n >= 0 ? "text-emerald-600" : "text-rose-600") : strong ? "text-slate-900" : "text-slate-700";
  return (
    <td className={`${TD} text-right`}>
      <p className={`whitespace-nowrap tabular-nums ${strong || tone ? "font-semibold" : ""} ${color}`}>{formatMoney(n)}</p>
      {sub && <p className="mt-0.5 whitespace-nowrap text-xs text-slate-500">{sub}</p>}
    </td>
  );
};

/** Foreign Amount — "USD" ছোট করে, সংখ্যা ডানে */
export const ForeignAmountCell = ({ value, currency, sub }) => (
  <td className={`${TD} text-right`}>
    <p className="whitespace-nowrap tabular-nums text-slate-700">
      <span className="mr-1 text-xs font-medium text-slate-400">{currency}</span>
      {formatNumber(value)}
    </p>
    {sub && <p className="mt-0.5 whitespace-nowrap text-xs text-slate-500">{sub}</p>}
  </td>
);

export const StatusCell = ({ status, extra }) => (
  <td className={TD}>
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={STATUS_VARIANT[status] || "neutral"}>{status}</Badge>
      {extra}
    </div>
  </td>
);

/**
 * ✅ Draft হলে "Post" Button, Cancel করা গেলে লাল ✕ Button
 */
export const DocActionsCell = ({ canPost, onPost, canCancel, onCancel, children }) => (
  // Row Click (Detail খোলা) যেন Action Button চাপলে না হয়
  <td className={`${TD} text-right`} onClick={(e) => e.stopPropagation()}>
    <div className="flex items-center justify-end gap-1.5">
      {children}
      {canPost && (
        <Button size="xs" variant="soft" onClick={onPost}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Post
        </Button>
      )}
      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          title="Cancel"
          aria-label="Cancel"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  </td>
);
