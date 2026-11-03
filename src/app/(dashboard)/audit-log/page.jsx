"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Download, History } from "lucide-react";
import { useGetAuditLogsQuery } from "@/redux/features/auditLog/auditLogApi";
import { useGetAllStaffQuery } from "@/redux/features/auth/authApi";
import { EXPORT_AUDIT_LOG_CSV } from "@/utils/url";
import { formatDateTime } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Button from "@/compoent/ui/Button";
import Avatar from "@/compoent/ui/Avatar";
import Pagination from "@/compoent/ui/Pagination";
import Select from "@/compoent/ui/Select";
import { TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "when", label: "When" },
  { key: "user", label: "Staff" },
  { key: "action", label: "Action" },
  { key: "description", label: "Details" },
];

const ACTION_VARIANT = {
  Create: "primary",
  Update: "info",
  Post: "success",
  Approved: "success",
  Cancel: "danger",
  Rejected: "danger",
  Delete: "danger",
  Reverse: "warning",
  UpdatePermissions: "primary",
};

const MODULES = ["BuyCurrency", "SellCurrency", "Send", "OtherIncome", "PosExpense", "PaymentIn", "PaymentOut", "Journal", "CashierSession", "Staff", "Role", "Customer", "Vendor"];
const humanize = (key = "") => key.replace(/([a-z])([A-Z])/g, "$1 $2");

const AuditLogPage = () => {
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, isFetching } = useGetAuditLogsQuery({ page, limit: 20, user: userFilter || undefined, module: moduleFilter || undefined });
  const { data: staffData } = useGetAllStaffQuery({ limit: 100 });

  const logs = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const staff = staffData?.data?.data || [];
  const hasFilters = Boolean(userFilter || moduleFilter);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (userFilter) params.append("user", userFilter);
      if (moduleFilter) params.append("module", moduleFilter);
      const res = await fetch(`${EXPORT_AUDIT_LOG_CSV}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const url = window.URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "staff-activity-report.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not export the activity log.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Audit Log"
        description="Every create, post, cancel and approval — who did it and when"
        actions={
          <Button variant="secondary" onClick={handleExportCsv} isLoading={isExporting}>
            {!isExporting && <Download className="h-4 w-4" />}
            Export CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Select
          id="userFilter"
          aria-label="Staff"
          value={userFilter}
          onChange={(e) => {
            setUserFilter(e.target.value);
            setPage(1);
          }}
          className="sm:w-56"
        >
          <option value="">All staff</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select
          id="moduleFilter"
          aria-label="Area"
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setPage(1);
          }}
          className="sm:w-56"
        >
          <option value="">All areas</option>
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {humanize(m)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title={hasFilters ? "No matching activity" : "No activity yet"} description={hasFilters ? "Try another staff member or area." : "Staff actions will be recorded here."} />
      ) : (
        <>
          <Table columns={COLUMNS} className={isFetching ? "opacity-70 transition-opacity" : ""}>
            {logs.map((log) => (
              <tr key={log._id}>
                <td className={`${TD} whitespace-nowrap text-[13px] text-slate-500`}>{formatDateTime(log.createdAt)}</td>
                <td className={TD}>
                  <div className="flex items-center gap-2">
                    <Avatar name={log.user?.name || "System"} size="xs" />
                    <span className="font-medium text-slate-800">{log.user?.name || "System"}</span>
                  </div>
                </td>
                <td className={TD}>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={ACTION_VARIANT[log.action] || "neutral"}>{humanize(log.action)}</Badge>
                    <span className="text-xs text-slate-500">{humanize(log.module)}</span>
                  </div>
                </td>
                <td className={`${TD} max-w-xl text-slate-700`}>
                  <p className="line-clamp-2">{log.description}</p>
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

export default AuditLogPage;
