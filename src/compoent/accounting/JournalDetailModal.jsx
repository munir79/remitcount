"use client";
import { useGetSingleJournalQuery } from "@/redux/features/journal/journalApi";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import PageLoader from "../ui/PageLoader";
import { STATUS_VARIANT } from "../ui/TableCells";

/** একটা Journal এর সব Line (কোন Account এ কত Debit/Credit) দেখানো */
const JournalDetailModal = ({ journalId, onClose }) => {
  const { data, isLoading } = useGetSingleJournalQuery(journalId, { skip: !journalId });
  const journal = data?.data;

  const totalDebit = (journal?.lines || []).reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = (journal?.lines || []).reduce((s, l) => s + Number(l.credit || 0), 0);

  return (
    <Modal isOpen={Boolean(journalId)} onClose={onClose} title={journal?.journalNumber || "Journal"} description={journal?.narration} size="xl">
      {isLoading || !journal ? (
        <PageLoader className="h-40" />
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Date</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{formatDate(journal.date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Status</dt>
              <dd className="mt-0.5">
                <Badge variant={STATUS_VARIANT[journal.status] || "neutral"}>{journal.status}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Branch</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{journal.branch?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Created by</dt>
              <dd className="mt-0.5 font-medium text-slate-900">{journal.createdBy?.name || "—"}</dd>
            </div>
          </dl>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="px-4 py-2.5 text-left font-medium">Account</th>
                  <th className="px-4 py-2.5 text-right font-medium">Debit</th>
                  <th className="px-4 py-2.5 text-right font-medium">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journal.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2.5 text-slate-800">
                      <span className="mr-2 font-mono text-xs text-slate-400">{line.account?.code}</span>
                      {/* Credit Line একটু ভেতরে — Accounting এর প্রচলিত নিয়ম */}
                      <span className={line.credit > 0 ? "pl-6" : ""}>{line.account?.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{line.debit > 0 ? formatNumber(line.debit) : ""}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{line.credit > 0 ? formatNumber(line.credit) : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-900">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(totalDebit)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatNumber(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {(journal.reversalOf || journal.reversedBy) && (
            <p className="text-xs text-slate-500">
              {journal.reversalOf ? "This entry reverses an earlier journal." : "This entry has been reversed."} Recorded {formatDateTime(journal.createdAt)}.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default JournalDetailModal;
