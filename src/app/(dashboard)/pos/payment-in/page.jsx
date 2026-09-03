"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, Loader2 } from "lucide-react";
import { useGetAllPaymentInQuery, usePostPaymentInMutation } from "@/redux/features/pos/paymentInApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Pagination from "@/compoent/ui/Pagination";
import PaymentInFormModal from "@/compoent/pos/PaymentInFormModal";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";


const COLUMNS = [
  { key: "number", label: "Payment No." },
  { key: "type", label: "Against" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const STATUS_VARIANT = { Draft: "warning", Posted: "success" };

const PaymentInListPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetAllPaymentInQuery({ page, limit: 10 });
  const [postPaymentIn, { isLoading: isPosting }] = usePostPaymentInMutation();

  const records = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "PaymentIn") refetch();
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [postTarget, setPostTarget] = useState(null);

  const handlePost = async () => {
    try {
      await postPaymentIn(postTarget._id).unwrap();
      toast.success("Payment In posted successfully");
      setPostTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to post");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Payment In</h1>
          <p className="mt-0.5 text-sm text-slate-600">Receivable settlements</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4" />
          New Payment In
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : records.length === 0 ? (
        <EmptyState title="No payment records yet" description="Record your first receivable settlement" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {records.map((r) => (
              <tr key={r._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.paymentNumber}</td>
                <td className="px-4 py-3 text-slate-700">{r.entityType}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">৳ {Number(r.amount).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "Draft" && (
                    <Button size="sm" onClick={() => setPostTarget(r)}>
                      <Send className="h-3.5 w-3.5" />
                      Post
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <PaymentInFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ConfirmDialog
        isOpen={Boolean(postTarget)}
        onClose={() => setPostTarget(null)}
        onConfirm={handlePost}
        isLoading={isPosting}
        variant="primary"
        title="Post Payment In"
        description={`Post ${postTarget?.paymentNumber}? This will settle the due balance.`}
      />
    </div>
  );
};

export default PaymentInListPage;