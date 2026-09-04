"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useGetDebtorsReportQuery } from "@/redux/features/report/reportApi";
import { EXPORT_DEBTORS_CSV } from "@/utils/url";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "@/compoent/ui/Button";
import SearchInput from "@/compoent/ui/SearchInput";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Avatar from "@/compoent/ui/Avatar";
import WhatsAppButton from "@/compoent/ui/WhatsAppButton";
import Pagination from "@/compoent/ui/Pagination";


const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "balance", label: "Balance Owed" },
  { key: "actions", label: "" },
];

const DebtorsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useGetDebtorsReportQuery({ page, limit: 10, search: search || undefined });

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Customer") refetch();
  });

  const debtors = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const totalDebtors = data?.data?.totalDebtors || 0;

  const handleExportCsv = () => {
    const token = localStorage.getItem("accessToken");
    fetch(EXPORT_DEBTORS_CSV, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "debtors-report.csv";
        link.click();
      });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Debtors</h1>
          <p className="mt-0.5 text-sm text-slate-600">Customers who owe you money</p>
        </div>
        <Button variant="secondary" onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or phone..."
        />
        <div className="rounded-lg bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700">
          Total: ৳ {Number(totalDebtors).toFixed(2)}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : debtors.length === 0 ? (
        <EmptyState title="No debtors" description="No customers currently owe your business money" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {debtors.map((c) => (
              <tr key={c._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <span className="font-semibold text-slate-900">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-rose-600">৳ {Number(c.currentBalance).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <WhatsAppButton
                    phone={c.phone}
                    message={`Hi ${c.name}, this is a friendly reminder that you have an outstanding balance of ৳${Number(c.currentBalance).toFixed(2)} with us. Please arrange payment at your earliest convenience. Thank you!`}
                  />
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default DebtorsPage;