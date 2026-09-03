"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetAllApprovalRequestsQuery } from "@/redux/features/pos/approvalApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Pagination from "@/compoent/ui/Pagination";
import ReviewApprovalModal from "@/compoent/pos/ReviewApprovalModal";
import Button from "@/compoent/ui/Button";


const COLUMNS = [
  { key: "number", label: "Request No." },
  { key: "type", label: "Type" },
  { key: "reason", label: "Reason" },
  { key: "requestedBy", label: "Requested By" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const STATUS_VARIANT = { Pending: "warning", Approved: "success", Rejected: "danger" };

const ApprovalsPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetAllApprovalRequestsQuery({ page, limit: 10 });

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "ApprovalRequest") refetch();
  });

  const requests = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  const [reviewTarget, setReviewTarget] = useState(null);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Approval Requests</h1>
        <p className="mt-0.5 text-sm text-slate-600">Review cancellation requests from staff</p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState title="No approval requests" description="Cancellation requests from staff will appear here" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {requests.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.requestNumber}</td>
                <td className="px-4 py-3 text-slate-700">{r.entityType}</td>
                <td className="px-4 py-3 text-slate-700">{r.reason}</td>
                <td className="px-4 py-3 text-slate-700">{r.requestedBy?.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "Pending" && (
                    <Button size="sm" onClick={() => setReviewTarget(r)}>
                      Review
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <ReviewApprovalModal isOpen={Boolean(reviewTarget)} onClose={() => setReviewTarget(null)} request={reviewTarget} />
    </div>
  );
};

export default ApprovalsPage;