"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, RotateCcw, Loader2, Trash2, ChevronDown } from "lucide-react";
import { useCreateJournalMutation, useGetAllJournalsQuery, usePostJournalMutation, useReverseJournalMutation } from "@/redux/features/journal/journalApi";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Modal from "@/compoent/ui/Modal";
import Input from "@/compoent/ui/Input";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import { useSocketEvent } from "@/socket/useSocketEvent";

const COLUMNS = [
  { key: "number", label: "Journal No." },
  { key: "date", label: "Date" },
  { key: "narration", label: "Narration" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const STATUS_VARIANT = { Draft: "warning", Posted: "success", Reversed: "neutral" };

const emptyLine = () => ({ account: "", debit: "", credit: "" });

const inputClass =
  "h-10 w-full rounded-md border border-neutral-300 bg-white px-2.5 text-sm text-neutral-900 transition-colors " +
  "hover:border-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";

const JournalPage = () => {
  const { data: journalData, isLoading, refetch } = useGetAllJournalsQuery({});
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const [createJournal, { isLoading: isCreating }] = useCreateJournalMutation();
  const [postJournal, { isLoading: isPosting }] = usePostJournalMutation();
  const [reverseJournal, { isLoading: isReversing }] = useReverseJournalMutation();

  const journals = journalData?.data?.data || [];
  const accounts = accountData?.data?.data || [];

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Journal") refetch();
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([emptyLine(), emptyLine()]);
  const [error, setError] = useState("");

  const [postTarget, setPostTarget] = useState(null);
  const [reverseTarget, setReverseTarget] = useState(null);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const resetForm = () => {
    setNarration("");
    setLines([emptyLine(), emptyLine()]);
    setError("");
  };

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!narration.trim()) {
      setError("Narration is required");
      return;
    }
    if (!isBalanced) {
      setError("Total Debit must equal Total Credit");
      return;
    }

    try {
      await createJournal({
        narration,
        lines: lines
          .filter((l) => l.account)
          .map((l) => ({ account: l.account, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
      }).unwrap();
      toast.success("Journal entry created as Draft");
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create journal entry");
    }
  };

  const handlePost = async () => {
    try {
      await postJournal(postTarget._id).unwrap();
      toast.success("Journal posted successfully");
      setPostTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post journal");
    }
  };

  const handleReverse = async () => {
    try {
      await reverseJournal({ id: reverseTarget._id, reason: "Manual reversal" }).unwrap();
      toast.success("Journal reversed successfully");
      setReverseTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reverse journal");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Journal Entries</h1>
          <p className="mt-0.5 text-sm text-neutral-500">Manual double-entry bookkeeping</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Journal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : journals.length === 0 ? (
        <EmptyState title="No journal entries yet" description="Create your first manual entry" />
      ) : (
        <Table columns={COLUMNS}>
          {journals.map((j) => (
            <tr key={j._id} className="hover:bg-neutral-50/70">
              <td className="px-4 py-3.5 font-medium text-neutral-900">{j.journalNumber}</td>
              <td className="px-4 py-3.5 text-neutral-600">{new Date(j.date).toLocaleDateString("en-GB")}</td>
              <td className="px-4 py-3.5 text-neutral-600">{j.narration}</td>
              <td className="px-4 py-3.5 text-right tabular-nums text-neutral-900">৳ {Number(j.totalAmount).toFixed(2)}</td>
              <td className="px-4 py-3.5">
                <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="flex justify-end gap-2">
                  {j.status === "Draft" && (
                    <Button size="sm" onClick={() => setPostTarget(j)}>
                      <Send className="h-3.5 w-3.5" />
                      Post
                    </Button>
                  )}
                  {j.status === "Posted" && (
                    <Button size="sm" variant="ghost" onClick={() => setReverseTarget(j)}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reverse
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Journal Entry" size="xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input id="narration" label="Narration" value={narration} onChange={(e) => setNarration(e.target.value)} />

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Journal Lines</p>
            <div className="overflow-hidden rounded-lg border border-neutral-200">
              <div className="grid grid-cols-12 gap-2 border-b border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <span className="col-span-6">Account</span>
                <span className="col-span-3">Debit</span>
                <span className="col-span-3">Credit</span>
              </div>
              <div className="divide-y divide-neutral-100">
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2 px-3 py-2.5">
                    <div className="relative col-span-6">
                      <select
                        className={`${inputClass} appearance-none pr-8`}
                        value={line.account}
                        onChange={(e) => updateLine(idx, "account", e.target.value)}
                      >
                        <option value="">Select account</option>
                        {accounts.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.code} — {a.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                    </div>
                    <input
                      type="number"
                      className={`${inputClass} col-span-3`}
                      value={line.debit}
                      onChange={(e) => updateLine(idx, "debit", e.target.value)}
                      placeholder="0.00"
                    />
                    <div className="col-span-3 flex items-center gap-2">
                      <input
                        type="number"
                        className={inputClass}
                        value={line.credit}
                        onChange={(e) => updateLine(idx, "credit", e.target.value)}
                        placeholder="0.00"
                      />
                      {lines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="shrink-0 text-neutral-300 transition-colors hover:text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={addLine} className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
              + Add Line
            </button>
          </div>

          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold ${
              isBalanced ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}
          >
            <span>
              Debit: ৳ {totalDebit.toFixed(2)} — Credit: ৳ {totalCredit.toFixed(2)}
            </span>
            <span>{isBalanced ? "✓ Balanced" : "Not Balanced"}</span>
          </div>

          {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating} disabled={!isBalanced}>
              Create Journal
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        isLoading={isPosting}
        variant="primary"
        title="Post Journal"
        description={`Post ${postTarget?.journalNumber}? This will update account balances.`}
      />
      <ConfirmDialog
        isOpen={Boolean(reverseTarget)}
        onClose={() => setReverseTarget(null)}
        onConfirm={handleReverse}
        isLoading={isReversing}
        title="Reverse Journal"
        description={`Reverse ${reverseTarget?.journalNumber}? This creates an offsetting entry.`}
      />
    </div>
  );
};

export default JournalPage;