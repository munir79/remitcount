"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BookOpen, BookOpenText, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAccountLedgerQuery } from "@/redux/features/ledger/ledgerApi";
import { useGetExpenseTypesQuery } from "@/redux/features/pos/posExpenseApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatDate, formatMoney, formatNumber, getTimezone } from "@/lib/format";
import { toAccountOptions } from "@/lib/options";
import PageHeader from "@/compoent/ui/PageHeader";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import BranchSelector from "@/compoent/ui/BranchSelector";
import Combobox from "@/compoent/ui/Combobox";
import Input from "@/compoent/ui/Input";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import StatCard from "@/compoent/ui/StatCard";
import Table from "@/compoent/ui/Table";
import { TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "journal", label: "Ref." },
  { key: "narration", label: "Description" },
  { key: "debit", label: "Debit", align: "right" },
  { key: "credit", label: "Credit", align: "right" },
  { key: "balance", label: "Balance", align: "right" },
];

// Entry র তারিখ Malaysia সময় অনুযায়ী "YYYY-MM-DD" — Date Filter তুলনার জন্য
const toBusinessDay = (date) => new Date(date).toLocaleDateString("en-CA", { timeZone: getTimezone() });

const amountOrDash = (value) => (value > 0 ? formatNumber(value) : <span className="text-slate-300">—</span>);

const LedgerPage = () => {
  const { hasPermission } = useAuth();
  const canFilterByBranch = hasPermission("cashierSession:manage");

  // Chart of Accounts থেকে ?account=<id> দিয়ে সরাসরি এই Page এ আসা যায়
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("account") || "" : ""
  );
  const [branch, setBranch] = useState("");
  // Expense Ledger থেকে এলে একই তারিখ (?from=&to=)
  const [fromDate, setFromDate] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("from") || "" : ""));
  const [toDate, setToDate] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("to") || "" : ""));

  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const accountOptions = toAccountOptions(accountData?.data?.data || []);

  const { data, isLoading, isFetching, refetch } = useGetAccountLedgerQuery(
    { accountId: selectedAccountId, branch: branch || undefined },
    { skip: !selectedAccountId }
  );

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Journal" && selectedAccountId) refetch();
  });

  const account = data?.data?.account;
  const isBranchView = Boolean(data?.data?.branch);

  // খরচের Account হলে — তার ধরনের সহজ Expense Ledger এ যাওয়ার Link (Paid to, Voucher সহ)
  const isExpenseAccount = account?.type === "Expense";
  const { data: expenseTypeData } = useGetExpenseTypesQuery(undefined, { skip: !isExpenseAccount || !hasPermission("posExpense:read") });
  const expenseType = isExpenseAccount ? (expenseTypeData?.data || []).find((t) => (t.account?._id || t.account) === selectedAccountId) : null;
  const expenseLedgerHref = expenseType
    ? `/pos/expense/ledger?${new URLSearchParams({ type: expenseType._id, ...(fromDate ? { from: fromDate } : {}), ...(toDate ? { to: toDate } : {}) })}`
    : "";

  /**
   * ✅ Running Balance — তারিখের ক্রমে Frontend এ হিসাব
   * Debit-normal Account (Asset/Expense): Debit বাড়ায়; Credit-normal (Liability/Equity/Income): Credit বাড়ায়
   * Branch View তে Opening Balance ধরা হয় না (সেটা Company-wide)
   */
  const ledger = useMemo(() => {
    const entries = data?.data?.entries || [];
    if (!account) return null;

    const sign = account.normalBalance === "Credit" ? -1 : 1;
    const opening = isBranchView ? 0 : Number(account.openingBalance || 0);

    let running = opening;
    let broughtForward = opening;
    let totalDebit = 0;
    let totalCredit = 0;
    const visible = [];

    for (const e of entries) {
      running += sign * (Number(e.debit || 0) - Number(e.credit || 0));
      const day = toBusinessDay(e.date);
      if (fromDate && day < fromDate) {
        broughtForward = running;
        continue;
      }
      if (toDate && day > toDate) continue;
      totalDebit += Number(e.debit || 0);
      totalCredit += Number(e.credit || 0);
      visible.push({ ...e, runningBalance: running });
    }

    const closing = visible.length ? visible[visible.length - 1].runningBalance : broughtForward;
    const computedFinal = running;
    // কোনো Filter ছাড়া শেষ Running Balance আর Account এর Balance না মিললে সতর্কবার্তা
    const isOutOfSync = !isBranchView && Math.abs(computedFinal - Number(account.currentBalance || 0)) > 0.005;

    return { opening: broughtForward, visible, totalDebit, totalCredit, closing, isOutOfSync };
  }, [data, account, isBranchView, fromDate, toDate]);

  const hasDateFilter = Boolean(fromDate || toDate);
  const periodLabel = hasDateFilter ? `${fromDate ? formatDate(fromDate) : "Start"} – ${toDate ? formatDate(toDate) : "Today"}` : "All time";

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PrintHeader title={account ? `Ledger — ${account.code} ${account.name}` : "Ledger"} subtitle={periodLabel} />
      <PageHeader
        title="Ledger"
        description="Transaction history and running balance of an account"
        actions={
          account && (
            <div className="flex flex-wrap items-center gap-2">
              {expenseLedgerHref && (
                <Link
                  href={expenseLedgerHref}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 print:hidden"
                >
                  <BookOpenText className="h-4 w-4 text-indigo-600" />
                  View as expense ledger
                </Link>
              )}
              <PrintButton />
            </div>
          )
        }
      />

      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <Combobox
          id="ledgerAccount"
          label="Account"
          value={selectedAccountId}
          onChange={setSelectedAccountId}
          options={accountOptions}
          placeholder="Choose an account"
          searchPlaceholder="Search name or code…"
          className="sm:col-span-2 lg:col-span-1"
        />
        <Input id="fromDate" type="date" label="From" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} />
        <Input id="toDate" type="date" label="To" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} />
        {canFilterByBranch && <BranchSelector branch={branch} onBranchChange={setBranch} />}
      </div>

      {!selectedAccountId ? (
        <EmptyState icon={BookOpen} title="Select an account" description="Choose an account above to see its transactions and running balance." />
      ) : isLoading || !ledger ? (
        <PageLoader />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label={hasDateFilter ? "Balance b/f" : isBranchView ? "Opening (branch)" : "Opening balance"} value={formatMoney(ledger.opening)} icon={Wallet} tone="slate" />
            <StatCard label="Total debit" value={formatMoney(ledger.totalDebit)} icon={ArrowDownRight} tone="sky" />
            <StatCard label="Total credit" value={formatMoney(ledger.totalCredit)} icon={ArrowUpRight} tone="amber" />
            <StatCard label="Closing balance" value={formatMoney(ledger.closing)} icon={BookOpen} tone="indigo" hint={`${account.type} · normal ${account.normalBalance?.toLowerCase()}`} />
          </div>

          {ledger.isOutOfSync && (
            <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20 print:hidden">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                The running total ({formatMoney(ledger.closing)}) does not match the stored account balance ({formatMoney(account.currentBalance)}). Please
                report this to your administrator.
              </p>
            </div>
          )}

          <Table columns={COLUMNS} className={isFetching ? "opacity-70 transition-opacity" : ""}>
            <tr className="bg-slate-50/60">
              <td className={`${TD} text-[13px] text-slate-500`} colSpan={5}>
                {hasDateFilter ? "Balance brought forward" : "Opening balance"}
              </td>
              <td className={`${TD} text-right font-medium tabular-nums text-slate-700`}>{formatNumber(ledger.opening)}</td>
            </tr>
            {ledger.visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No transactions in this period.
                </td>
              </tr>
            ) : (
              ledger.visible.map((entry) => (
                <tr key={entry._id}>
                  <td className={`${TD} whitespace-nowrap text-slate-600`}>{formatDate(entry.date)}</td>
                  <td className={`${TD} font-mono text-xs text-slate-500`}>{entry.journalNumber}</td>
                  <td className={`${TD} max-w-md text-slate-700`}>
                    <p className="line-clamp-2">{entry.narration}</p>
                  </td>
                  <td className={`${TD} text-right tabular-nums text-slate-700`}>{amountOrDash(entry.debit)}</td>
                  <td className={`${TD} text-right tabular-nums text-slate-700`}>{amountOrDash(entry.credit)}</td>
                  <td className={`${TD} text-right font-medium tabular-nums ${entry.runningBalance < 0 ? "text-rose-600" : "text-slate-900"}`}>
                    {formatNumber(entry.runningBalance)}
                  </td>
                </tr>
              ))
            )}
            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td className={`${TD} font-semibold text-slate-900`} colSpan={3}>
                Closing balance
              </td>
              <td className={`${TD} text-right font-semibold tabular-nums text-slate-900`}>{formatNumber(ledger.totalDebit)}</td>
              <td className={`${TD} text-right font-semibold tabular-nums text-slate-900`}>{formatNumber(ledger.totalCredit)}</td>
              <td className={`${TD} text-right font-semibold tabular-nums text-indigo-700`}>{formatNumber(ledger.closing)}</td>
            </tr>
          </Table>
        </>
      )}
    </div>
  );
};

export default LedgerPage;
