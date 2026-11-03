"use client";
import { useState } from "react";
import { CheckSquare } from "lucide-react";
import { useGetAllApprovalRequestsQuery } from "@/redux/features/pos/approvalApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { useListFilters } from "@/hooks/useListFilters";
import { formatDateTime } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import ListToolbar from "@/compoent/ui/ListToolbar";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Pagination from "@/compoent/ui/Pagination";
import Avatar from "@/compoent/ui/Avatar";
import Button from "@/compoent/ui/Button";
import { PartyCell, StatusCell, TD } from "@/compoent/ui/TableCells";
import ReviewApprovalModal from "@/compoent/pos/ReviewApprovalModal";

const COLUMNS = [
  { key: "number", label: "Request No." },
  { key: "type", label: "Record" },
  { key: "reason", label: "Reason" },
  { key: "requestedBy", label: "Requested By" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const APPROVAL_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];

// Entity Type কে মানুষের পড়ার মতো নাম
const ENTITY_LABEL = {
  Send: "Send",
  BuyCurrency: "Buy Currency",
  SellCurrency: "Sell Currency",
  OtherIncome: "Other Income",
  PosExpense: "Expense",
};

const ApprovalsPage = () => {
  const filters = useListFilters();
  const { data, isLoading, isFetching, refetch } = useGetAllApprovalRequestsQuery({
    page: filters.params.page,
    limit: filters.params.limit,
    status: filters.params.status,
    search: filters.params.search,
  });

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "ApprovalRequest") refetch();
  });

  const requests = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const [reviewTarget, setReviewTarget] = useState(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Approvals" description="Cancellation requests raised by cashiers" />

      <ListToolbar
        statusOptions={APPROVAL_STATUS_OPTIONS}
        status={filters.status}
        onStatusChange={filters.setStatus}
        search={filters.search}
        onSearchChange={filters.setSearch}
        searchPlaceholder="Search request no. or reason…"
      />

      {isLoading ? (
        <PageLoader />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={filters.hasActiveFilters ? "No matching requests" : "No approval requests"}
          description={filters.hasActiveFilters ? "Try another status or search." : "Cancellation requests from cashiers will appear here."}
        />
      ) : (
        <>
          <Table columns={COLUMNS} className={isFetching ? "opacity-70 transition-opacity" : ""}>
            {requests.map((r) => (
              <tr key={r._id}>
                <td className={TD}>
                  <p className="font-mono text-[13px] font-semibold text-slate-900">{r.requestNumber}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(r.createdAt)}</p>
                </td>
                <PartyCell name={ENTITY_LABEL[r.entityType] || r.entityType} sub={r.actionRequested} />
                <td className={`${TD} max-w-xs`}>
                  <p className="line-clamp-2 text-slate-600" title={r.reason}>
                    {r.reason}
                  </p>
                </td>
                <td className={TD}>
                  <div className="flex items-center gap-2">
                    <Avatar name={r.requestedBy?.name} size="xs" />
                    <span className="text-slate-700">{r.requestedBy?.name}</span>
                  </div>
                </td>
                <StatusCell status={r.status} />
                <td className={`${TD} text-right`}>
                  {r.status === "Pending" && (
                    <Button size="xs" variant="soft" onClick={() => setReviewTarget(r)}>
                      Review
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={filters.setPage} />
        </>
      )}

      <ReviewApprovalModal isOpen={Boolean(reviewTarget)} onClose={() => setReviewTarget(null)} request={reviewTarget} />
    </div>
  );
};

export default ApprovalsPage;
