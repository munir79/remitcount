"use client";
import { useState } from "react";
import Link from "next/link";
import { Banknote, ChevronRight, Landmark, Plus, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatMoney } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import StatCard from "@/compoent/ui/StatCard";
import Badge from "@/compoent/ui/Badge";
import Button from "@/compoent/ui/Button";
import CashBankFormModal from "@/compoent/bank/CashBankFormModal";

// Drawer = Counter (Cashier Session লাগে)
const TYPE_META = {
  Cash: { icon: Wallet, tone: "bg-amber-50 text-amber-600", fallback: "Cash drawer" },
  Bank: { icon: Landmark, tone: "bg-sky-50 text-sky-600", fallback: "Bank account" },
};

const AccountCard = ({ ba }) => {
  const meta = TYPE_META[ba.accountType] || TYPE_META.Cash;
  const Icon = meta.icon;
  const isBankType = ba.accountType === "Bank";
  const balance = Number(ba.account?.currentBalance || 0);
  return (
    <Link
      href={`/ledger?account=${ba.account?._id}`}
      className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition hover:border-indigo-200 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <Badge variant={ba.status === "active" ? "success" : "neutral"}>{ba.status}</Badge>
      </div>
      <p className="mt-4 truncate text-sm font-semibold text-slate-900">{ba.account?.name}</p>
      <p className="truncate text-xs text-slate-500">
        {[isBankType ? [ba.bankName, ba.bankAccountNumber].filter(Boolean).join(" · ") : ba.location, ba.branch?.name].filter(Boolean).join(" · ") || meta.fallback}
      </p>
      <div className="mt-4 flex items-end justify-between">
        <p className={`text-xl font-semibold tabular-nums ${balance < 0 ? "text-rose-600" : "text-slate-900"}`}>{formatMoney(balance)}</p>
        <span className="flex items-center gap-0.5 text-xs font-medium text-slate-400 group-hover:text-indigo-600">
          Ledger
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
      {isBankType && ba.allowNegativeBalance && <p className="mt-2 text-xs text-slate-400">Overdraft allowed</p>}
    </Link>
  );
};

const BankAccountPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("bankAccount:create");
  const { data, isLoading, refetch } = useGetAllBankAccountsQuery({ limit: 100 });
  const [modalType, setModalType] = useState(null); // "Cash" | "Bank" | null

  const bankAccounts = data?.data?.data || [];
  const cashAccounts = bankAccounts.filter((ba) => ba.accountType === "Cash");
  const banks = bankAccounts.filter((ba) => ba.accountType === "Bank");
  const sum = (list) => list.reduce((s, ba) => s + Number(ba.account?.currentBalance || 0), 0);

  useSocketEvent("company-data-updated", (payload) => {
    if (["BankAccount", "Journal", "CashierSession", "CashTransfer"].includes(payload?.module)) refetch();
  });

  const addButton = canCreate && (
    <Button onClick={() => setModalType("Cash")}>
      <Plus className="h-4 w-4" />
      Add Cash / Bank
    </Button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Cash & Bank" description="Cashier drawers and bank accounts with their current balances" actions={addButton} />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Physical cash" value={formatMoney(sum(cashAccounts))} icon={Wallet} tone="amber" hint={`${cashAccounts.length} drawer(s)`} isLoading={isLoading} />
        <StatCard label="Cash at bank" value={formatMoney(sum(banks))} icon={Landmark} tone="sky" hint={`${banks.length} account(s)`} isLoading={isLoading} />
        <StatCard label="Total cash & bank" value={formatMoney(sum(bankAccounts))} icon={Banknote} tone="indigo" isLoading={isLoading} />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : bankAccounts.length === 0 ? (
        <EmptyState icon={Landmark} title="No cash drawers or banks yet" description="Add a cash drawer for each counter and your bank accounts — their accounts are created for you." action={addButton} />
      ) : (
        <div className="space-y-8">
          {[
            { title: "Cash drawers", type: "Cash", list: cashAccounts, empty: "No cash drawer yet — add one for each counter.", add: "Add cash drawer" },
            { title: "Cash at bank", type: "Bank", list: banks, empty: "No bank account yet.", add: "Add bank account" },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-sm font-semibold text-slate-900">{section.title}</h2>
              {section.list.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-500">{section.empty}</p>
                  {canCreate && (
                    <Button size="sm" variant="secondary" onClick={() => setModalType(section.type)}>
                      <Plus className="h-4 w-4" />
                      {section.add}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {section.list.map((ba) => (
                    <AccountCard key={ba._id} ba={ba} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}


      {modalType && <CashBankFormModal key={modalType} isOpen onClose={() => setModalType(null)} defaultType={modalType} />}
    </div>
  );
};

export default BankAccountPage;
