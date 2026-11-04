"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Send, Coins, ArrowDownCircle, ArrowUpCircle, Gift, Receipt, BookUser, Package, BarChart3,
  TrendingUp, HandCoins, Landmark, Wallet, ChevronRight,
} from "lucide-react";

import CashierSessionBar from "@/compoent/pos/CashierSessionBar";
import BranchSelector from "@/compoent/ui/BranchSelector";
import PageHeader from "@/compoent/ui/PageHeader";
import StatCard from "@/compoent/ui/StatCard";
import TodayRatesCard from "@/compoent/rate/TodayRatesCard";
import SetupChecklist from "@/compoent/pos/SetupChecklist";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatMoney, getTimezone } from "@/lib/format";
import { useGetPosDashboardSummaryQuery } from "@/redux/features/pos/posDashboardApi";
import { useSocketEvent } from "@/socket/useSocketEvent";

// Client এর PDF অনুযায়ী Quick Action Tile — Permission না থাকলে Tile দেখাবে না
const TILES = [
  { key: "send", label: "Send", hint: "Remittance", icon: Send, href: "/pos/send", tone: "indigo", permission: "send:read" },
  { key: "buyCurrency", label: "Buy Currency", hint: "From customer", icon: ArrowDownCircle, href: "/pos/buy-currency", tone: "emerald", permission: "currencyStock:read" },
  { key: "sellCurrency", label: "Sell Currency", hint: "To customer", icon: ArrowUpCircle, href: "/pos/sell-currency", tone: "sky", permission: "currencyStock:read" },
  { key: "paymentIn", label: "Payment In", hint: "Receive money", icon: HandCoins, href: "/pos/payment-in", tone: "emerald", permission: "paymentIn:read" },
  { key: "paymentOut", label: "Payment Out", hint: "Pay money", icon: Wallet, href: "/pos/payment-out", tone: "rose", permission: "paymentOut:read" },
  { key: "otherIncome", label: "Other Income", hint: "Bills & services", icon: Gift, href: "/pos/other-income", tone: "violet", permission: "otherIncome:read" },
  { key: "expense", label: "Expense", hint: "Admin / Direct", icon: Receipt, href: "/pos/expense", tone: "amber", permission: "posExpense:read" },
  { key: "currencyStock", label: "Currency Stock", hint: "Stock & avg. cost", icon: Package, href: "/pos/currency-stock", tone: "indigo", permission: "currencyStock:read" },
  { key: "accounts", label: "Debtors & Creditors", hint: "Balances & ledger", icon: BookUser, href: "/pos/debtors", tone: "slate", permission: "customer:read" },
  { key: "reports", label: "Reports", hint: "P&L, balance sheet", icon: BarChart3, href: "/reports/profit-loss", tone: "slate", permission: "report:view" },
];

const TILE_TONES = {
  indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  sky: "bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white",
  rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
  violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white",
  slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white",
};

const RELEVANT_MODULES = [
  "BuyCurrency", "SellCurrency", "Send", "OtherIncome", "PosExpense",
  "PaymentIn", "PaymentOut", "Customer", "Vendor", "CashierSession",
];

// Malaysia সময় অনুযায়ী Greeting
const getGreeting = () => {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: getTimezone() }));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const PosDashboardPage = () => {
  const { user, hasPermission } = useAuth();
  const [branch, setBranch] = useState("");
  const canFilterByBranch = hasPermission("cashierSession:manage");

  const { data, isLoading, refetch } = useGetPosDashboardSummaryQuery({ period: "today", branch: branch || undefined });

  useSocketEvent("company-data-updated", (payload) => {
    if (RELEVANT_MODULES.includes(payload?.module)) refetch();
  });

  const summary = data?.data;
  const cashHidden = summary?.cashInHand === null; // Blind Count — Cashier নিজের Drawer এর হিসাব দেখেন না
  const profit = Number(summary?.profit || 0);
  const cashBreakdown = summary?.cashBreakdown || [];
  const visibleTiles = TILES.filter((tile) => !tile.permission || hasPermission(tile.permission));
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`${getGreeting()}${firstName ? `, ${firstName}` : ""}`}
        description={`Here's what's happening at the counter today · ${formatDate(new Date())}`}
        actions={
          canFilterByBranch && (
            <div className="w-60">
              <BranchSelector branch={branch} onBranchChange={setBranch} />
            </div>
          )
        }
      />

      <SetupChecklist />

      <CashierSessionBar />

      {/* Summary of Daily Transactions — Client PDF এর ৪টা সংখ্যা */}
      <section aria-label="Today's summary" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Profit"
          value={formatMoney(profit)}
          icon={TrendingUp}
          tone={profit >= 0 ? "emerald" : "rose"}
          valueClassName={profit >= 0 ? "text-emerald-600" : "text-rose-600"}
          isLoading={isLoading}
        />
        <StatCard label="To collect (Debtors)" value={formatMoney(summary?.debtors)} icon={HandCoins} tone="sky" hint="Customers still have to pay us" isLoading={isLoading} />
        <StatCard label="To pay (Creditors)" value={formatMoney(summary?.creditors)} icon={Landmark} tone="amber" hint="We still have to pay" isLoading={isLoading} />
        <StatCard
          label="Cash in Hand"
          value={cashHidden ? "—" : formatMoney(summary?.cashInHand)}
          icon={Coins}
          tone="indigo"
          hint={cashHidden ? "Counted when you close" : summary?.scope === "own-session" ? "Your drawer" : "All cash drawers"}
          isLoading={isLoading}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Quick Actions */}
        <section aria-labelledby="quick-actions" className="xl:col-span-2">
          <h2 id="quick-actions" className="mb-3 text-sm font-semibold text-slate-900">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {visibleTiles.map((tile) => (
              <Link
                key={tile.key}
                href={tile.href}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition
                  hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-elevated
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${TILE_TONES[tile.tone]}`}>
                  <tile.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-slate-900">{tile.label}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{tile.hint}</p>
                </div>
              </Link>
            ))}
          </div>
          {hasPermission("rate:read") && <TodayRatesCard />}
        </section>

        {/* Cash Position — Cashier 1, Cashier 2 … */}
        <section aria-labelledby="cash-position" className="rounded-2xl border border-slate-200/80 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 id="cash-position" className="text-sm font-semibold text-slate-900">
              Cash position
            </h2>
            <span className="text-xs text-slate-500">{summary?.scope === "own-session" ? "Your drawer" : "All drawers"}</span>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : cashBreakdown.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No cash drawers to show yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cashBreakdown.map((row, idx) => (
                <li key={`${row.accountName}-${idx}`} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <span className="truncate text-sm text-slate-700">{row.accountName}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{row.balance === null ? "—" : formatMoney(row.balance)}</span>
                </li>
              ))}
              {!cashHidden && (
                <li className="flex items-center justify-between bg-slate-50/70 px-5 py-3">
                  <span className="text-sm font-medium text-slate-600">Total</span>
                  <span className="text-sm font-semibold tabular-nums text-indigo-700">{formatMoney(summary?.cashInHand)}</span>
                </li>
              )}
            </ul>
          )}

          <Link
            href="/pos/currency-stock"
            className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[13px] font-medium text-indigo-600 hover:bg-indigo-50/50"
          >
            View currency stock
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default PosDashboardPage;
