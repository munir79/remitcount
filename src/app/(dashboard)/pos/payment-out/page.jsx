"use client";
import { Wallet } from "lucide-react";
import { useGetAllPaymentOutQuery, usePostPaymentOutMutation } from "@/redux/features/pos/paymentOutApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import PaymentOutFormModal from "@/compoent/pos/PaymentOutFormModal";
import { DocCell, MoneyCell, PartyCell, TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "number", label: "Payment No." },
  { key: "against", label: "Against" },
  { key: "account", label: "Paid From" },
  { key: "amount", label: "Amount", align: "right" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Posted", label: "Posted" },
];

const PaymentOutListPage = () => (
  <DocumentListPage
    title="Payment Out"
    description="Money paid to creditors and suppliers against their dues"
    newLabel="New Payment Out"
    icon={Wallet}
    emptyTitle="No payments made yet"
    emptyDescription="Record money paid to a supplier or creditor."
    searchPlaceholder="Search payment no…"
    useListQuery={useGetAllPaymentOutQuery}
    usePostMutation={usePostPaymentOutMutation}
    socketModule="PaymentOut"
    numberField="paymentNumber"
    statusOptions={PAYMENT_STATUS_OPTIONS}
    supportsPeriod={false}
    postDescription="This will settle the due balance."
    FormModal={PaymentOutFormModal}
    columns={COLUMNS}
    renderCells={(r) => (
      <>
        <DocCell number={r.paymentNumber} date={r.date} />
        <PartyCell name={r.entityType} sub={r.payableAccount?.name} />
        <td className={`${TD} text-slate-600`}>{r.paymentAccount?.name || "—"}</td>
        <MoneyCell value={r.amount} strong />
      </>
    )}
  />
);

export default PaymentOutListPage;
