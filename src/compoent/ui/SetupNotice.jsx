"use client";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TONES = {
  warning: "bg-amber-50 text-amber-900 ring-amber-600/20",
  info: "bg-sky-50 text-sky-900 ring-sky-600/20",
};

/**
 * ✅ কোনো জরুরি জিনিস না থাকলে (Currency, Supplier, Cash Drawer…) — কী নেই, আর কোথায় গিয়ে তৈরি করবেন
 *
 * <SetupNotice message="No suppliers yet." actionLabel="Add supplier" href="/vendor" permission="vendor:create" />
 *
 * Permission না থাকলে Button এর বদলে "Ask your admin to …" — Cashier বিভ্রান্ত হন না
 * compact — Field এর নিচে ছোট এক লাইন
 */
const SetupNotice = ({ message, actionLabel, href, permission, adminHint, tone = "warning", compact = false, onNavigate, className = "" }) => {
  const { hasPermission } = useAuth();
  const canAct = href && (!permission || hasPermission(permission));

  if (compact) {
    return (
      <span className={`flex flex-wrap items-center gap-x-1.5 text-xs ${tone === "info" ? "text-sky-700" : "text-amber-700"} ${className}`}>
        <span>{message}</span>
        {canAct ? (
          <Link href={href} onClick={onNavigate} className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
            {actionLabel}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ) : (
          adminHint && <span className="text-slate-500">{adminHint}</span>
        )}
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-2 rounded-xl px-4 py-3 text-[13px] ring-1 ring-inset sm:flex-row sm:items-center sm:justify-between ${TONES[tone]} ${className}`}>
      <p className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {message}
          {!canAct && adminHint && <span className="ml-1 opacity-80">{adminHint}</span>}
        </span>
      </p>
      {canAct && (
        <Link
          href={href}
          onClick={onNavigate}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-indigo-700 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-indigo-50"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
};

export default SetupNotice;
