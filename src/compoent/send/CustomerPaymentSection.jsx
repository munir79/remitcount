"use client";
import { Banknote, CheckCircle2, Clock, HandCoins, Landmark, Plus, Split, Trash2 } from "lucide-react";
import { formatMoney } from "@/lib/format";
import Input from "../ui/Input";
import Combobox from "../ui/Combobox";
import SegmentedControl from "../ui/SegmentedControl";

export const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash", icon: Banknote },
  { value: "Bank", label: "Bank", icon: Landmark },
  { value: "Credit", label: "Credit", icon: Clock },
  { value: "Split", label: "Split", icon: Split },
];

const LINE_METHODS = PAYMENT_METHODS.slice(0, 2);

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const newPaymentLine = (method) => ({ id: crypto.randomUUID(), method, account: "", amount: "", tendered: "" });

export const initialPayment = (method = "Cash") => ({
  method,
  paymentAccount: "",
  cashTendered: "",
  splitLines: [newPaymentLine("Cash"), newPaymentLine("Bank")],
  receivableAccount: "",
});

/**
 * ✅ Form এর Payment থেকে আসল Payment লাইন — Backend এ এগুলোই যায়
 * defaults: { cash, bank, receivable } — Account না বাছলে কোনটা বসবে
 * onCredit < 0 মানে মোটের চেয়ে বেশি লেখা হয়েছে
 */
export const resolvePayment = (p, total, defaults) => {
  const accountFor = (method, account) => account || (method === "Cash" ? defaults.cash : defaults.bank);
  let lines;
  if (p.method === "Cash" || p.method === "Bank") {
    lines = [{ method: p.method, account: accountFor(p.method, p.paymentAccount), amount: total, tendered: p.method === "Cash" ? p.cashTendered : "" }];
  } else if (p.method === "Credit") {
    lines = [];
  } else {
    lines = p.splitLines
      .filter((l) => Number(l.amount) > 0)
      .map((l) => ({ method: l.method, account: accountFor(l.method, l.account), amount: r2(l.amount), tendered: l.method === "Cash" ? l.tendered : "" }));
  }

  const payments = lines.map((l) => {
    const tendered = Number(l.tendered) > 0 ? r2(l.tendered) : null;
    return { method: l.method, account: l.account, amount: l.amount, tendered, change: tendered !== null ? r2(tendered - l.amount) : 0 };
  });
  const paidNow = r2(payments.reduce((sum, x) => sum + x.amount, 0));
  const onCredit = r2(total - paidNow);
  const change = r2(payments.reduce((sum, x) => sum + Math.max(0, x.change), 0));

  return { payments, paidNow, onCredit, change, receivableAccount: onCredit > 0 ? p.receivableAccount || defaults.receivable : null };
};

/** direction "out" (Buy — আমরা দিই): বাকি অংশ Server নিজে Customer Payables এ রাখে, Account বাছতে হয় না */
export const validatePayment = (p, resolved, defaults, { direction = "in", autoReceivable = false } = {}) => {
  const e = {};
  if (p.method === "Cash" || p.method === "Bank") {
    const line = resolved.payments[0];
    if (!line?.account) e.paymentAccount = p.method === "Cash" ? "Open your cashier session first" : "Choose the bank account";
    if (direction === "out") return e;
    if (line?.tendered !== null && line?.change < 0) e.cashTendered = "Less than the amount to pay";
  }
  if (p.method === "Split") {
    p.splitLines.forEach((l) => {
      if (!(Number(l.amount) > 0)) return;
      if (!(l.account || (l.method === "Cash" ? defaults.cash : defaults.bank))) e[`line-${l.id}`] = l.method === "Cash" ? "Choose the cash drawer" : "Choose the bank";
      else if (l.method === "Cash" && Number(l.tendered) > 0 && Number(l.tendered) < Number(l.amount)) e[`line-${l.id}`] = "Cash received is less than the amount";
    });
    if (resolved.payments.length === 0) e.split = "Enter how much is paid by cash or bank";
    else if (resolved.onCredit < 0) e.split = `Payments are ${formatMoney(-resolved.onCredit)} more than the total`;
  }
  if (direction !== "out" && !autoReceivable && resolved.onCredit > 0 && !resolved.receivableAccount) e.receivableAccount = "Choose the receivable account";
  return e;
};

/** Customer হাতে বেশি দিলে — কত ফেরত দিতে হবে, বড় করে */
const ChangeBox = ({ change }) =>
  change > 0 ? (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
      <span className="flex items-center gap-2 text-sm font-medium">
        <HandCoins className="h-4 w-4" />
        Give back change
      </span>
      <span className="text-lg font-semibold tabular-nums">{formatMoney(change)}</span>
    </div>
  ) : null;

/** বাকি অংশ — Customer এর Balance এ যাবে; এখনকার বাকি ও পরের বাকি */
const CreditBox = ({ amount, customer }) => {
  const owes = Number(customer?.currentBalance) || 0;
  return (
    <div className="rounded-lg bg-violet-50 px-3.5 py-2.5 text-sm text-violet-900 ring-1 ring-inset ring-violet-600/15">
      <p>
        <span className="font-semibold tabular-nums">{formatMoney(amount)}</span> on credit — added to {customer?.name ? `${customer.name}'s` : "the customer's"} balance
      </p>
      {customer && (
        <p className="mt-0.5 text-xs text-violet-700">
          To collect now {formatMoney(owes)} → after this <span className="font-semibold">{formatMoney(owes + amount)}</span>
        </p>
      )}
    </div>
  );
};

/** Buy এ বাকি — আমরা পরে দেবো; Customer এর "To pay" তে যায় (Payment Out এ শোধ) */
const PayLaterBox = ({ amount, customer }) => (
  <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-inset ring-amber-600/20">
    <span className="font-semibold tabular-nums">{formatMoney(amount)}</span> to pay {customer?.name || "the customer"} later — shows under To pay until paid with Payment Out
  </div>
);

/**
 * ✅ Customer কীভাবে টাকা দিলেন — Cash (ফেরত সহ) / Bank / Credit / Split (একাধিক লাইন, বাকিটা Credit)
 * value = { method, paymentAccount, cashTendered, splitLines, receivableAccount }
 * direction: "in" (Send/Sell — Customer দেন) | "out" (Buy — আমরা Customer কে দিই: ফেরত/Receivable নেই, বাকি = পরে দেবো)
 * autoReceivable: বাকির Account Server নিজে বসায় (Sell → Accounts Receivable) — বাছার ঘর দেখায় না
 */
const CustomerPaymentSection = ({ value, onChange, total, resolved, options, defaults, errors, hints, customer, direction = "in", autoReceivable = false }) => {
  const isOut = direction === "out";
  const methods = isOut ? PAYMENT_METHODS.map((m) => (m.value === "Credit" ? { ...m, label: "Pay later" } : m)) : PAYMENT_METHODS;
  const set = (patch) => onChange({ ...value, ...patch });
  const setLine = (id, patch) => set({ splitLines: value.splitLines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const removeLine = (id) => set({ splitLines: value.splitLines.filter((l) => l.id !== id) });

  const single = value.method === "Cash" || value.method === "Bank";
  const remaining = resolved.onCredit;

  const receivablePicker = resolved.onCredit > 0 && !autoReceivable && (
    <Combobox
      id="sendReceivableAccount"
      label="Receivable account"
      required
      value={value.receivableAccount || defaults.receivable}
      onChange={(v) => set({ receivableAccount: v })}
      options={options.receivable}
      placeholder="Choose account"
      emptyText="Nothing to choose yet"
      error={errors.receivableAccount}
      hint={hints.Credit}
    />
  );

  return (
    <div className="space-y-4">
      <SegmentedControl label={isOut ? "Pay the customer by" : "Customer pays by"} value={value.method} onChange={(method) => set({ method })} options={methods} />

      {single && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Combobox
            id="sendPaymentAccount"
            label={value.method === "Cash" ? (isOut ? "Pay from drawer" : "Cash drawer") : isOut ? "Pay from bank" : "Received into bank"}
            required
            value={value.paymentAccount || (value.method === "Cash" ? defaults.cash : defaults.bank)}
            onChange={(v) => set({ paymentAccount: v })}
            options={value.method === "Cash" ? options.cash : options.bank}
            placeholder="Choose account"
            emptyText="Nothing to choose yet"
            error={errors.paymentAccount}
            hint={hints[value.method]}
          />
          {value.method === "Cash" && !isOut && (
            <Input
              id="cashTendered"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              label="Cash received"
              prefix="RM"
              placeholder={total > 0 ? String(total) : ""}
              value={value.cashTendered}
              onChange={(e) => set({ cashTendered: e.target.value })}
              error={errors.cashTendered}
              hint="Optional — enter the notes given to work out the change"
            />
          )}
          {value.method === "Cash" && !isOut && (
            <div className="sm:col-span-2">
              <ChangeBox change={resolved.change} />
            </div>
          )}
        </div>
      )}

      {value.method === "Credit" && isOut && total > 0 && <PayLaterBox amount={total} customer={customer} />}

      {value.method === "Credit" && !isOut && (
        <div className="space-y-3">
          {total > 0 && <CreditBox amount={total} customer={customer} />}
          {!autoReceivable && (receivablePicker || (
            <Combobox
              id="sendReceivableAccount"
              label="Receivable account"
              value={value.receivableAccount || defaults.receivable}
              onChange={(v) => set({ receivableAccount: v })}
              options={options.receivable}
              placeholder="Choose account"
              emptyText="Nothing to choose yet"
              hint={hints.Credit}
            />
          ))}
        </div>
      )}

      {value.method === "Split" && (
        <div className="space-y-3">
          {value.splitLines.map((line) => {
            const lineChange = line.method === "Cash" && Number(line.tendered) > 0 && Number(line.amount) > 0 ? r2(Number(line.tendered) - Number(line.amount)) : 0;
            const fillRest = remaining > 0 && r2((Number(line.amount) || 0) + remaining);
            return (
              <div key={line.id} className="rounded-xl border border-slate-200 p-3">
                <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)_150px_auto] sm:items-start">
                  <SegmentedControl
                    value={line.method}
                    onChange={(method) => setLine(line.id, { method, account: "", tendered: "" })}
                    options={LINE_METHODS}
                  />
                  <Combobox
                    id={`splitAccount-${line.id}`}
                    value={line.account || (line.method === "Cash" ? defaults.cash : defaults.bank)}
                    onChange={(v) => setLine(line.id, { account: v })}
                    options={line.method === "Cash" ? options.cash : options.bank}
                    placeholder={line.method === "Cash" ? "Cash drawer" : "Bank account"}
                    emptyText="Nothing to choose yet"
                    hint={hints[line.method]}
                  />
                  <Input
                    id={`splitAmount-${line.id}`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    prefix="RM"
                    aria-label={`${line.method} amount`}
                    placeholder="0.00"
                    value={line.amount}
                    onChange={(e) => setLine(line.id, { amount: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={value.splitLines.length === 1}
                    title="Remove"
                    aria-label="Remove payment line"
                    className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:pointer-events-none disabled:opacity-40 sm:flex"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {fillRest > 0 && (
                    <button type="button" onClick={() => setLine(line.id, { amount: String(fillRest) })} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                      Use remaining {formatMoney(remaining)}
                    </button>
                  )}
                  {line.method === "Cash" && Number(line.amount) > 0 && !isOut && (
                    <label className="flex items-center gap-2 text-xs text-slate-500">
                      Cash received
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min="0"
                        placeholder={String(line.amount)}
                        value={line.tendered}
                        onChange={(e) => setLine(line.id, { tendered: e.target.value })}
                        className="h-8 w-28 rounded-md border border-slate-300 px-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                      />
                    </label>
                  )}
                  {lineChange > 0 && <span className="text-xs font-semibold text-emerald-700">Give back {formatMoney(lineChange)}</span>}
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={value.splitLines.length === 1}
                    className="ml-auto text-xs font-medium text-slate-400 hover:text-rose-600 disabled:hidden sm:hidden"
                  >
                    Remove
                  </button>
                </div>
                {errors[`line-${line.id}`] && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors[`line-${line.id}`]}</p>}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => set({ splitLines: [...value.splitLines, newPaymentLine("Cash")] })}
            className="flex items-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="h-4 w-4" />
            Add payment
          </button>

          {/* মোট — কত পাওয়া গেল, কত বাকি */}
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="font-semibold tabular-nums text-slate-900">{formatMoney(total)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Paid now</p>
              <p className="font-semibold tabular-nums text-emerald-700">{formatMoney(resolved.paidNow)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{remaining < 0 ? "Too much" : isOut ? "Pay later" : "On credit"}</p>
              {remaining === 0 && total > 0 ? (
                <p className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Fully paid
                </p>
              ) : (
                <p className={`font-semibold tabular-nums ${remaining < 0 ? "text-rose-600" : "text-violet-700"}`}>{formatMoney(Math.abs(remaining))}</p>
              )}
            </div>
          </div>
          {errors.split && <p className="text-xs font-medium text-rose-600">{errors.split}</p>}

          {remaining > 0 && resolved.payments.length > 0 &&
            (isOut ? (
              <PayLaterBox amount={remaining} customer={customer} />
            ) : (
              <>
                <CreditBox amount={remaining} customer={customer} />
                {receivablePicker}
              </>
            ))}
        </div>
      )}
    </div>
  );
};

export default CustomerPaymentSection;
