"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Rocket, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetAllVendorsQuery } from "@/redux/features/vendor/vendorApi";
import { useGetAllCurrencyStocksQuery } from "@/redux/features/pos/currencyStockApi";
import { useGetAllStaffQuery } from "@/redux/features/auth/authApi";
import { useGetRateBoardQuery, useGetSupplierRatesQuery } from "@/redux/features/rate/rateApi";

const DISMISS_KEY = "setup-checklist-dismissed";

const readDismissed = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * ✅ নতুন Company র Admin এর জন্য — কাজ শুরুর আগে কী কী বানাতে হবে, ধাপে ধাপে Button সহ
 * সব শেষ হলে নিজে থেকে লুকায়; "Hide" চাপলেও লুকায় (এই Browser এ মনে রাখে)
 */
const SetupChecklist = () => {
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission("rate:update");
  const [dismissed, setDismissed] = useState(readDismissed);
  const skip = { skip: !isAdmin || dismissed };

  const { data: bankData } = useGetAllBankAccountsQuery({ limit: 100 }, skip);
  const { data: boardData } = useGetRateBoardQuery(undefined, skip);
  const { data: vendorData } = useGetAllVendorsQuery({ limit: 1 }, skip);
  const { data: supplierRateData } = useGetSupplierRatesQuery(undefined, skip);
  const { data: stockData } = useGetAllCurrencyStocksQuery({ limit: 1 }, skip);
  const { data: staffData } = useGetAllStaffQuery({ limit: 2 }, skip);

  if (!isAdmin || dismissed) return null;
  const loaded = bankData && boardData && vendorData && supplierRateData && stockData && staffData;
  if (!loaded) return null;

  const bankAccounts = bankData?.data?.data || [];
  const steps = [
    {
      done: bankAccounts.some((b) => b.accountType === "Cash"),
      title: "Add a cash drawer",
      text: "One for each counter, so cashiers can take cash.",
      href: "/bank-account",
      action: "Add cash drawer",
    },
    {
      done: (boardData?.data || []).some((b) => b.sendRate || b.buyRate || b.sellRate),
      title: "Set today's rates",
      text: "Buy, sell and send rates for each currency.",
      href: "/pos/rates",
      action: "Set rates",
    },
    {
      done: (vendorData?.data?.pagination?.total ?? vendorData?.data?.data?.length ?? 0) > 0,
      title: "Add a supplier",
      text: "The remittance partner who delivers your sends.",
      href: "/vendor",
      action: "Add supplier",
    },
    {
      done: (supplierRateData?.data || []).length > 0,
      title: "Set supplier rates",
      text: "What each supplier charges — used to calculate send profit.",
      href: "/pos/rates",
      action: "Set supplier rates",
    },
    {
      done: (stockData?.data?.pagination?.total ?? stockData?.data?.data?.length ?? 0) > 0,
      title: "Register currencies for exchange",
      text: "Needed before you can buy or sell foreign currency.",
      href: "/pos/currency-stock",
      action: "Register currency",
    },
    {
      done: (staffData?.data?.pagination?.total ?? staffData?.data?.data?.length ?? 0) > 1,
      title: "Add your cashiers",
      text: "Give each staff member their own login and branch.",
      href: "/staff",
      action: "Add staff",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage বন্ধ থাকলে শুধু এই Visit এ লুকায়
    }
  };

  return (
    <section aria-labelledby="setup-checklist" className="mb-6 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-card">
      <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-50 to-white px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <h2 id="setup-checklist" className="text-sm font-semibold text-slate-900">
              Finish setting up your counter
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {doneCount} of {steps.length} done — complete these once before your first transaction.
            </p>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Hide setup checklist" className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1 bg-slate-100">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="divide-y divide-slate-100">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              {step.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
              <div>
                <p className={`text-sm font-medium ${step.done ? "text-slate-400 line-through" : "text-slate-900"}`}>
                  {i + 1}. {step.title}
                </p>
                {!step.done && <p className="text-xs text-slate-500">{step.text}</p>}
              </div>
            </div>
            {!step.done && (
              <Link
                href={step.href}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-indigo-50 px-3 py-1.5 text-[13px] font-semibold text-indigo-700 transition hover:bg-indigo-100 sm:self-auto"
              >
                {step.action}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};

export default SetupChecklist;
