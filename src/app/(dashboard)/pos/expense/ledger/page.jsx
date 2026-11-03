"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BookOpen, BookOpenText, Printer, Search } from "lucide-react";
import { useGetExpenseLedgerQuery, useGetExpenseTypesQuery } from "@/redux/features/pos/posExpenseApi";
import { formatDate, formatMoney } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import Input from "@/compoent/ui/Input";
import Select from "@/compoent/ui/Select";
import Button from "@/compoent/ui/Button";
import Badge from "@/compoent/ui/Badge";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";

/**
 * ✅ খরচের Ledger — একটা ধরন (যেমন Rent) এর সব খরচ তারিখ ধরে, চলমান মোট সহ
 * শুরুর তারিখ দিলে তার আগের মোট "Brought forward"; Cancel হওয়া খরচ নেই
 * Filter বাছাই করে "Show" / Enter চাপলে তবেই দেখায়
 */
const ExpenseLedgerPage = () => {
  const searchParams = useSearchParams();
  // General Ledger থেকে এলে ধরন আর তারিখ (?type=&from=&to=)
  const initial = { expenseType: searchParams.get("type") || "", fromDate: searchParams.get("from") || "", toDate: searchParams.get("to") || "" };
  const [draft, setDraft] = useState(initial);
  const [applied, setApplied] = useState(initial);

  const { data: typeData } = useGetExpenseTypesQuery();
  const types = typeData?.data || [];
  const dateError = draft.fromDate && draft.toDate && draft.fromDate > draft.toDate ? "The 'from' date is after the 'to' date" : "";

  const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v));
  const { data, isFetching, error } = useGetExpenseLedgerQuery(params, { skip: !applied.expenseType, refetchOnMountOrArgChange: true });
  const ledger = data?.data;

  const handleApply = (e) => {
    e.preventDefault();
    if (dateError || !draft.expenseType) return;
    setApplied(draft);
  };
  const isDirty = JSON.stringify(draft) !== JSON.stringify(applied);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/pos/expense" className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 print:hidden">
        <ArrowLeft className="h-4 w-4" />
        Expenses
      </Link>
      <PageHeader
        title="Expense ledger"
        description="Every expense of one type, date by date, with a running total"
        actions={
          ledger && (
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              {/* একই Account — Accountant এর Debit / Credit খাতা (Cancel এর উল্টো লেখা, হাতে লেখা Journal সহ) */}
              <Link
                href={`/ledger?${new URLSearchParams({ account: ledger.type.account?._id || "", ...(applied.fromDate ? { from: applied.fromDate } : {}), ...(applied.toDate ? { to: applied.toDate } : {}) })}`}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
              >
                <BookOpen className="h-4 w-4 text-indigo-600" />
                Open in General Ledger
              </Link>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          )
        }
      />

      <form onSubmit={handleApply} noValidate className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card print:hidden">
        <Select id="ledgerType" label="Type of expense" value={draft.expenseType} onChange={(e) => setDraft({ ...draft, expenseType: e.target.value })} className="w-56">
          <option value="">Choose type</option>
          {types.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} ({t.classification})
            </option>
          ))}
        </Select>
        <Input id="ledgerFrom" type="date" label="From" value={draft.fromDate} max={draft.toDate || undefined} onChange={(e) => setDraft({ ...draft, fromDate: e.target.value })} className="w-40" />
        <Input id="ledgerTo" type="date" label="To" value={draft.toDate} min={draft.fromDate || undefined} onChange={(e) => setDraft({ ...draft, toDate: e.target.value })} className="w-40" />
        <Button type="submit" disabled={!draft.expenseType || Boolean(dateError)}>
          <Search className="h-4 w-4" />
          Show
        </Button>
        {isDirty && applied.expenseType && <p className="pb-2.5 text-xs text-amber-700">Press Show to apply the changes</p>}
        {dateError && <p className="pb-2.5 text-[13px] font-medium text-rose-600">{dateError}</p>}
      </form>

      {!applied.expenseType ? (
        <EmptyState icon={BookOpenText} title="Choose an expense type" description="Pick a type (for example Rent), optionally a date range, then press Show." />
      ) : error ? (
        <p className="text-[13px] font-medium text-rose-600">{error?.data?.message || "Could not load the ledger"}</p>
      ) : !ledger || isFetching ? (
        <PageLoader />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-slate-900">{ledger.type.name}</p>
            <Badge variant={ledger.type.classification === "Admin" ? "primary" : "info"} dot={false}>
              {ledger.type.classification}
            </Badge>
            <p className="text-xs text-slate-500">
              {ledger.type.account?.code} {ledger.type.account?.name}
              {(applied.fromDate || applied.toDate) && ` · ${applied.fromDate ? formatDate(applied.fromDate) : "start"} – ${applied.toDate ? formatDate(applied.toDate) : "today"}`}
            </p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="px-4 py-2.5 text-left">Date</th>
                  <th className="px-4 py-2.5 text-left">No.</th>
                  <th className="px-4 py-2.5 text-left">Description</th>
                  <th className="px-4 py-2.5 text-left">Paid from</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-right">Running total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applied.fromDate && (
                  <tr className="bg-slate-50/60">
                    <td className="px-4 py-2.5 text-slate-500" colSpan={5}>
                      Brought forward (before {formatDate(applied.fromDate)})
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatMoney(ledger.opening)}</td>
                  </tr>
                )}
                {ledger.entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-slate-500">
                      No expenses of this type in this period.
                    </td>
                  </tr>
                ) : (
                  ledger.entries.map((e) => (
                    <tr key={e._id}>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{formatDate(e.date)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <Link href={`/pos/expense/${e._id}/voucher`} className="font-mono text-xs text-indigo-600 hover:text-indigo-800">
                          {e.expenseNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-slate-800">{[e.description, e.paidTo && `to ${e.paidTo}`].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{e.paidFrom}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">{formatMoney(e.amount)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatMoney(e.runningTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold">
                  <td className="px-4 py-3 text-slate-700" colSpan={4}>
                    Total in this period
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">{formatMoney(ledger.periodTotal)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">{formatMoney(ledger.closing)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// useSearchParams এর জন্য Suspense লাগে (Next.js Build)
const ExpenseLedgerRoute = () => (
  <Suspense fallback={<PageLoader className="h-[60vh]" />}>
    <ExpenseLedgerPage />
  </Suspense>
);

export default ExpenseLedgerRoute;
