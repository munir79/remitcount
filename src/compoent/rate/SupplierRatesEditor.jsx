"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useUpsertSupplierRatesMutation } from "@/redux/features/rate/rateApi";
import { describeInverse, profitPerThousand, QUOTE_STYLE, rateUnitLabel } from "@/lib/currencyMath";
import { formatMoney } from "@/lib/format";
import RateDisplay from "../ui/RateDisplay";
import { formatDateTime, isBusinessToday, timeAgo } from "@/lib/format";
import Badge from "../ui/Badge";
import { toPartyOptions } from "@/lib/options";
import Button from "../ui/Button";
import Combobox from "../ui/Combobox";
import Select from "../ui/Select";
import EmptyState from "../ui/EmptyState";

const keyOf = (vendorId, currencyId) => `${vendorId}:${currencyId}`;

const SupplierRatesEditor = ({ rates, vendors, currencies, board, onReload }) => {
  const [upsertSupplierRates, { isLoading }] = useUpsertSupplierRatesMutation();

  const [initialRows] = useState(() =>
    rates.map((r) => ({
      key: keyOf(r.vendor._id, r.currency._id),
      vendor: r.vendor,
      currency: r.currency,
      rate: String(r.rate),
      saved: String(r.rate),
      fee: String(r.fee || 0),
      savedFee: String(r.fee || 0),
      updatedAt: r.updatedAt,
      updatedBy: r.updatedBy,
      version: r.updatedAt ? new Date(r.updatedAt).toISOString() : null,
    }))
  );
  const [rows, setRows] = useState(initialRows);
  const [newVendor, setNewVendor] = useState("");
  const [newCurrency, setNewCurrency] = useState("");

  const sendRateByCurrency = Object.fromEntries(board.map((b) => [b.currency._id, b.sendRate]));

  // প্রতিটা Currency তে সবচেয়ে লাভজনক Supplier (এখন টাইপ করা Rate ধরে) — "Best" দেখানোর জন্য
  const bestKeyByCurrency = {};
  rows.forEach((r) => {
    const rate = Number(r.rate);
    if (!(rate > 0)) return;
    const higherIsBetter = r.currency.quoteStyle !== QUOTE_STYLE.BASE_PER_FOREIGN;
    const current = bestKeyByCurrency[r.currency._id];
    if (!current || (higherIsBetter ? rate > current.rate : rate < current.rate)) bestKeyByCurrency[r.currency._id] = { key: r.key, rate };
  });
  const supplierCountByCurrency = rows.reduce((acc, r) => ({ ...acc, [r.currency._id]: (acc[r.currency._id] || 0) + (Number(r.rate) > 0 ? 1 : 0) }), {});
  const isChanged = (r) => r.rate !== r.saved || (r.rate !== "" && Number(r.fee || 0) !== Number(r.savedFee || 0));
  const changed = rows.filter(isChanged);
  const invalid = changed.some((r) => (r.rate !== "" && !(Number(r.rate) > 0)) || Number(r.fee) < 0);

  const addRow = () => {
    const vendor = vendors.find((v) => v._id === newVendor);
    const currency = currencies.find((c) => c._id === newCurrency);
    if (!vendor || !currency) return;
    const key = keyOf(vendor._id, currency._id);
    if (rows.some((r) => r.key === key)) {
      toast.error(`${vendor.name} already has a ${currency.code} rate`);
      return;
    }
    setRows((prev) => [{ key, vendor, currency, rate: "", saved: "", fee: "0", savedFee: "0", isNew: true, version: null }, ...prev]);
    setNewVendor("");
    setNewCurrency("");
  };

  const setRate = (key, rate) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, rate } : r)));
  const setFee = (key, fee) => setRows((prev) => prev.map((r) => (r.key === key ? { ...r, fee } : r)));

  const handleSave = async () => {
    if (invalid) {
      toast.error("Rates must be greater than 0 and fees cannot be negative");
      return;
    }
    try {
      const res = await upsertSupplierRates(
        changed.map((r) => ({ vendor: r.vendor._id, currency: r.currency._id, rate: r.rate === "" ? null : Number(r.rate), fee: Number(r.fee) || 0, version: r.version }))
      ).unwrap();
      toast.success(res?.message || "Supplier rates saved");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save supplier rates");
      if (err?.status === 409) onReload?.();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:grid-cols-[1fr_180px_auto]">
        <Combobox
          id="newSupplier"
          label="Supplier"
          value={newVendor}
          onChange={setNewVendor}
          options={toPartyOptions(vendors)}
          placeholder="Choose supplier"
          emptyText="No vendors — add one in Vendors first"
        />
        <Select id="newSupplierCurrency" label="Currency" value={newCurrency} onChange={(e) => setNewCurrency(e.target.value)}>
          <option value="">Choose</option>
          {currencies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code} — {c.name}
            </option>
          ))}
        </Select>
        <Button variant="secondary" onClick={addRow} disabled={!newVendor || !newCurrency}>
          <Plus className="h-4 w-4" />
          Add rate
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No supplier rates yet" description="Add the rate each supplier charges you, so send profit is calculated automatically." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Currency</th>
                  <th className="px-4 py-3 text-right">Supplier rate</th>
                  <th className="px-4 py-3 text-right" title="What this supplier charges you on every send">Fee per send</th>
                  <th className="px-4 py-3 text-right">Our send rate (customer)</th>
                  <th className="px-4 py-3 text-right" title="Profit from the rate when a customer sends RM 1,000 (fees not included)">Profit per RM 1,000</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const sendRate = sendRateByCurrency[r.currency._id];
                  const profit = profitPerThousand(sendRate, r.rate, r.currency.quoteStyle);
                  const isBest = bestKeyByCurrency[r.currency._id]?.key === r.key && supplierCountByCurrency[r.currency._id] > 1;
                  const isRemoved = r.rate === "" && r.saved !== "";
                  return (
                    <tr key={r.key} className={isChanged(r) ? "bg-indigo-50/30" : ""}>
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-2 font-medium text-slate-900">
                          {r.vendor.name}
                          {isBest && (
                            <Badge variant="success" dot={false}>
                              Best
                            </Badge>
                          )}
                        </p>
                        {r.updatedAt && (
                          <p className={`text-xs ${isBusinessToday(r.updatedAt) ? "text-slate-400" : "font-medium text-amber-700"}`} title={formatDateTime(r.updatedAt)}>
                            {isBusinessToday(r.updatedAt) ? "Updated" : "Not updated today ·"} {timeAgo(r.updatedAt)} · {r.updatedBy?.name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-slate-700">{r.currency.code}</span>
                        <p className="text-xs text-slate-400">{rateUnitLabel(r.currency)}</p>
                      </td>
                      <td className="w-44 px-4 py-3">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          aria-label={`${r.vendor.name} ${r.currency.code} rate`}
                          placeholder={isRemoved ? "Will be removed" : "—"}
                          value={r.rate}
                          onChange={(e) => setRate(r.key, e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-right text-sm tabular-nums placeholder:text-rose-400 hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                        />
                        <p className="mt-1 h-4 truncate text-right text-[11px] text-slate-400">{Number(r.rate) > 0 ? describeInverse(r.rate, r.currency) : ""}</p>
                      </td>
                      <td className="w-32 px-4 py-3 align-top">
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-slate-400">RM</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            min="0"
                            aria-label={`${r.vendor.name} ${r.currency.code} fee per send`}
                            value={r.fee}
                            disabled={isRemoved}
                            onChange={(e) => setFee(r.key, e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-right text-sm tabular-nums hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 disabled:bg-slate-50"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px]">
                        {sendRate ? <RateDisplay rate={sendRate} currency={r.currency} className="items-end" /> : <span className="text-amber-600">not set</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {profit === null ? (
                          <span className="text-slate-300">—</span>
                        ) : profit >= 0 ? (
                          <span className="font-semibold tabular-nums text-emerald-600">+ {formatMoney(profit)}</span>
                        ) : (
                          <span className="flex flex-col items-end">
                            <span className="font-semibold tabular-nums text-rose-600">− {formatMoney(-profit)}</span>
                            <span className="text-[11px] font-medium text-rose-500">Loss — check the rates</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          title="Remove rate"
                          aria-label={`Remove ${r.vendor.name} ${r.currency.code} rate`}
                          onClick={() => (r.isNew ? setRows((prev) => prev.filter((x) => x.key !== r.key)) : setRate(r.key, ""))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-slate-500">{changed.length === 0 ? "No unsaved changes" : `${changed.length} change${changed.length > 1 ? "s" : ""}`}</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={changed.length === 0 || isLoading} onClick={() => setRows(initialRows)}>
                <RotateCcw className="h-4 w-4" />
                Discard
              </Button>
              <Button onClick={handleSave} isLoading={isLoading} disabled={changed.length === 0}>
                {!isLoading && <Save className="h-4 w-4" />}
                Save supplier rates
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierRatesEditor;
