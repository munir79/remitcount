"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useGetCreditorsReportQuery } from "@/redux/features/report/reportApi";
import { EXPORT_CREDITORS_CSV } from "@/utils/url";
import Button from "@/compoent/ui/Button";
import SearchInput from "@/compoent/ui/SearchInput";
import { useSocketEvent } from "@/socket/useSocketEvent";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Avatar from "@/compoent/ui/Avatar";
import WhatsAppButton from "@/compoent/ui/WhatsAppButton";
import Pagination from "@/compoent/ui/Pagination";


const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "balance", label: "Balance Payable" },
  { key: "actions", label: "" },
];

const CreditorsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useGetCreditorsReportQuery({ page, limit: 10, search: search || undefined });

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Vendor") refetch();
  });

  const creditors = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const totalCreditors = data?.data?.totalCreditors || 0;

  const handleExportCsv = () => {
    const token = localStorage.getItem("accessToken");
    fetch(EXPORT_CREDITORS_CSV, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "creditors-report.csv";
        link.click();
      });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Creditors</h1>
          <p className="mt-0.5 text-sm text-slate-600">Suppliers you owe money to</p>
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
        <div className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
          Total: ৳ {Number(totalCreditors).toFixed(2)}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : creditors.length === 0 ? (
        <EmptyState title="No creditors" description="Your business currently owes no suppliers money" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {creditors.map((v) => (
              <tr key={v._id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={v.name} />
                    <span className="font-semibold text-slate-900">{v.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{v.phone || "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-indigo-700">৳ {Number(v.currentBalance).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <WhatsAppButton
                    phone={v.phone}
                    message={`Hi ${v.name}, we would like to confirm that we currently owe ৳${Number(v.currentBalance).toFixed(2)} to your account. We will settle this shortly. Thank you for your partnership!`}
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

export default CreditorsPage;