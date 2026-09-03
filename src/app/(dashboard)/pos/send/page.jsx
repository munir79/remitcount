"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send as SendIcon, XCircle, Loader2 } from "lucide-react";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { useCancelSendMutation, useGetAllSendsQuery, usePostSendMutation } from "@/redux/features/pos/sendApi";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Pagination from "@/compoent/ui/Pagination";
import SendFormModal from "@/compoent/pos/SendFormModal";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";


const COLUMNS = [
  { key: "number", label: "Send No." },
  { key: "customer", label: "Customer" },
  { key: "supplier", label: "Supplier" },
  { key: "amount", label: "Foreign Amount" },
  { key: "profit", label: "Profit" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const STATUS_VARIANT = { Draft: "warning", Posted: "success", Cancelled: "neutral" };

const SendListPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetAllSendsQuery({ page, limit: 10 });
  const [postSend, { isLoading: isPosting }] = usePostSendMutation();
  const [cancelSend, { isLoading: isCancelling }] = useCancelSendMutation();

  const sends = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Send") refetch();
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const handlePost = async () => {
    try {
      await postSend(postTarget._id).unwrap();
      toast.success("Send posted successfully");
      setPostTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post send");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelSend({ id: cancelTarget._id, reason: "Cancelled by user" }).unwrap();
      toast.success("Send cancelled successfully");
      setCancelTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel send");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Send (Remittance)</h1>
          <p className="mt-0.5 text-sm text-slate-600">International money transfer records</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New Send
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : sends.length === 0 ? (
        <EmptyState title="No send records yet" description="Create your first remittance transaction" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {sends.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{s.sendNumber}</td>
                <td className="px-4 py-3 text-slate-700">{s.customer?.name}</td>
                <td className="px-4 py-3 text-slate-700">{s.supplier?.name}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {s.currencyCode} {Number(s.foreignAmount).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {Number(s.profitAmount).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {s.status === "Draft" && (
                      <Button size="sm" onClick={() => setPostTarget(s)}>
                        <SendIcon className="h-3.5 w-3.5" />
                        Post
                      </Button>
                    )}
                    {s.status !== "Cancelled" && s.customerPaidAmount === 0 && s.supplierPaidAmount === 0 && (
                      <Button size="sm" variant="ghost" onClick={() => setCancelTarget(s)}>
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

      <SendFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        isLoading={isPosting}
        variant="primary"
        title="Post Send"
        description={`Post ${postTarget?.sendNumber}? This will update account balances and stock.`}
      />
      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        title="Cancel Send"
        description={`Cancel ${cancelTarget?.sendNumber}? This will reverse any posted journal entries.`}
      />
    </div>
  );
};

export default SendListPage;