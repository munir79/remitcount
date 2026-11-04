"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { useAssignDrawerMutation } from "@/redux/features/pos/cashierSessionApi";
import { useGetTransferAccountsQuery } from "@/redux/features/pos/cashTransferApi";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import { formatMoney, formatNumber } from "@/lib/format";
import Modal from "../ui/Modal";
import Combobox from "../ui/Combobox";
import Button from "../ui/Button";

const FORM_ID = "assign-drawer-form";
const RM = "RM"; // RM এর সারির Key

const toRows = (drawer) => [
  { key: RM, code: "RM", name: "", decimals: 2, now: drawer.systemBalance },
  ...drawer.holdings.map((h) => ({ key: h.currency, code: h.currencyCode, name: h.name, decimals: h.decimals, now: h.qty })),
];
const toStarts = (rows) => Object.fromEntries(rows.map((r) => [r.key, String(r.now)]));

/**
 * ✅ Assign — কে, কোন Drawer, RM ও প্রতিটা Currency তে কত দিয়ে শুরু
 * এখন যা আছে সেটাই আগে থেকে লেখা। বেশি লিখলে "কোথা থেকে" আসে; কম লিখলে সতর্ক করে (গরমিল, Assign করা মানুষের নামে)
 * টাকা নড়ে তখনই, যখন Staff গুনে মেলান
 * board = Backend getDrawerBoard: { drawers, staff }; Parent এ শর্তসাপেক্ষে Mount হয়, তাই State নতুন করে শুরু হয়
 */
const AssignDrawerModal = ({ isOpen, onClose, board, defaultDrawer = "" }) => {
  const [assignDrawer, { isLoading }] = useAssignDrawerMutation();
  const { data: accountData } = useGetTransferAccountsQuery(undefined, { skip: !isOpen, refetchOnMountOrArgChange: true });
  const { data: rateData } = useGetRateBoardQuery(undefined, { skip: !isOpen });

  const drawers = (board?.drawers || []).filter((d) => !d.session && !d.assignment);
  const staff = board?.staff || [];
  const accounts = accountData?.data || [];
  const firstRows = () => {
    const d = drawers.find((x) => x._id === defaultDrawer);
    return d ? toRows(d) : [];
  };

  const [cashierId, setCashierId] = useState("");
  const [drawerId, setDrawerId] = useState(defaultDrawer);
  const [rows, setRows] = useState(firstRows);
  const [starts, setStarts] = useState(() => toStarts(firstRows()));
  const [froms, setFroms] = useState({});
  const [adding, setAdding] = useState("");
  const [errors, setErrors] = useState({});

  const person = staff.find((p) => p._id === cashierId);
  const allCurrencies = (rateData?.data || []).map((b) => b.currency);
  const addable = allCurrencies.filter((c) => !rows.some((r) => r.key === c._id));

  const differenceOf = (r) => Math.round(((Number(starts[r.key]) || 0) - r.now) * 10000) / 10000;
  const sourcesFor = (r) =>
    accounts.filter((a) => {
      if (a._id === drawerId) return false;
      if (r.key === RM) return a.type === "Bank" || a.isOpen;
      return a.type === "Cash" && a.isOpen && (a.holdings || []).some((h) => h.currency === r.key && h.qty > 0);
    });
  const sourceLabel = (r, a) => {
    const owner = a.type === "Bank" ? "Bank" : `Open by ${a.openBy}`;
    const has = r.key === RM ? formatMoney(a.balance) : `${r.code} ${formatNumber(a.holdings.find((h) => h.currency === r.key)?.qty || 0, r.decimals)}`;
    return `${owner} · ${has}`;
  };

  const chooseDrawer = (id) => {
    const d = drawers.find((x) => x._id === id);
    const next = d ? toRows(d) : [];
    setDrawerId(id);
    setRows(next);
    setStarts(toStarts(next));
    setFroms({});
    setErrors((p) => ({ ...p, drawerId: "", rows: "" }));
  };

  const addCurrency = () => {
    const c = allCurrencies.find((x) => x._id === adding);
    if (!c) return;
    setRows((p) => [...p, { key: c._id, code: c.code, name: c.name, decimals: c.decimals ?? 2, now: 0, added: true }]);
    setStarts((p) => ({ ...p, [c._id]: "" }));
    setAdding("");
  };

  const removeCurrency = (key) => {
    setRows((p) => p.filter((r) => r.key !== key));
    setStarts(({ [key]: _gone, ...rest }) => rest);
    setFroms(({ [key]: _gone, ...rest }) => rest);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!cashierId) next.cashierId = "Choose the staff member";
    if (!drawerId) next.drawerId = "Choose the cash drawer";
    const blank = rows.find((r) => starts[r.key] === "" || starts[r.key] === undefined || !(Number(starts[r.key]) >= 0));
    const noSource = rows.find((r) => differenceOf(r) > 0 && !froms[r.key]);
    if (blank) next.rows = `Enter the ${blank.code} the staff starts with`;
    else if (noSource) next.rows = `Choose where the extra ${noSource.code} comes from`;
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    const foreign = rows.filter((r) => r.key !== RM);
    try {
      const res = await assignDrawer({
        cashierId,
        cashAccount: drawerId,
        startCash: Number(starts[RM]),
        ...(froms[RM] ? { cashFrom: froms[RM] } : {}),
        currencies: foreign.map((r) => ({ currency: r.key, start: Number(starts[r.key]), ...(froms[r.key] ? { from: froms[r.key] } : {}) })),
      }).unwrap();
      const drawer = drawers.find((d) => d._id === drawerId);
      toast.success(res.data.session ? `Session started on ${drawer?.name}` : `${drawer?.name} assigned to ${person?.name}`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to assign the drawer");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign drawer"
      description="Choose who works on which drawer today and what they start with"
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isLoading}>
            Assign
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Combobox
            id="assignStaff"
            label="Staff"
            required
            value={cashierId}
            onChange={(v) => {
              if (staff.find((p) => p._id === v)?.busy) {
                toast.error("This person already has a drawer today");
                return;
              }
              setCashierId(v);
              setErrors((p) => ({ ...p, cashierId: "" }));
            }}
            options={staff.map((p) => ({ value: p._id, label: p.isMe ? `${p.name} (me)` : p.name, sub: p.busy ? "Already has a drawer" : "" }))}
            placeholder="Choose staff"
            emptyText="No staff can run a drawer"
            error={errors.cashierId}
          />
          <Combobox
            id="assignDrawer"
            label="Cash drawer"
            required
            value={drawerId}
            onChange={chooseDrawer}
            options={drawers.map((d) => ({ value: d._id, label: d.name, sub: [d.branch?.name, d.location].filter(Boolean).join(" · ") }))}
            placeholder="Choose drawer"
            emptyText="All drawers are in use"
            error={errors.drawerId}
          />
        </div>

        {drawerId && (
          <div className="rounded-xl border border-slate-200">
            <div className="grid grid-cols-[1fr_100px_130px] gap-3 border-b border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500">
              <span />
              <span className="text-right">Now</span>
              <span className="text-right">Starts with</span>
            </div>
            <div className="divide-y divide-slate-100">
              {rows.map((r) => {
                const diff = starts[r.key] === "" ? 0 : differenceOf(r);
                return (
                  <div key={r.key} className="px-4 py-2.5">
                    <div className="grid grid-cols-[1fr_100px_130px] items-center gap-3">
                      <span className="flex items-center gap-2">
                        <span className="flex h-8 w-12 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-700">{r.code}</span>
                        {r.added && (
                          <button type="button" onClick={() => removeCurrency(r.key)} className="text-slate-400 hover:text-rose-600" aria-label={`Remove ${r.code}`}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                      <span className="text-right text-sm tabular-nums text-slate-600">{formatNumber(r.now, r.decimals)}</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        aria-label={`${r.code} the staff starts with`}
                        value={starts[r.key] ?? ""}
                        onChange={(e) => {
                          setStarts((p) => ({ ...p, [r.key]: e.target.value }));
                          setErrors((p) => ({ ...p, rows: "" }));
                        }}
                        className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-right text-sm tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                      />
                    </div>
                    {diff > 0 && (
                      <div className="mt-2">
                        <Combobox
                          id={`from-${r.key}`}
                          label={`${r.code} ${formatNumber(diff, r.decimals)} more. From?`}
                          required
                          value={froms[r.key] || ""}
                          onChange={(v) => {
                            setFroms((p) => ({ ...p, [r.key]: v }));
                            setErrors((p) => ({ ...p, rows: "" }));
                          }}
                          options={sourcesFor(r).map((a) => ({ value: a._id, label: a.name, sub: sourceLabel(r, a) }))}
                          placeholder={r.key === RM ? "Bank or open drawer" : "Open drawer"}
                          emptyText={r.key === RM ? "No bank or open drawer" : `No open drawer has ${r.code}`}
                        />
                      </div>
                    )}
                    {diff < 0 && (
                      <p className="mt-1.5 text-right text-xs font-medium text-rose-600">
                        {r.code} {formatNumber(Math.abs(diff), r.decimals)} short. This will be recorded under your name.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {addable.length > 0 && (
              <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5">
                <select
                  value={adding}
                  onChange={(e) => setAdding(e.target.value)}
                  aria-label="Currency to add"
                  className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-700 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Choose currency</option>
                  {addable.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
                <button type="button" disabled={!adding} onClick={addCurrency} className="flex items-center gap-1 text-[13px] font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-300">
                  <Plus className="h-4 w-4" />
                  Add currency
                </button>
              </div>
            )}
            {errors.rows && <p className="px-4 pb-3 text-xs font-medium text-rose-600">{errors.rows}</p>}
          </div>
        )}
      </form>
    </Modal>
  );
};

export default AssignDrawerModal;
