"use client";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCheck, RotateCcw, Save } from "lucide-react";
import { useUpdateRateBoardMutation } from "@/redux/features/rate/rateApi";
import { describeInverse, isSpreadValid, profitPerThousand, QUOTE_STYLE, rateUnitLabel } from "@/lib/currencyMath";
import { formatDateTime, formatMoney, isBusinessToday, timeAgo } from "@/lib/format";
import Button from "../ui/Button";
import ConfirmDialog from "../ui/ConfirmDialog";

const FIELDS = [
  { key: "buyRate", label: "We buy", hint: "Customer sells to us" },
  { key: "sellRate", label: "We sell", hint: "Customer buys from us" },
  { key: "sendRate", label: "Send", hint: "Remittance rate" },
];

const toDraft = (board) =>
  Object.fromEntries(
    board.map((row) => [row.currency._id, Object.fromEntries(FIELDS.map((f) => [f.key, row[f.key] == null ? "" : String(row[f.key])]))])
  );

const toNumberOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const hasAnyRate = (row) => FIELDS.some((f) => row[f.key] != null);

const rateInputClass = (hasError) =>
  `h-10 w-full rounded-lg border bg-white px-3 text-right text-sm tabular-nums text-slate-900 shadow-[0_1px_2px_rgb(16_24_40/0.04)] placeholder:text-slate-300 focus:outline-none focus:ring-4 ${
    hasError ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15" : "border-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/15"
  }`;

/**
 * ✅ Send Rate কি সব Supplier এর চেয়েও খারাপ? — সবচেয়ে ভালো Supplier ধরেও প্রতি RM 1,000 এ লোকসান হলে সেই পরিমাণ
 * Supplier এর Fee ধরা হয় না (Fee প্রতি Send এ, Amount এর উপর না)
 */
const sendLossPerThousand = (sendRate, currency, suppliersForCurrency) => {
  if (!(Number(sendRate) > 0) || suppliersForCurrency.length === 0) return null;
  const best = Math.max(...suppliersForCurrency.map((s) => profitPerThousand(sendRate, s.rate, currency.quoteStyle) ?? -Infinity));
  return best < 0 ? -best : null;
};

/**
 * ✅ Rate Board Edit — সব Currency এক Table এ, "Save changes" একবারে সব
 * Parent key বদলালে (Save এর পর নতুন Data) Draft আবার Server থেকে ভরে যায়
 * supplierRates — Send Rate এ লোকসান হচ্ছে কিনা দেখানোর জন্য (শুধু Admin এর কাছে আসে)
 */
const RateBoardEditor = ({ board, canEdit, supplierRates = [], onReload }) => {
  const [updateRateBoard, { isLoading }] = useUpdateRateBoardMutation();
  const [initial] = useState(() => toDraft(board));
  const [draft, setDraft] = useState(initial);
  const [lossConfirm, setLossConfirm] = useState(null); // সতর্কতা দেখিয়ে Save — লোকসানের Currency গুলো

  const setValue = (currencyId, field, value) => setDraft((prev) => ({ ...prev, [currencyId]: { ...prev[currencyId], [field]: value } }));

  const changedRows = board.filter((row) => FIELDS.some((f) => draft[row.currency._id]?.[f.key] !== initial[row.currency._id]?.[f.key]));
  const rowError = (row) => {
    const d = draft[row.currency._id];
    for (const f of FIELDS) {
      const v = d[f.key];
      if (v !== "" && !(Number(v) > 0)) return `${f.label} rate must be greater than 0`;
    }
    if (!isSpreadValid(toNumberOrNull(d.buyRate), toNumberOrNull(d.sellRate), row.currency.quoteStyle)) {
      return row.currency.quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN
        ? "Buy rate is higher than sell rate — every exchange would make a loss"
        : "Buy rate is lower than sell rate — every exchange would make a loss";
    }
    return null;
  };
  const errors = Object.fromEntries(board.map((row) => [row.currency._id, rowError(row)]));
  const hasErrors = changedRows.some((row) => errors[row.currency._id]);

  const suppliersByCurrency = supplierRates.reduce((acc, s) => ({ ...acc, [s.currency._id]: [...(acc[s.currency._id] || []), s] }), {});
  const losses = Object.fromEntries(
    board.map((row) => [row.currency._id, sendLossPerThousand(draft[row.currency._id]?.sendRate, row.currency, suppliersByCurrency[row.currency._id] || [])])
  );
  const notCheckedToday = board.filter((row) => hasAnyRate(row) && !isBusinessToday(row.checkedAt));

  const save = async (rows) => {
    try {
      const res = await updateRateBoard(
        rows.map((row) => ({
          currency: row.currency._id,
          ...Object.fromEntries(FIELDS.map((f) => [f.key, toNumberOrNull(draft[row.currency._id][f.key])])),
          version: row.updatedAt ? new Date(row.updatedAt).toISOString() : null, // এর মধ্যে অন্য কেউ বদলালে Server ফিরিয়ে দেয়
        }))
      ).unwrap();
      toast.success(res?.message || "Rates saved");
      setLossConfirm(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save rates");
      if (err?.status === 409) onReload?.();
    }
  };

  const handleSave = () => {
    if (hasErrors) {
      toast.error("Fix the highlighted rates before saving");
      return;
    }
    const losing = changedRows.filter((row) => losses[row.currency._id] !== null);
    if (losing.length > 0) setLossConfirm(losing);
    else save(changedRows);
  };

  // কিছু না বদলিয়ে "আজকের Rate ঠিক আছে" — Rate থাকা সব Currency
  const handleConfirm = () => save(board.filter(hasAnyRate));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
      {canEdit && notCheckedToday.length > 0 && (
        <p className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{notCheckedToday.map((r) => r.currency.code).join(", ")}</span> not checked today. Update the rates, or press{" "}
            <span className="font-semibold">Confirm today&apos;s rates</span> if they are still correct.
          </span>
        </p>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
              <th className="px-4 py-3 text-left">Currency</th>
              {FIELDS.map((f) => (
                <th key={f.key} className="px-4 py-3 text-right">
                  {f.label}
                  <span className="block text-[11px] font-normal text-slate-400">{f.hint}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-right">Last checked</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {board.map((row) => {
              const id = row.currency._id;
              const error = errors[id];
              const loss = losses[id];
              const isChanged = changedRows.includes(row);
              const checkedToday = isBusinessToday(row.checkedAt);
              return (
                <tr key={id} className={isChanged ? "bg-indigo-50/30" : ""}>
                  <td className="px-4 py-3 align-top">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200">
                        {row.currency.code}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{row.currency.name}</p>
                        <p className="text-xs text-slate-500">{rateUnitLabel(row.currency)}</p>
                      </div>
                    </div>
                    {error && isChanged && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {error}
                      </p>
                    )}
                    {canEdit && loss !== null && (
                      <p className="mt-2 flex max-w-xs items-start gap-1.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Send rate is worse than every supplier — loss {formatMoney(loss)} per RM 1,000 sent
                      </p>
                    )}
                  </td>
                  {FIELDS.map((f) => {
                    const value = draft[id][f.key];
                    return (
                      <td key={f.key} className="w-44 px-4 py-3 align-top">
                        {canEdit ? (
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            aria-label={`${row.currency.code} ${f.label} rate`}
                            placeholder="—"
                            value={value}
                            onChange={(e) => setValue(id, f.key, e.target.value)}
                            className={rateInputClass((isChanged && Boolean(error)) || (f.key === "sendRate" && canEdit && loss !== null))}
                          />
                        ) : (
                          <p className="h-10 text-right text-base font-semibold leading-10 tabular-nums text-slate-900">{value || "—"}</p>
                        )}
                        <p className="mt-1 h-4 truncate text-right text-[11px] text-slate-400">{Number(value) > 0 ? describeInverse(value, row.currency) : ""}</p>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right align-top text-xs text-slate-500">
                    {row.checkedAt ? (
                      <>
                        <p className={checkedToday ? "font-medium text-emerald-700" : "font-medium text-amber-700"} title={formatDateTime(row.checkedAt)}>
                          {checkedToday ? `Today · ${timeAgo(row.checkedAt)}` : `Not checked today · ${timeAgo(row.checkedAt)}`}
                        </p>
                        <p className="text-slate-400">{row.checkedBy?.name}</p>
                        {row.changedAt && row.changedAt !== row.checkedAt && <p className="text-slate-400">Rate set {formatDateTime(row.changedAt)}</p>}
                      </>
                    ) : (
                      <span className="text-amber-600">Not set yet</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-slate-500">
            {changedRows.length === 0 ? "No unsaved changes" : `${changedRows.length} currency rate${changedRows.length > 1 ? "s" : ""} changed`}
          </p>
          <div className="flex gap-2">
            {changedRows.length === 0 ? (
              <Button variant="secondary" onClick={handleConfirm} isLoading={isLoading} disabled={!board.some(hasAnyRate)} title="Rates are still correct — mark them as checked today">
                {!isLoading && <CheckCheck className="h-4 w-4" />}
                Confirm today&apos;s rates
              </Button>
            ) : (
              <>
                <Button variant="secondary" disabled={isLoading} onClick={() => setDraft(initial)}>
                  <RotateCcw className="h-4 w-4" />
                  Discard
                </Button>
                <Button onClick={handleSave} isLoading={isLoading}>
                  {!isLoading && <Save className="h-4 w-4" />}
                  Save rates
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(lossConfirm)}
        onClose={() => setLossConfirm(null)}
        onConfirm={() => save(changedRows)}
        isLoading={isLoading}
        variant="danger"
        title="Send rate makes a loss"
        confirmLabel="Save anyway"
        description={
          lossConfirm &&
          `${lossConfirm.map((row) => `${row.currency.code}: loss ${formatMoney(losses[row.currency._id])} per RM 1,000`).join(" · ")}. ` +
            "Even the best supplier costs more than this rate brings in, so every send loses money. Save only if this is on purpose (for example a promotion)."
        }
      />
    </div>
  );
};

export default RateBoardEditor;
