"use client";
import { useState } from "react";
import { Download, Loader2, History } from "lucide-react";
import { useGetAuditLogsQuery } from "@/redux/features/auditLog/auditLogApi";
import { useGetAllStaffQuery } from "@/redux/features/auth/authApi";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Pagination from "@/compoent/ui/Pagination";
import Select from "@/compoent/ui/Select";
import { EXPORT_AUDIT_LOG_CSV } from "@/utils/url";


const COLUMNS = [
  { key: "user", label: "Staff" },
  { key: "module", label: "Module" },
  { key: "action", label: "Action" },
  { key: "description", label: "Description" },
  { key: "date", label: "Date" },
];

const ACTION_VARIANT = {
  Create: "primary", Post: "success", Cancel: "danger", Reverse: "warning",
  UpdatePermissions: "primary", Approved: "success", Rejected: "danger",
};

const AuditLogPage = () => {
  const [page, setPage] = useState(1);
  const [userFilter, setUserFilter] = useState("");

  const { data, isLoading } = useGetAuditLogsQuery({ page, limit: 20, user: userFilter || undefined });
  const { data: staffData } = useGetAllStaffQuery({ limit: 100 });

  const logs = data?.data?.data || [];
  const pagination = data?.data?.pagination;
  const staff = staffData?.data?.data || [];

  const handleExportCsv = () => {
    const token = localStorage.getItem("accessToken");
    const params = new URLSearchParams();
    if (userFilter) params.append("user", userFilter);
    const url = `${EXPORT_AUDIT_LOG_CSV}?${params.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "staff-activity-report.csv";
        link.click();
      });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Audit Log</h1>
          <p className="mt-0.5 text-sm text-slate-600">Track all staff activity across the system</p>
        </div>
        <Button variant="secondary" onClick={handleExportCsv}>
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="mb-4 w-64">
        <Select
          id="userFilter"
          value={userFilter}
          onChange={(e) => {
            setUserFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All staff</option>
          {staff.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title="No activity yet" description="Staff actions will be recorded here" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{log.user?.name || "System"}</td>
                <td className="px-4 py-3 text-slate-700">{log.module}</td>
                <td className="px-4 py-3">
                  <Badge variant={ACTION_VARIANT[log.action] || "neutral"}>{log.action}</Badge>
                </td>
                <td className="px-4 py-3 text-slate-700">{log.description}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(log.createdAt).toLocaleDateString("en-GB")}{" "}
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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