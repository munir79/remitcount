"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, XCircle, Loader2 } from "lucide-react";
import { useCancelPosExpenseMutation, useGetAllPosExpensesQuery, usePostPosExpenseMutation } from "@/redux/features/pos/posExpenseApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import PosExpenseFormModal from "@/compoent/pos/PosExpenseFormModal";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import Pagination from "@/compoent/ui/Pagination";
import RequestCancelModal from "@/compoent/pos/RequestCancelModal";

// import RequestCancelModal from "@/compoent/pos/RequestCancelModal";

const COLUMNS = [
  { key: "number", label: "No." },
  { key: "type", label: "Type" },
  { key: "classification", label: "Classification" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const STATUS_VARIANT = { Draft: "warning", Posted: "success", Cancelled: "neutral" };

const PosExpenseListPage = () => {
  const [page, setPage] = useState(1);
  const { hasPermission } = useAuth();
  const { data, isLoading, refetch } = useGetAllPosExpensesQuery({ page, limit: 10 });
  const [postPosExpense, { isLoading: isPosting }] = usePostPosExpenseMutation();
  const [cancelPosExpense, { isLoading: isCancelling }] = useCancelPosExpenseMutation();

  const records = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "PosExpense") refetch();
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [requestCancelTarget, setRequestCancelTarget] = useState(null);

  const handlePost = async () => {
    try {
      await postPosExpense(postTarget._id).unwrap();
      toast.success("Posted successfully");
      setPostTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelPosExpense({ id: cancelTarget._id, reason: "Cancelled by user" }).unwrap();
      toast.success("Cancelled successfully");
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel");
    }
  };

  const handleCancelClick = (record) => {
    if (hasPermission("posExpense:delete")) {
      setCancelTarget(record);
    } else {
      setRequestCancelTarget(record);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Expenses</h1>
          <p className="mt-0.5 text-sm text-slate-600">Day-to-day operating expenses</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New Expense
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState title="No expense records yet" description="Add your first expense" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {records.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.expenseNumber}</td>
                <td className="px-4 py-3 text-slate-700">{r.expenseType}</td>
                <td className="px-4 py-3">
                  <Badge variant={r.classification === "Admin" ? "primary" : "neutral"}>{r.classification}</Badge>
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {Number(r.amount).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {r.status === "Draft" && (
                      <Button size="sm" onClick={() => setPostTarget(r)}>
                        <Send className="h-3.5 w-3.5" />
                        Post
                      </Button>
                    )}
                    {r.status !== "Cancelled" && (
                      <Button size="sm" variant="ghost" onClick={() => handleCancelClick(r)}>
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <PosExpenseFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        isLoading={isPosting}
        variant="primary"
        title="Post Expense"
        description={`Post ${postTarget?.expenseNumber}?`}
      />
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title="Cancel Expense"
        description={`Cancel ${cancelTarget?.expenseNumber}?`}
      />
      <RequestCancelModal
        isOpen={Boolean(requestCancelTarget)}
        onClose={() => setRequestCancelTarget(null)}
        entityType="PosExpense"
        entityId={requestCancelTarget?._id}
        entityLabel={requestCancelTarget?.expenseNumber}
      />
    </div>
  );
};

export default PosExpenseListPage;
