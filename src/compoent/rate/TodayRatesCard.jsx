"use client";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { describeInverse, rateUnitLabel } from "@/lib/currencyMath";
import { formatDateTime, isBusinessToday, timeAgo } from "@/lib/format";

const cell = (v) => (v == null ? <span className="text-slate-300">—</span> : Number(v).toLocaleString("en-MY", { maximumFractionDigits: 6 }));

/** POS Dashboard এর জন্য আজকের Rate — Counter এ এক নজরে */
const TodayRatesCard = () => {
  const { data, isLoading, refetch } = useGetRateBoardQuery();
  useSocketEvent("company-data-updated", (payload) => {
    if (["ExchangeRate", "Currency"].includes(payload?.module)) refetch();
  });
  const board = data?.data || [];
  const withRates = board.filter((r) => r.checkedAt);
  const stale = withRates.filter((r) => !isBusinessToday(r.checkedAt));
  const lastChecked = withRates.reduce((max, r) => (!max || new Date(r.checkedAt) > new Date(max) ? r.checkedAt : max), null);

  return (
    <section aria-labelledby="today-rates" className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 id="today-rates" className="text-sm font-semibold text-slate-900">
            Today&apos;s rates
          </h2>
          {lastChecked && (
            <p className="text-xs text-slate-500" title={formatDateTime(lastChecked)}>
              Last checked {timeAgo(lastChecked)}
            </p>
          )}
        </div>
        <Link href="/pos/rates" className="flex items-center gap-0.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700">
          All rates
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {stale.length > 0 && (
        <p className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {stale.map((r) => r.currency.code).join(", ")} rate not checked today — confirm with your admin before quoting a customer.
        </p>
      )}
      {isLoading ? (
        <div className="h-32 animate-pulse bg-slate-50" />
      ) : board.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">No currencies yet.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="px-5 py-2 text-left font-medium">Currency</th>
                <th className="px-3 py-2 text-right font-medium">Buy</th>
                <th className="px-3 py-2 text-right font-medium">Sell</th>
                <th className="px-5 py-2 text-right font-medium">Send</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {board.map((r) => (
                <tr key={r.currency._id}>
                  <td className="px-5 py-2.5">
                    <span className={`font-mono text-xs font-bold ${r.checkedAt && !isBusinessToday(r.checkedAt) ? "text-amber-700" : "text-slate-800"}`}>{r.currency.code}</span>
                    <span className="ml-2 text-xs text-slate-400">{rateUnitLabel(r.currency)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{cell(r.buyRate)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{cell(r.sellRate)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">
                    <p className="font-semibold text-slate-900">{cell(r.sendRate)}</p>
                    {/* উল্টো দিক — "1 BDT = RM 0.0377" */}
                    {r.sendRate != null && <p className="whitespace-nowrap text-[11px] text-slate-400">{describeInverse(r.sendRate, r.currency)}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default TodayRatesCard;
