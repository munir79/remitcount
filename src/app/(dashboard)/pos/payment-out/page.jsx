"use client";
import Link from "next/link";
import { ReceiptText, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCancelPaymentOutMutation, useGetAllPaymentOutQuery, usePostPaymentOutMutation } from "@/redux/features/pos/paymentOutApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import PaymentOutFormModal from "@/compoent/pos/PaymentOutFormModal";
import { DocCell, MoneyCell, PartyCell, TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "number", label: "Payment No." },
  { key: "party", label: "Paid to" },
  { key: "account", label: "Paid from" },
  { key: "amount", label: "Amount", align: "right" },
];

/** কোন দেনাগুলোতে গেল — পুরনো Record এ শুধু ধরন */
const againstText = (r) => (r.allocations || []).map((a) => a.number || a.label).join(", ") || r.entityType;

const PaymentOutListPage = () => {
  const { hasPermission } = useAuth();
  return (
    <DocumentListPage
      title="Payment Out"
      description="Money paid to suppliers and customers against what we owe"
      newLabel="New Payment Out"
      icon={Wallet}
      emptyTitle="No payments made yet"
      emptyDescription="Record money paid — by name, or against one transaction."
      searchPlaceholder="No., name, bill no…"
      useListQuery={useGetAllPaymentOutQuery}
      usePostMutation={usePostPaymentOutMutation}
      useCancelMutation={useCancelPaymentOutMutation}
      socketModule="PaymentOut"
      entityType="PaymentOut"
      numberField="paymentNumber"
      cancelPermission="paymentOut:delete"
      canCancelRecord={(r) => r.status !== "Cancelled"}
      canPostRecord={() => hasPermission("paymentOut:approve")}
      postDescription="This will settle the due balance."
      FormModal={PaymentOutFormModal}
      manualApply
      renderExtraActions={(r) =>
        r.status !== "Draft" && (
          <Link
            href={`/pos/payment-out/${r._id}/receipt`}
            title="View voucher"
            aria-label={`Voucher for ${r.paymentNumber}`}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            <ReceiptText className="h-4 w-4" />
            Voucher
          </Link>
        )
      }
      columns={COLUMNS}
      renderCells={(r) => (
        <>
          <DocCell number={r.paymentNumber} date={r.date} />
          <PartyCell name={r.partyName || "—"} sub={againstText(r)} />
          <td className={`${TD} text-slate-600`}>{r.paymentAccount?.name || "—"}</td>
          <MoneyCell value={r.amount} strong />
        </>
      )}
    />
  );
};

export default PaymentOutListPage;
