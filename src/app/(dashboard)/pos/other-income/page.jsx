"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCancelOtherIncomeMutation, useGetAllOtherIncomesQuery, usePostOtherIncomeMutation } from "@/redux/features/pos/otherIncomeApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "@/compoent/ui/Button";
import BranchSelector from "@/compoent/ui/BranchSelector";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Pagination from "@/compoent/ui/Pagination";
import OtherIncomeFormModal from "@/compoent/pos/OtherIncomeFormModal";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import RequestCancelModal from "@/compoent/pos/RequestCancelModal";


const COLUMNS = [
  { key: "number", label: "No." },
  { key: "type", label: "Type" },
  { key: "sell", label: "Sell Amount" },
  { key: "profit", label: "Profit" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const STATUS_VARIANT = { Draft: "warning", Posted: "success", Cancelled: "neutral" };

const OtherIncomeListPage = () => {
  const [page, setPage] = useState(1);
  const [branch, setBranch] = useState("");
  const { hasPermission } = useAuth();

  const canFilterByBranch = hasPermission("cashierSession:manage");

  const { data, isLoading, refetch } = useGetAllOtherIncomesQuery({ page, limit: 10, branch: branch || undefined });
  const [postOtherIncome, { isLoading: isPosting }] = usePostOtherIncomeMutation();
  const [cancelOtherIncome, { isLoading: isCancelling }] = useCancelOtherIncomeMutation();

  const records = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "OtherIncome") refetch();
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [requestCancelTarget, setRequestCancelTarget] = useState(null);

  const handlePost = async () => {
    try {
      await postOtherIncome(postTarget._id).unwrap();
      toast.success("Posted successfully");
      setPostTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelOtherIncome({ id: cancelTarget._id, reason: "Cancelled by user" }).unwrap();
      toast.success("Cancelled successfully");
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel");
    }
  };

  const handleCancelClick = (record) => {
    if (hasPermission("otherIncome:delete")) {
      setCancelTarget(record);
    } else {
      setRequestCancelTarget(record);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Other Income</h1>
          <p className="mt-0.5 text-sm text-slate-600">Miscellaneous income transactions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New Income
        </Button>
      </div>

      {canFilterByBranch && (
        <div className="mb-4 w-56">
          <BranchSelector
            branch={branch}
            onBranchChange={(val) => {
              setBranch(val);
              setPage(1);
            }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState title="No income records yet" description="Add your first other income transaction" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {records.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.incomeNumber}</td>
                <td className="px-4 py-3 text-slate-700">{r.incomeType}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">৳ {Number(r.sellAmount).toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {Number(r.profitAmount).toFixed(2)}</td>
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
                    {r.status !== "Cancelled" && r.paidAmount === 0 && (
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

      <OtherIncomeFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        isLoading={isPosting}
        variant="primary"
        title="Post Other Income"
        description={`Post ${postTarget?.incomeNumber}?`}
      />
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title="Cancel Other Income"
        description={`Cancel ${cancelTarget?.incomeNumber}?`}
      />
      <RequestCancelModal
        isOpen={Boolean(requestCancelTarget)}
        onClose={() => setRequestCancelTarget(null)}
        entityType="OtherIncome"
        entityId={requestCancelTarget?._id}
        entityLabel={requestCancelTarget?.incomeNumber}
      />
    </div>
  );
};

export default OtherIncomeListPage;