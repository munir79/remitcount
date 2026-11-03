"use client";
import { HandCoins } from "lucide-react";
import { useGetAllPaymentInQuery, usePostPaymentInMutation } from "@/redux/features/pos/paymentInApi";
import DocumentListPage from "@/compoent/pos/DocumentListPage";
import PaymentInFormModal from "@/compoent/pos/PaymentInFormModal";
import { DocCell, MoneyCell, PartyCell, TD } from "@/compoent/ui/TableCells";

const COLUMNS = [
  { key: "number", label: "Payment No." },
  { key: "against", label: "Against" },
  { key: "account", label: "Received Into" },
  { key: "amount", label: "Amount", align: "right" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Posted", label: "Posted" },
];

const PaymentInListPage = () => (
  <DocumentListPage
    title="Payment In"
    description="Money received from debtors against their dues"
    newLabel="New Payment In"
    icon={HandCoins}
    emptyTitle="No payments received yet"
    emptyDescription="Record money received from a customer against a credit sale or send."
    searchPlaceholder="Search payment no…"
    useListQuery={useGetAllPaymentInQuery}
    usePostMutation={usePostPaymentInMutation}
    socketModule="PaymentIn"
    numberField="paymentNumber"
    statusOptions={PAYMENT_STATUS_OPTIONS}
    supportsPeriod={false}
    postDescription="This will settle the customer's due balance."
    FormModal={PaymentInFormModal}
    columns={COLUMNS}
    renderCells={(r) => (
      <>
        <DocCell number={r.paymentNumber} date={r.date} />
        <PartyCell name={r.entityType} sub={r.receivableAccount?.name} />
        <td className={`${TD} text-slate-600`}>{r.depositAccount?.name || "—"}</td>
        <MoneyCell value={r.amount} strong />
      </>
    )}
  />
);

export default PaymentInListPage;
