"use client";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Plus, Scale, Trash2 } from "lucide-react";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useCreateJournalMutation } from "@/redux/features/journal/journalApi";
import { formatMoney, todayInCompany } from "@/lib/format";
import { toAccountOptions } from "@/lib/options";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Combobox from "../ui/Combobox";
import FormModalFooter from "../ui/FormModalFooter";

const FORM_ID = "journal-form";

const emptyLine = () => ({ key: crypto.randomUUID(), account: "", debit: "", credit: "" });
// Floating Point ভুল এড়াতে Sen (×100) এ তুলনা — 0.1 + 0.2 যেন 0.3 এর সমান হয়
const toSen = (n) => Math.round((Number(n) || 0) * 100);

const amountInputClass =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-right text-sm tabular-nums text-slate-900 shadow-[0_1px_2px_rgb(16_24_40/0.04)] " +
  "placeholder:text-slate-300 hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15";

const JournalFormModal = ({ isOpen, onClose }) => {
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 }, { skip: !isOpen });
  const [createJournal, { isLoading }] = useCreateJournalMutation();
  const accountOptions = toAccountOptions(accountData?.data?.data || []);

  const [date, setDate] = useState(todayInCompany);
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState(() => [emptyLine(), emptyLine()]);
  const [errors, setErrors] = useState({});

  const totalDebitSen = lines.reduce((s, l) => s + toSen(l.debit), 0);
  const totalCreditSen = lines.reduce((s, l) => s + toSen(l.credit), 0);
  const differenceSen = totalDebitSen - totalCreditSen;
  const isBalanced = differenceSen === 0 && totalDebitSen > 0;

  const resetForm = () => {
    setDate(todayInCompany());
    setNarration("");
    setLines([emptyLine(), emptyLine()]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // একটা Line এ Debit দিলে Credit খালি হয় (আর উল্টোটাও) — একই Line এ দুটো থাকতে পারে না
  const updateLine = (key, field, value) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const next = { ...l, [field]: value };
        if (field === "debit" && value !== "") next.credit = "";
        if (field === "credit" && value !== "") next.debit = "";
        return next;
      })
    );
    setErrors((prev) => ({ ...prev, lines: "" }));
  };

  // বাকি Difference টা এই Line এ বসিয়ে দেওয়া — দ্রুত Balance করার জন্য
  const fillDifference = (key) => {
    if (differenceSen === 0) return;
    const line = lines.find((l) => l.key === key);
    const lineNetSen = toSen(line.debit) - toSen(line.credit);
    const remainingSen = differenceSen - lineNetSen; // এই Line বাদে বাকিদের পার্থক্য
    if (remainingSen === 0) return;
    const amount = (Math.abs(remainingSen) / 100).toFixed(2);
    updateLine(key, remainingSen > 0 ? "credit" : "debit", amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const filled = lines.filter((l) => l.account || toSen(l.debit) || toSen(l.credit));

    if (!narration.trim()) newErrors.narration = "Describe what this entry is for";
    if (filled.length < 2) newErrors.lines = "A journal needs at least 2 lines";
    else if (filled.some((l) => !l.account)) newErrors.lines = "Every line with an amount needs an account";
    else if (filled.some((l) => !toSen(l.debit) && !toSen(l.credit))) newErrors.lines = "Every line needs a debit or credit amount";
    else if (filled.some((l) => toSen(l.debit) < 0 || toSen(l.credit) < 0)) newErrors.lines = "Amounts cannot be negative";
    else if (!isBalanced) newErrors.lines = "Total debit must equal total credit";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createJournal({
        date,
        narration: narration.trim(),
        lines: filled.map((l) => ({
          account: l.account,
          debit: toSen(l.debit) / 100,
          credit: toSen(l.credit) / 100,
        })),
      }).unwrap();
      toast.success("Journal saved as Draft");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create journal entry");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Journal Entry"
      description="Manual debit / credit entry for contra or non-cash transactions"
      size="2xl"
      footer={<FormModalFooter formId={FORM_ID} onCancel={handleClose} isLoading={isLoading} showEnterHint={false} />}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
          <Input id="journalDate" type="date" label="Date" required value={date} onChange={(e) => setDate(e.target.value)} />
          <Input
            id="narration"
            label="Narration"
            required
            placeholder="e.g. Transfer from Maybank to cash drawer"
            value={narration}
            onChange={(e) => {
              setNarration(e.target.value);
              setErrors((prev) => ({ ...prev, narration: "" }));
            }}
            error={errors.narration}
          />
        </div>

        <div>
          <div className="rounded-xl border border-slate-200">
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px_40px] gap-3 rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500 sm:grid">
              <span>Account</span>
              <span className="text-right">Debit</span>
              <span className="text-right">Credit</span>
              <span />
            </div>
            <div className="divide-y divide-slate-100">
              {lines.map((line, idx) => (
                <div key={line.key} className="grid grid-cols-2 items-start gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_150px_150px_40px]">
                  <Combobox
                    id={`line-${line.key}`}
                    value={line.account}
                    onChange={(v) => updateLine(line.key, "account", v)}
                    options={accountOptions}
                    placeholder={`Line ${idx + 1} — select account`}
                    searchPlaceholder="Search name or code…"
                    className="col-span-2 sm:col-span-1"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    aria-label={`Line ${idx + 1} debit`}
                    placeholder="0.00"
                    className={amountInputClass}
                    value={line.debit}
                    onChange={(e) => updateLine(line.key, "debit", e.target.value)}
                    onDoubleClick={() => fillDifference(line.key)}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    aria-label={`Line ${idx + 1} credit`}
                    placeholder="0.00"
                    className={amountInputClass}
                    value={line.credit}
                    onChange={(e) => updateLine(line.key, "credit", e.target.value)}
                    onDoubleClick={() => fillDifference(line.key)}
                  />
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    disabled={lines.length <= 2}
                    aria-label={`Remove line ${idx + 1}`}
                    className="col-span-2 flex h-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:invisible sm:col-span-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 items-center gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_150px_150px_40px]">
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="col-span-2 flex w-fit items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 sm:col-span-1"
              >
                <Plus className="h-4 w-4" />
                Add line
              </button>
              <span className="text-right text-sm font-semibold tabular-nums text-slate-900">{formatMoney(totalDebitSen / 100)}</span>
              <span className="text-right text-sm font-semibold tabular-nums text-slate-900">{formatMoney(totalCreditSen / 100)}</span>
              <span className="hidden sm:block" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Tip: double-click an empty amount to fill in the remaining difference.</p>
        </div>

        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${
            isBalanced ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20" : "bg-amber-50 text-amber-800 ring-amber-600/20"
          }`}
        >
          {isBalanced ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <Scale className="h-5 w-5 shrink-0" />}
          <span className="font-medium">
            {isBalanced
              ? "Balanced — debits equal credits."
              : totalDebitSen === 0 && totalCreditSen === 0
                ? "Enter debit and credit amounts."
                : `Out of balance by ${formatMoney(Math.abs(differenceSen) / 100)} (${differenceSen > 0 ? "more debit" : "more credit"}).`}
          </span>
        </div>

        {errors.lines && <p className="text-sm font-medium text-rose-600">{errors.lines}</p>}
      </form>
    </Modal>
  );
};

export default JournalFormModal;
