"use client";
import { Building2, Check, Clock, Plus } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";

/**
 * ✅ Customer এর Saved Receiver Card — একটা বাছলে Form এ তার সব তথ্য বসে যায়
 * value: Beneficiary id অথবা "new"
 */
const ReceiverPicker = ({ receivers = [], value, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-[74px] animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  const cardClass = (active) =>
    `relative flex w-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      active ? "border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500" : "border-slate-200 bg-white hover:border-slate-300"
    }`;

  return (
    <div role="radiogroup" aria-label="Receiver" className="grid gap-2 sm:grid-cols-2">
      {receivers.map((r) => {
        const active = value === r._id;
        return (
          <button key={r._id} type="button" role="radio" aria-checked={active} onClick={() => onSelect(r)} className={cardClass(active)}>
            {active && <Check className="absolute right-3 top-3 h-4 w-4 text-indigo-600" />}
            <span className="pr-6 text-sm font-semibold text-slate-900">{r.name}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{[r.bankName, r.accountNumber].filter(Boolean).join(" · ") || "No bank details"}</span>
            </span>
            {r.lastSentAt && (
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="h-3 w-3 shrink-0" />
                Last {r.currency?.code} {formatNumber(r.lastAmount, r.currency?.decimals ?? 2)} · {formatDate(r.lastSentAt)}
              </span>
            )}
          </button>
        );
      })}
      <button type="button" role="radio" aria-checked={value === "new"} onClick={() => onSelect(null)} className={`${cardClass(value === "new")} justify-center`}>
        <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
          <Plus className="h-4 w-4" />
          New receiver
        </span>
        <span className="text-xs text-slate-500">{receivers.length ? "Someone not in this list" : "No saved receivers yet"}</span>
      </button>
    </div>
  );
};

export default ReceiverPicker;
