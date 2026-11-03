"use client";
import { useState } from "react";
import { Printer } from "lucide-react";
import { useGetPartyStatementQuery } from "@/redux/features/report/reportApi";
import { formatDate, formatMoney } from "@/lib/format";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import PageLoader from "../ui/PageLoader";

/**
 * Balance এর মানে কথায় — Customer: + আমাদের দেবেন; Supplier: + আমরা দেবো
 * "To collect RM 400" / "To pay RM 418" / "Settled"
 */
export const describePartyBalance = (partyType, balance) => {
  const n = Math.round((Number(balance) || 0) * 100) / 100;
  if (n === 0) return { label: "Settled", tone: "text-slate-500" };
  const theyOweUs = partyType === "Vendor" ? n < 0 : n > 0;
  return theyOweUs ? { label: `To collect ${formatMoney(Math.abs(n))}`, tone: "text-sky-700" } : { label: `To pay ${formatMoney(Math.abs(n))}`, tone: "text-amber-700" };
};

const BalanceText = ({ partyType, value, strong }) => {
  const { label, tone } = describePartyBalance(partyType, value);
  return <span className={`whitespace-nowrap tabular-nums ${tone} ${strong ? "font-semibold" : ""}`}>{label}</span>;
};

/**
 * ✅ Customer / Supplier এর Statement (Ledger) — প্রতিটা লেনদেন: তারিখ, Trx No., বিবরণ, চলমান Balance
 * party: { _id, name, partyType } — null হলে বন্ধ
 */
const PartyStatementModal = ({ party, onClose }) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const isOpen = Boolean(party);
  const dateError = fromDate && toDate && fromDate > toDate ? "The 'from' date is after the 'to' date" : "";

  const { data, isFetching, error } = useGetPartyStatementQuery(
    { partyType: party?.partyType, party: party?._id, ...(fromDate ? { fromDate } : {}), ...(toDate ? { toDate } : {}) },
    { skip: !isOpen || Boolean(dateError), refetchOnMountOrArgChange: true }
  );
  const statement = data?.data;
  const partyType = party?.partyType;
  const isVendor = partyType === "Vendor";

  const handleClose = () => {
    setFromDate("");
    setToDate("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      title={`${party?.name || ""} — statement`}
      description={`${isVendor ? "Supplier" : "Customer"} · every transaction with its number, description and running balance`}
      footer={
        <>
          <Button variant="secondary" onClick={() => window.print()} disabled={!statement}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleClose}>Close</Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3 print:hidden">
        <Input id="statementFrom" type="date" label="From" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
        <Input id="statementTo" type="date" label="To" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} className="w-40" />
        {(fromDate || toDate) && (
          <Button variant="ghost" onClick={() => (setFromDate(""), setToDate(""))}>
            All dates
          </Button>
        )}
        {dateError && <p className="pb-2.5 text-[13px] font-medium text-rose-600">{dateError}</p>}
      </div>

      {error ? (
        <p className="text-[13px] font-medium text-rose-600">{error?.data?.message || "Could not load the statement"}</p>
      ) : !statement || isFetching ? (
        <PageLoader />
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                <th className="px-3 py-2.5 text-left">Date</th>
                <th className="px-3 py-2.5 text-left">Trx no.</th>
                <th className="px-3 py-2.5 text-left">Description</th>
                {/* Customer: Debit = আমাদের দিতে হবে বাড়ল; Supplier: Credit = আমাদের দিতে হবে বাড়ল */}
                <th className="px-3 py-2.5 text-right">{isVendor ? "Paid / reduced" : "Charged"}</th>
                <th className="px-3 py-2.5 text-right">{isVendor ? "Charged by them" : "Received / reduced"}</th>
                <th className="px-3 py-2.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/60">
                <td className="px-3 py-2.5 text-slate-500" colSpan={5}>
                  {statement.fromDate ? `Opening balance on ${formatDate(statement.fromDate)}` : "Opening balance"}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <BalanceText partyType={partyType} value={statement.opening} />
                </td>
              </tr>
              {statement.entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-slate-500">
                    No transactions in this period.
                  </td>
                </tr>
              ) : (
                statement.entries.map((e) => (
                  <tr key={e._id}>
                    <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{formatDate(e.date)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700">{e.journalNumber}</td>
                    <td className="px-3 py-2.5 text-slate-800">{e.narration}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{e.debit ? formatMoney(e.debit) : ""}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{e.credit ? formatMoney(e.credit) : ""}</td>
                    <td className="px-3 py-2.5 text-right">
                      <BalanceText partyType={partyType} value={e.balance} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 font-semibold">
                <td className="px-3 py-3 text-slate-700" colSpan={3}>
                  {statement.toDate ? `Closing balance on ${formatDate(statement.toDate)}` : "Balance now"}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-900">{formatMoney(statement.totalDebit)}</td>
                <td className="px-3 py-3 text-right tabular-nums text-slate-900">{formatMoney(statement.totalCredit)}</td>
                <td className="px-3 py-3 text-right">
                  <BalanceText partyType={partyType} value={statement.closing} strong />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default PartyStatementModal;
