"use client";
import { useState } from "react";
import { Plus, Coins, Loader2 } from "lucide-react";
import { useGetAllCurrencyStocksQuery } from "@/redux/features/pos/currencyStockApi";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import CurrencyStockFormModal from "@/compoent/pos/CurrencyStockFormModal";
import { useSocketEvent } from "@/socket/useSocketEvent";


const COLUMNS = [
  { key: "code", label: "Currency" },
  { key: "stock", label: "Stock Qty" },
  { key: "avgCost", label: "Avg. Cost (MYR)" },
  { key: "value", label: "Stock Value (MYR)" },
];

const CurrencyStockPage = () => {
  const { data, isLoading, refetch } = useGetAllCurrencyStocksQuery({ limit: 100 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "CurrencyStock") refetch();
  });

  const stocks = data?.data?.data || [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Currency Stock</h1>
          <p className="mt-0.5 text-sm text-slate-600">Registered foreign currencies and their stock levels</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Register Currency
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : stocks.length === 0 ? (
        <EmptyState icon={Coins} title="No currencies registered" description="Register your first currency to start Buy/Sell" />
      ) : (
        <Table columns={COLUMNS}>
          {stocks.map((s) => (
            <tr key={s._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{s.currencyCode}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(s.stockQty).toFixed(2)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">৳ {Number(s.averageCost).toFixed(4)}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                ৳ {(Number(s.stockQty) * Number(s.averageCost)).toFixed(2)}
              </td>
            </tr>
          ))}
        </Table>
      )}

      <CurrencyStockFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default CurrencyStockPage;