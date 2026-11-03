"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";

import { useListFilters } from "@/hooks/useListFilters";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatMoney } from "@/lib/format";
import PageHeader from "../ui/PageHeader";
import ListToolbar from "../ui/ListToolbar";
import PageLoader from "../ui/PageLoader";
import EmptyState from "../ui/EmptyState";
import Table from "../ui/Table";
import Button from "../ui/Button";
import Pagination from "../ui/Pagination";
import Avatar from "../ui/Avatar";
import StatCard from "../ui/StatCard";
import WhatsAppButton from "../ui/WhatsAppButton";
import Badge from "../ui/Badge";
import { MoneyCell, TD } from "../ui/TableCells";
import PartyStatementModal from "./PartyStatementModal";

// To collect / To pay এ Customer আর Supplier দুজনেই থাকতে পারেন
const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "Customer", label: "Customers" },
  { value: "Vendor", label: "Suppliers" },
];
// Balance বদলায় এমন সব লেনদেন — এলে তালিকা আবার আনা
const BALANCE_MODULES = ["Customer", "Vendor", "Send", "BuyCurrency", "SellCurrency", "PaymentIn", "PaymentOut", "OtherIncome"];

/**
 * ✅ Debtors ও Creditors Page একই রকম — শুধু Data Source, রং আর লেখা আলাদা
 * Server Balance এর দিক দেখে তালিকা দেয় (Customer কে দেনা → To pay, Supplier এর কাছে পাওনা → To collect)
 * প্রতিটা লাইনে "Statement" — সব লেনদেন, Trx No., বিবরণ, চলমান Balance
 */
const PartyBalancePage = ({
  title,
  description,
  icon,
  tone, // "sky" (Debtors) | "amber" (Creditors)
  balanceLabel,
  totalLabel,
  totalField,
  emptyTitle,
  emptyDescription,
  useReportQuery,
  exportUrl,
  exportFileName,
  buildReminder, // (party) => WhatsApp message
}) => {
  const filters = useListFilters();
  const [isExporting, setIsExporting] = useState(false);
  const [statementParty, setStatementParty] = useState(null);

  const { data, isLoading, isFetching, refetch } = useReportQuery({
    page: filters.params.page,
    limit: filters.params.limit,
    search: filters.params.search,
    ...(filters.status ? { type: filters.status } : {}),
  });

  useSocketEvent("company-data-updated", (payload) => {
    if (BALANCE_MODULES.includes(payload?.module)) refetch();
  });

  const parties = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const total = data?.data?.[totalField] || 0;

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(exportUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Export failed");
      const url = window.URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not export the report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "balance", label: balanceLabel, align: "right" },
    { key: "actions", label: "" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button variant="secondary" onClick={handleExportCsv} isLoading={isExporting}>
            {!isExporting && <Download className="h-4 w-4" />}
            Export CSV
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={totalLabel} value={formatMoney(total)} icon={icon} tone={tone} isLoading={isLoading} />
        <StatCard label="Accounts with balance" value={pagination?.total ?? 0} icon={icon} tone="slate" isLoading={isLoading} />
      </div>

      <ListToolbar
        statusOptions={TYPE_OPTIONS}
        status={filters.status}
        onStatusChange={filters.setStatus}
        search={filters.search}
        onSearchChange={filters.setSearch}
        searchPlaceholder="Search name or phone…"
      />

      {isLoading ? (
        <PageLoader />
      ) : parties.length === 0 ? (
        <EmptyState
          icon={icon}
          title={filters.hasActiveFilters ? "No matching accounts" : emptyTitle}
          description={filters.hasActiveFilters ? "Try a different name or phone number." : emptyDescription}
        />
      ) : (
        <>
          <Table columns={columns} className={isFetching ? "opacity-70 transition-opacity" : ""}>
            {parties.map((p) => (
              <tr key={p._id}>
                <td className={TD}>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate font-medium text-slate-900">
                        {p.name}
                        <Badge variant={p.partyType === "Vendor" ? "warning" : "primary"} dot={false}>
                          {p.partyType === "Vendor" ? "Supplier" : "Customer"}
                        </Badge>
                        {p.status === "inactive" && (
                          <Badge variant="neutral" dot={false}>
                            Inactive
                          </Badge>
                        )}
                      </p>
                      {p.email && <p className="truncate text-xs text-slate-500">{p.email}</p>}
                    </div>
                  </div>
                </td>
                <td className={`${TD} tabular-nums text-slate-600`}>{p.phone || "—"}</td>
                <MoneyCell value={p.amount} strong />
                <td className={`${TD} text-right`}>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setStatementParty(p)} aria-label={`Statement for ${p.name}`}>
                      <FileText className="h-4 w-4" />
                      Statement
                    </Button>
                    <WhatsAppButton phone={p.phone} message={buildReminder(p)} label="Remind" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={filters.setPage} limit={filters.limit} onLimitChange={filters.setLimit} />
        </>
      )}

      <PartyStatementModal key={statementParty?._id || "none"} party={statementParty} onClose={() => setStatementParty(null)} />
    </div>
  );
};

export default PartyBalancePage;
