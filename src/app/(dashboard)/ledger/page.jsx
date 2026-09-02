"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAccountLedgerQuery } from "@/redux/features/ledger/ledgerApi";
import Select from "@/compoent/ui/Select";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import { useSocketEvent } from "@/socket/useSocketEvent";


const COLUMNS = [
  { key: "date", label: "Date" },
  { key: "journal", label: "Journal No." },
  { key: "narration", label: "Narration" },
  { key: "debit", label: "Debit" },
  { key: "credit", label: "Credit" },
  { key: "balance", label: "Balance" },
];

const LedgerPage = () => {
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const accounts = accountData?.data?.data || [];

  const [selectedAccountId, setSelectedAccountId] = useState("");

  const { data, isLoading, refetch } = useGetAccountLedgerQuery(
    { accountId: selectedAccountId },
    { skip: !selectedAccountId }
  );

  useSocketEvent("company-data-updated", (payload) => {
    if (payload.module === "Journal" && selectedAccountId) refetch();
  });

  const ledgerData = data?.data;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold text-neutral-900">Ledger</h1>

      <div className="mb-6 w-72">
        <Select id="account" label="Select Account" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
          <option value="">Choose an account</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>
      </div>

      {!selectedAccountId ? (
        <EmptyState title="Select an account" description="Choose an account above to see its transaction history" />
      ) : isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3">
            <span className="text-sm text-neutral-600">
              {ledgerData?.account?.code} — {ledgerData?.account?.name}
            </span>
            <span className="text-sm font-semibold text-neutral-900">
              Current Balance: ৳ {Number(ledgerData?.account?.currentBalance || 0).toFixed(2)}
            </span>
          </div>

          {ledgerData?.entries?.length === 0 ? (
            <EmptyState title="No transactions yet" description="This account has no ledger entries" />
          ) : (
            <Table columns={COLUMNS}>
              {ledgerData?.entries?.map((entry) => (
                <tr key={entry._id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-600">{new Date(entry.date).toLocaleDateString("en-GB")}</td>
                  <td className="px-4 py-3 text-neutral-600">{entry.journalNumber}</td>
                  <td className="px-4 py-3 text-neutral-600">{entry.narration}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                    {entry.debit > 0 ? `৳ ${entry.debit.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-neutral-700">
                    {entry.credit > 0 ? `৳ ${entry.credit.toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900">
                    ৳ {entry.balanceAfter.toFixed(2)}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
};

export default LedgerPage;