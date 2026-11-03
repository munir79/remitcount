"use client";
import { useState } from "react";
import { Calculator } from "lucide-react";
import { formatMoney } from "@/lib/format";
import Input from "../ui/Input";
import Button from "../ui/Button";

// Malaysian Ringgit — Note ও Coin
const DENOMINATIONS = [100, 50, 20, 10, 5, 1, 0.5, 0.2, 0.1, 0.05];
const denomLabel = (d) => (d >= 1 ? `RM ${d}` : `${Math.round(d * 100)} sen`);

/**
 * ✅ Drawer এর টাকা গোনা — মোট লিখুন, অথবা Note/Coin গুনে দিন (নিজে যোগ করে)
 * onChange(totalString) — কিছু না লিখলে ""
 * Parent এ key বদলালে নতুন করে শুরু হয়
 */
const CashCountInput = ({ id, label = "Cash counted", value, onChange, error, hint }) => {
  const [mode, setMode] = useState("total");
  const [counts, setCounts] = useState({});

  const setCount = (d, raw) => {
    const next = { ...counts, [d]: raw };
    setCounts(next);
    const any = Object.values(next).some((c) => c !== "" && c !== undefined);
    const total = DENOMINATIONS.reduce((sum, x) => sum + x * (Number(next[x]) || 0), 0);
    onChange(any ? String(Math.round(total * 100) / 100) : "");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        {mode === "total" ? (
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            label={label}
            required
            prefix="RM"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            hint={hint}
            className="flex-1"
          />
        ) : (
          <p className="text-sm font-medium text-slate-700">{label} — notes & coins</p>
        )}
        <Button
          type="button"
          variant={mode === "notes" ? "soft" : "secondary"}
          onClick={() => {
            setMode((m) => (m === "total" ? "notes" : "total"));
            setCounts({});
            onChange("");
          }}
        >
          <Calculator className="h-4 w-4" />
          {mode === "notes" ? "Enter total" : "Count notes"}
        </Button>
      </div>

      {mode === "notes" && (
        <div className="rounded-xl border border-slate-200">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4">
            {DENOMINATIONS.map((d) => (
              <label key={d} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-right text-sm font-medium tabular-nums text-slate-600">{denomLabel(d)}</span>
                <span className="text-slate-300">×</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  aria-label={`Count of ${denomLabel(d)}`}
                  value={counts[d] ?? ""}
                  onChange={(e) => setCount(d, e.target.value)}
                  className="h-9 w-full min-w-0 rounded-lg border border-slate-300 px-2.5 text-right text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                />
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-sm">
            <span className="text-slate-500">Counted total</span>
            <span className="font-semibold tabular-nums text-slate-900">{formatMoney(Number(value) || 0)}</span>
          </div>
          {error && <p className="px-4 pb-3 text-xs font-medium text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
};

/** গোনা − System — মিলল / বেশি / কম; সীমার বেশি হলে কী হবে সেটাও বলে */
export const CashDifference = ({ counted, system, limit, canManage, action = "close" }) => {
  if (counted === "" || counted === null || counted === undefined || !Number.isFinite(Number(counted))) return null;
  const diff = Math.round((Number(counted) - Number(system || 0)) * 100) / 100;
  const over = Math.abs(diff) > Number(limit ?? 0);
  const tone = diff === 0 ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20" : over ? "bg-rose-50 text-rose-800 ring-rose-600/20" : "bg-amber-50 text-amber-800 ring-amber-600/20";

  return (
    <div className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold">{diff === 0 ? "Cash matches the system" : diff > 0 ? "Cash over" : "Cash short"}</span>
        {diff !== 0 && (
          <span className="font-semibold tabular-nums">
            {diff > 0 ? "+" : "−"} {formatMoney(Math.abs(diff))}
          </span>
        )}
      </div>
      {diff !== 0 && (
        <p className="mt-1 text-xs">
          {!over
            ? `Within the RM ${Number(limit).toFixed(2)} limit — recorded automatically in Cash Over/Short.`
            : canManage
              ? `More than the RM ${Number(limit).toFixed(2)} limit — as a manager, your ${action} will approve it.`
              : action === "open"
                ? `More than the RM ${Number(limit).toFixed(2)} limit — ask your manager to open this drawer.`
                : `More than the RM ${Number(limit).toFixed(2)} limit — your manager must approve before the session closes.`}
        </p>
      )}
    </div>
  );
};

export default CashCountInput;
