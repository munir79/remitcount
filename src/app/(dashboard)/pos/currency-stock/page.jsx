"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Coins, Layers, Package, PackagePlus, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCancelOpeningStockMutation, useGetAllCurrencyStocksQuery, useGetOpeningStocksQuery } from "@/redux/features/pos/currencyStockApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatDateTime, formatMoney, formatNumber, formatRate } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import StatCard from "@/compoent/ui/StatCard";
import Button from "@/compoent/ui/Button";
import Badge from "@/compoent/ui/Badge";
import EmptyState from "@/compoent/ui/EmptyState";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import Table from "@/compoent/ui/Table";
import { MoneyCell, STATUS_VARIANT, TD } from "@/compoent/ui/TableCells";
import OpeningStockModal from "@/compoent/pos/OpeningStockModal";

const COLUMNS = [
  { key: "code", label: "Currency" },
  { key: "stock", label: "Stock Qty", align: "right" },
  { key: "avgCost", label: "Avg. Cost (MYR)", align: "right" },
  { key: "value", label: "Stock Value (MYR)", align: "right" },
  { key: "share", label: "Share", align: "right" },
];
const OPENING_COLUMNS = [
  { key: "no", label: "No." },
  { key: "what", label: "Currency" },
  { key: "drawer", label: "Drawer" },
  { key: "cost", label: "Value (MYR)", align: "right" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

// Moving Average Cost দিয়ে Stock এর MYR মূল্য (Client PDF: "Stock list converted to MYR using cost rate")
const stockValue = (s) => Number(s.stockValue ?? Number(s.stockQty || 0) * Number(s.averageCost || 0));

/**
 * ✅ Foreign Currency Stock — দোকানের মোট, গড় খরচে মূল্য
 * Stock নিজে থেকে খোলে (প্রথম Buy / Opening Stock এ); চালুর দিন হাতে থাকা Currency — "Add opening stock"
 */
const CurrencyStockPage = () => {
  const { hasPermission } = useAuth();
  const canOpen = hasPermission("currencyStock:opening");
  const { data, isLoading, refetch } = useGetAllCurrencyStocksQuery({ limit: 100 });
  const { data: openingData, refetch: refetchOpening } = useGetOpeningStocksQuery({ limit: 50 });
  const [cancelOpening, { isLoading: isCancelling }] = useCancelOpeningStockMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  useSocketEvent("company-data-updated", (payload) => {
    if (["CurrencyStock", "BuyCurrency", "SellCurrency", "CashTransfer"].includes(payload?.module)) {
      refetch();
      refetchOpening();
    }
  });

  const stocks = data?.data?.data || [];
  const openings = openingData?.data?.data || [];
  const totalValue = stocks.reduce((sum, s) => sum + stockValue(s), 0);
  const inStockCount = stocks.filter((s) => Number(s.stockQty) > 0).length;

  const handleCancel = async () => {
    try {
      await cancelOpening({ id: cancelTarget._id, reason: "Cancelled from Currency Stock" }).unwrap();
      toast.success(`${cancelTarget.openingNumber} cancelled`);
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel");
    }
  };

  const openingButton = canOpen && (
    <Button onClick={() => setIsModalOpen(true)}>
      <PackagePlus className="h-4 w-4" />
      Add opening stock
    </Button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Currency Stock" description="Foreign currency on hand, valued at moving average cost" actions={openingButton} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total stock value" value={formatMoney(totalValue)} icon={Package} tone="indigo" hint="At average cost" isLoading={isLoading} />
        <StatCard label="Currencies traded" value={stocks.length} icon={Layers} tone="slate" isLoading={isLoading} />
        <StatCard label="Currencies in stock" value={inStockCount} icon={Coins} tone="emerald" isLoading={isLoading} />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : stocks.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="No foreign currency yet"
          description="Stock appears by itself when you buy currency. On your first day, add the currency you already hold as opening stock."
          action={openingButton}
        />
      ) : (
        <Table columns={COLUMNS}>
          {stocks.map((s) => {
            const value = stockValue(s);
            const share = totalValue > 0 ? (value / totalValue) * 100 : 0;
            return (
              <tr key={s._id}>
                <td className={TD}>
                  <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200">
                    {s.currencyCode}
                  </div>
                </td>
                <td className={`${TD} text-right font-medium tabular-nums text-slate-800`}>{formatNumber(s.stockQty)}</td>
                <td className={`${TD} text-right tabular-nums text-slate-600`}>{formatRate(s.averageCost)}</td>
                <MoneyCell value={value} strong />
                <td className={`${TD} text-right`}>
                  <div className="ml-auto flex w-28 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${share}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs tabular-nums text-slate-500">{Math.round(share)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {openings.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Opening stock</h2>
          <p className="mb-3 text-[13px] text-slate-500">Currency already on hand when the software started — recorded as the owner&apos;s opening stock.</p>
          <Table columns={OPENING_COLUMNS}>
            {openings.map((o) => (
              <tr key={o._id}>
                <td className={TD}>
                  <p className="font-mono text-[13px] font-semibold text-slate-900">{o.openingNumber}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(o.createdAt)}</p>
                </td>
                <td className={`${TD} tabular-nums text-slate-800`}>
                  {o.currencyCode} {formatNumber(o.qty)}
                </td>
                <td className={`${TD} text-slate-700`}>{o.drawerAccount?.name || "—"}</td>
                <MoneyCell value={o.costMYR} />
                <td className={TD}>
                  <Badge variant={STATUS_VARIANT[o.status] || "neutral"}>{o.status}</Badge>
                </td>
                <td className={`${TD} text-right`}>
                  {canOpen && o.status === "Posted" && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(o)}
                      title="Cancel"
                      aria-label={`Cancel ${o.openingNumber}`}
                      className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </section>
      )}

      <OpeningStockModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        confirmLabel="Cancel opening stock"
        title={`Cancel ${cancelTarget?.openingNumber || ""}`}
        description={`Remove ${cancelTarget?.currencyCode} ${formatNumber(cancelTarget?.qty)} from ${cancelTarget?.drawerAccount?.name}? Only possible while those notes are still in that drawer.`}
      />
    </div>
  );
};

export default CurrencyStockPage;
