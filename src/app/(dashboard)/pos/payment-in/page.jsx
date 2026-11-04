"use client";
import Link from "next/link";
import { HandCoins, ReceiptText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCancelPaymentInMutation, useGetAllPaymentInQuery, usePostPaymentInMutation } from "@/redux/features/pos/paymentInApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import PaymentInFormModal from "@/compoent/pos/PaymentInFormModal";
import { DocCell, MoneyCell, PartyCell, TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "number", label: "Payment No." },
  { key: "party", label: "Received from" },
  { key: "account", label: "Received into" },
  { key: "amount", label: "Amount", align: "right" },
];

/** কোন বিলগুলোতে গেল — পুরনো Record এ শুধু ধরন */
const againstText = (r) => (r.allocations || []).map((a) => a.number || a.label).join(", ") || r.entityType;

const PaymentInListPage = () => {
  const { hasPermission } = useAuth();
  return (
    <DocumentListPage
      title="Payment In"
      description="Money received from customers against what they owe"
      newLabel="New Payment In"
      icon={HandCoins}
      emptyTitle="No payments received yet"
      emptyDescription="Record money received from a customer — by name, or against one transaction."
      searchPlaceholder="No., name, bill no…"
      useListQuery={useGetAllPaymentInQuery}
      usePostMutation={usePostPaymentInMutation}
      useCancelMutation={useCancelPaymentInMutation}
      socketModule="PaymentIn"
      entityType="PaymentIn"
      numberField="paymentNumber"
      cancelPermission="paymentIn:delete"
      canCancelRecord={(r) => r.status !== "Cancelled"}
      canPostRecord={() => hasPermission("paymentIn:approve")}
      postDescription="This will settle the customer's due balance."
      FormModal={PaymentInFormModal}
      manualApply
      renderExtraActions={(r) =>
        r.status !== "Draft" && (
          <Link
            href={`/pos/payment-in/${r._id}/receipt`}
            title="View receipt"
            aria-label={`Receipt for ${r.paymentNumber}`}
            className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
          >
            <ReceiptText className="h-4 w-4" />
            Receipt
          </Link>
        )
      }
      columns={COLUMNS}
      renderCells={(r) => (
        <>
          <DocCell number={r.paymentNumber} date={r.date} />
          <PartyCell name={r.partyName || "Walk-in"} sub={againstText(r)} />
          <td className={`${TD} text-slate-600`}>{r.depositAccount?.name || "—"}</td>
          <MoneyCell value={r.amount} strong />
        </>
      )}
    />
  );
};

export default PaymentInListPage;
