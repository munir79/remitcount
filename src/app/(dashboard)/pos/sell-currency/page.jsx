"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCancelSellCurrencyMutation, useGetAllSellCurrencyQuery, usePostSellCurrencyMutation } from "@/redux/features/pos/sellCurrencyApi";
import { useSocketEvent } from "@/socket/useSocketEvent";

import Button from "@/compoent/ui/Button";
import BranchSelector from "@/compoent/ui/BranchSelector";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Pagination from "@/compoent/ui/Pagination";
import SellCurrencyFormModal from "@/compoent/pos/SellCurrencyFormModal";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import RequestCancelModal from "@/compoent/pos/RequestCancelModal";


const COLUMNS = [
  { key: "number", label: "Sell No." },
  { key: "customer", label: "Customer" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "total", label: "Total (MYR)" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const STATUS_VARIANT = { Draft: "warning", Posted: "success", Cancelled: "neutral" };

const SellCurrencyListPage = () => {
  const [page, setPage] = useState(1);
  const [branch, setBranch] = useState("");
  const { hasPermission } = useAuth();

  const canFilterByBranch = hasPermission("cashierSession:manage");

  const { data, isLoading, refetch } = useGetAllSellCurrencyQuery({ page, limit: 10, branch: branch || undefined });
  const [postSellCurrency, { isLoading: isPosting }] = usePostSellCurrencyMutation();
  const [cancelSellCurrency, { isLoading: isCancelling }] = useCancelSellCurrencyMutation();

  const records = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "SellCurrency") refetch();
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [requestCancelTarget, setRequestCancelTarget] = useState(null);

  const handlePost = async () => {
    try {
      await postSellCurrency(postTarget._id).unwrap();
      toast.success("Sell Currency posted successfully");
      setPostTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSellCurrency({ id: cancelTarget._id, reason: "Cancelled by user" }).unwrap();
      toast.success("Sell Currency cancelled successfully");
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel");
    }
  };

  const handleCancelClick = (record) => {
    if (hasPermission("currencyStock:delete")) {
      setCancelTarget(record);
    } else {
      setRequestCancelTarget(record);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Sell Currency</h1>
          <p className="mt-0.5 text-sm text-slate-600">Sell foreign currency to customers</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New Sell
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
        <EmptyState title="No sell records yet" description="Create your first currency sale" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {records.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.sellNumber}</td>
                <td className="px-4 py-3 text-slate-700">{r.customer?.name}</td>
                <td className="px-4 py-3 text-slate-700">{r.currencyStock?.currencyCode}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(r.foreignAmount).toFixed(2)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                  ৳ {Number(r.totalAmountMYR).toFixed(2)}
                </td>
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

      <SellCurrencyFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        isLoading={isPosting}
        variant="primary"
        title="Post Sell Currency"
        description={`Post ${postTarget?.sellNumber}? This will update stock and account balances.`}
      />
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title="Cancel Sell Currency"
        description={`Cancel ${cancelTarget?.sellNumber}?`}
      />
      <RequestCancelModal
        isOpen={Boolean(requestCancelTarget)}
        onClose={() => setRequestCancelTarget(null)}
        entityType="SellCurrency"
        entityId={requestCancelTarget?._id}
        entityLabel={requestCancelTarget?.sellNumber}
      />
    </div>
  );
};

export default SellCurrencyListPage;