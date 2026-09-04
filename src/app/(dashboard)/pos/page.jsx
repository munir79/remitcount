"use client";
import CashierSessionBar from "@/compoent/pos/CashierSessionBar";
import BranchSelector from "@/compoent/ui/BranchSelector";
import { useAuth } from "@/hooks/useAuth";
import { useGetPosDashboardSummaryQuery } from "@/redux/features/pos/posDashboardApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { Send, Coins, ArrowDownCircle, Gift, BookUser, BookOpen, ArrowUpCircle, Receipt, BarChart3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";


const TILES = [
  { key: "send", label: "Send", icon: Send, href: "/pos/send" },
  { key: "buyCurrency", label: "Buy Currency", icon: Coins, href: "/pos/buy-currency" },
  { key: "paymentIn", label: "Payment In", icon: ArrowDownCircle, href: "/pos/payment-in" },
  { key: "otherIncome", label: "Other Income", icon: Gift, href: "/pos/other-income" },
  { key: "accounts", label: "Debtors/Creditors", icon: BookUser, href: "/pos/debtors" },
  { key: "sellCurrency", label: "Sell Currency", icon: Coins, href: "/pos/sell-currency" },
  { key: "paymentOut", label: "Payment Out", icon: ArrowUpCircle, href: "/pos/payment-out" },
  { key: "expense", label: "Expense", icon: Receipt, href: "/pos/expense" },
  { key: "currencyStock", label: "Currency Stock", icon: BookOpen, href: "/pos/currency-stock" },
  { key: "reports", label: "Reports", icon: BarChart3, href: "/reports/profit-loss" },
];

const RELEVANT_MODULES = [
  "BuyCurrency", "SellCurrency", "Send", "OtherIncome", "PosExpense",
  "PaymentIn", "PaymentOut", "Customer", "Vendor", "CashierSession",
];

const PosDashboardPage = () => {
  // PosDashboardPage Component এর ভেতরে:
const { hasPermission } = useAuth();
const [branch, setBranch] = useState("");
const canFilterByBranch = hasPermission("cashierSession:manage");
  const router = useRouter();
const { data, isLoading, refetch } = useGetPosDashboardSummaryQuery({ period: "today", branch: branch || undefined });

  useSocketEvent("company-data-updated", (payload) => {
    if (RELEVANT_MODULES.includes(payload?.module)) refetch();
  });

  const summary = data?.data;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold tracking-tight text-slate-900">POS Dashboard</h1>
      
      {/* // h1 এর ঠিক পরে, CashierSessionBar এর আগে/পরে যোগ করুন: */}
{canFilterByBranch && (
  <div className="mb-4 w-56">
    <BranchSelector branch={branch} onBranchChange={setBranch} />
  </div>
)}
      <CashierSessionBar />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:w-2/3 lg:grid-cols-5">
          {TILES.map((tile) => (
            <button
              key={tile.key}
              onClick={() => router.push(tile.href)}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[9px] bg-[#EEF2FF]  border  border-gray-200 p-4 text-center text-black  shadow-indigo-600/20 transition hover:bg-[#7e90cd] active:scale-[0.98]"
            >
              <tile.icon className="h-7 w-7" />
              <span className="text-sm font-semibold leading-tight">{tile.label}</span>
            </button>
          ))}
        </div>

        <div className="lg:w-1/3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-bold text-slate-700">Summary of Daily Transactions</p>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">1. Profit</span>
                  <span className={`font-bold tabular-nums ${summary?.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    ৳ {Number(summary?.profit || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">2. Creditors</span>
                  <span className="font-bold tabular-nums text-slate-900">৳ {Number(summary?.creditors || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">3. Debtors</span>
                  <span className="font-bold tabular-nums text-slate-900">৳ {Number(summary?.debtors || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3">
                  <span className="text-slate-600">4. Cash in Hand</span>
                  <span className="font-bold tabular-nums text-indigo-700">৳ {Number(summary?.cashInHand || 0).toFixed(2)}</span>
                </div>
                {summary?.scope === "own-session" && summary?.cashInHand === 0 && (
                  <p className="text-xs text-amber-600">No open cashier session. Open a session to see your cash balance.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosDashboardPage;