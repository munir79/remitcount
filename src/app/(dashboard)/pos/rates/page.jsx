"use client";
import { useState } from "react";
import Link from "next/link";
import { History, Lock, Settings2, TrendingUp, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetRateBoardQuery, useGetSupplierRatesQuery } from "@/redux/features/rate/rateApi";
import { useGetAllVendorsQuery } from "@/redux/features/vendor/vendorApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Button from "@/compoent/ui/Button";
import RateBoardEditor from "@/compoent/rate/RateBoardEditor";
import SupplierRatesEditor from "@/compoent/rate/SupplierRatesEditor";
import RateHistoryTable from "@/compoent/rate/RateHistoryTable";

// Save এর পর নতুন Data এলে Editor আবার Mount হয়ে Draft নতুন করে ভরে
const versionKey = (list = []) => list.map((r) => `${r._id || r.currency?._id}:${r.updatedAt || ""}`).join("|");

const RatesPage = () => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("rate:update");
  const canManageCurrencies = hasPermission("currency:manage");
  const [tab, setTab] = useState("board");

  const { data: boardData, isLoading: isBoardLoading, refetch: refetchBoard } = useGetRateBoardQuery();
  const { data: supplierData, isLoading: isSupplierLoading, refetch: refetchSupplier } = useGetSupplierRatesQuery(undefined, { skip: !canEdit });
  const { data: vendorData } = useGetAllVendorsQuery({ limit: 200 }, { skip: !canEdit || tab === "board" });

  useSocketEvent("company-data-updated", (payload) => {
    if (["ExchangeRate", "Currency"].includes(payload?.module)) refetchBoard();
    if (payload?.module === "SupplierRate" && canEdit) refetchSupplier();
  });

  const board = boardData?.data || [];
  const supplierRates = supplierData?.data || [];
  const currencies = board.map((b) => b.currency);
  const notSetCount = board.filter((b) => b.sendRate == null && b.buyRate == null && b.sellRate == null).length;

  const tabs = [
    { value: "board", label: "Rate board", icon: TrendingUp },
    ...(canEdit
      ? [
          { value: "supplier", label: "Supplier rates", icon: Truck },
          { value: "history", label: "History", icon: History },
        ]
      : []),
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Today's Rates"
        description="One rate for the whole company — used automatically in buy, sell and send"
        actions={
          canManageCurrencies && (
            <Link
              href="/currencies"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgb(16_24_40/0.05)] ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
            >
              <Settings2 className="h-4 w-4" />
              Manage currencies
            </Link>
          )
        }
      />

      {!canEdit && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-[13px] text-slate-600">
          <Lock className="h-4 w-4 shrink-0" />
          Rates are set by your admin. You can view them but not change them.
        </p>
      )}

      {canEdit && notSetCount > 0 && tab === "board" && !isBoardLoading && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-[13px] text-amber-800 ring-1 ring-inset ring-amber-600/20">
          {notSetCount} currenc{notSetCount > 1 ? "ies have" : "y has"} no rate yet. Cashiers cannot transact in a currency without a rate.
        </p>
      )}

      {tabs.length > 1 && (
        <div role="tablist" className="mb-5 flex gap-1 border-b border-slate-200">
          {tabs.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === value ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "board" &&
        (isBoardLoading ? (
          <PageLoader />
        ) : board.length === 0 ? (
          <EmptyState title="No active currencies" description="Add or activate currencies first." />
        ) : (
          <RateBoardEditor key={versionKey(board)} board={board} canEdit={canEdit} supplierRates={supplierRates} onReload={refetchBoard} />
        ))}

      {tab === "supplier" &&
        canEdit &&
        (isSupplierLoading || isBoardLoading ? (
          <PageLoader />
        ) : (
          <SupplierRatesEditor
            key={versionKey(supplierRates)}
            rates={supplierRates}
            vendors={(vendorData?.data?.data || []).filter((v) => v.status !== "inactive")}
            currencies={currencies}
            board={board}
            onReload={refetchSupplier}
          />
        ))}

      {tab === "history" && canEdit && <RateHistoryTable currencies={currencies} vendors={vendorData?.data?.data || []} />}
    </div>
  );
};

export default RatesPage;
