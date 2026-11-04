"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import { formatNumber } from "@/lib/format";

/** গোনা থেকে Backend এর জন্য — [{ currency, counted }] (খালি ঘর বাদ) */
export const toCurrencyCounts = (counts) =>
  Object.entries(counts)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([currency, counted]) => ({ currency, counted: Number(counted) }));

/** Drawer এ যে Currency আছে সেগুলো না গুনলে — প্রথমটার নাম */
export const missingCurrencyCount = (holdings, counts) => holdings.find((h) => counts[h.currency] === undefined || counts[h.currency] === "")?.currencyCode;

/**
 * ✅ Drawer এর Foreign Currency গোনা — RM এর পাশাপাশি
 * holdings: [{ currency, currencyCode, name, decimals, qty }] — System এ যা আছে (গোনা বাধ্যতামূলক)
 * counts: { [currencyId]: "গোনা" } ; অন্য Currency পাওয়া গেলে "Found another currency" দিয়ে যোগ করা যায়
 * গরমিল গড় খরচে RM এ হিসাব হয় (Server এ) — RM এর গরমিলের সাথে যোগ হয়ে অনুমোদনের সীমার সাথে মেলে
 * blind — Cashier এর গোনা: System এর সংখ্যা ও গরমিল দেখায় না; allowExtra — অন্য Currency যোগ করা যায়
 */
const CurrencyCountInputs = ({ holdings = [], counts, onChange, error, blind = false, allowExtra = true }) => {
  const { data: boardData } = useGetRateBoardQuery();
  const [extra, setExtra] = useState([]); // System এ নেই কিন্তু পাওয়া গেছে
  const [adding, setAdding] = useState("");

  const all = (boardData?.data || []).map((b) => b.currency);
  const heldIds = new Set(holdings.map((h) => h.currency));
  const extraRows = extra.map((id) => {
    const c = all.find((x) => x._id === id);
    return { currency: id, currencyCode: c?.code || "?", name: c?.name || "", decimals: c?.decimals ?? 2, qty: 0 };
  });
  const rows = [...holdings, ...extraRows];
  const addable = allowExtra ? all.filter((c) => !heldIds.has(c._id) && !extra.includes(c._id)) : [];
  const set = (id, value) => onChange({ ...counts, [id]: value });

  if (rows.length === 0 && addable.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <p className="text-[13px] font-semibold text-slate-800">Foreign currency in the drawer</p>
        {rows.length > 0 && <p className="text-xs text-slate-500">Count every note</p>}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-slate-500">{blind ? "Found foreign currency? Add it here." : "The system shows no foreign currency in this drawer."}</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((r) => {
            const value = counts[r.currency] ?? "";
            const diff = value === "" || blind ? null : Math.round((Number(value) - r.qty) * 10000) / 10000;
            const isExtra = !heldIds.has(r.currency);
            return (
              <div key={r.currency} className="grid grid-cols-[64px_1fr_120px] items-center gap-3 px-4 py-2.5 sm:grid-cols-[64px_1fr_140px_110px]">
                <span className="flex h-8 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-700">{r.currencyCode}</span>
                <span className="min-w-0 text-xs text-slate-500">
                  {blind ? r.name : `System ${formatNumber(r.qty, r.decimals)}`}
                  {isExtra && (
                    <button
                      type="button"
                      onClick={() => {
                        setExtra((p) => p.filter((x) => x !== r.currency));
                        set(r.currency, "");
                      }}
                      className="ml-2 inline-flex items-center text-slate-400 hover:text-rose-600" aria-label={`Remove ${r.currencyCode}`}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  aria-label={`${r.currencyCode} counted`}
                  placeholder="Counted"
                  value={value}
                  onChange={(e) => set(r.currency, e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-right text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                />
                {!blind && (
                  <span className={`col-span-3 text-right text-xs font-semibold tabular-nums sm:col-span-1 ${diff === null ? "text-slate-300" : diff === 0 ? "text-emerald-700" : diff > 0 ? "text-amber-700" : "text-rose-600"}`}>
                    {diff === null ? "—" : diff === 0 ? "Matches" : `${diff > 0 ? "+" : "−"} ${formatNumber(Math.abs(diff), r.decimals)} ${diff > 0 ? "over" : "short"}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {addable.length > 0 && (
        <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5">
          <select
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
            aria-label="Currency found in the drawer"
            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Found another currency?</option>
            {addable.map((c) => (
              <option key={c._id} value={c._id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!adding}
            onClick={() => {
              setExtra((p) => [...p, adding]);
              setAdding("");
            }}
            className="flex items-center gap-1 text-[13px] font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-300"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      )}
      {error && <p className="px-4 pb-3 text-xs font-medium text-rose-600">{error}</p>}
      {!blind && (
        <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
          Differences are valued at average cost and added to the RM difference — above the approval limit, a manager must approve.
        </p>
      )}
    </div>
  );
};

export default CurrencyCountInputs;
