"use client";
import { useState } from "react";
import { ArrowDownCircle, Gift, Send } from "lucide-react";
import { useGetAllBuyCurrencyQuery } from "@/redux/features/pos/buyCurrencyApi";
import { useCreatePaymentOutMutation, useGetPaymentOutDuesQuery } from "@/redux/features/pos/paymentOutApi";
import { useGetAllSendsQuery } from "@/redux/features/pos/sendApi";
import { useGetAllOtherIncomesQuery } from "@/redux/features/pos/otherIncomeApi";
import { formatMoney } from "@/lib/format";
import PartyPaymentFormModal from "./PartyPaymentFormModal";
import SettlementFormModal from "./SettlementFormModal";

const ENTITY_TYPES = [
  { value: "BuyCurrency", label: "Buy", icon: ArrowDownCircle },
  { value: "Send", label: "Send (supplier)", icon: Send },
  { value: "OtherIncome", label: "Other income (supplier)", icon: Gift },
];

// কোন Record এর বিপরীতে টাকা দেওয়া হবে — শুধু Posted ও Due আছে এমন
const usePaymentOutSources = (entityType, isOpen) => {
  const params = { status: "Posted", limit: 200 };
  const { data: buyData } = useGetAllBuyCurrencyQuery(params, { skip: !isOpen || entityType !== "BuyCurrency" });
  const { data: sendData } = useGetAllSendsQuery(params, { skip: !isOpen || entityType !== "Send" });
  const { data: incomeData } = useGetAllOtherIncomesQuery(params, { skip: !isOpen || entityType !== "OtherIncome" });

  if (entityType === "BuyCurrency") {
    return (buyData?.data?.data || [])
      .filter((r) => r.dueAmount > 0)
      .map((r) => ({ value: r._id, label: `${r.buyNumber} · ${r.customer?.name || ""}`, sub: `Due ${formatMoney(r.dueAmount)}`, due: r.dueAmount }));
  }
  if (entityType === "Send") {
    return (sendData?.data?.data || [])
      .filter((r) => r.supplierDueAmount > 0)
      .map((r) => ({ value: r._id, label: `${r.sendNumber} · ${r.supplier?.name || ""}`, sub: `Due ${formatMoney(r.supplierDueAmount)}`, due: r.supplierDueAmount }));
  }
  if (entityType === "OtherIncome") {
    // Other Income এর খরচ — Supplier কে পরে দেওয়া অংশ
    return (incomeData?.data?.data || [])
      .filter((r) => r.supplierDueAmount > 0)
      .map((r) => ({ value: r._id, label: `${r.incomeNumber} · ${r.supplier?.name || ""}`, sub: `${r.incomeType} · Due ${formatMoney(r.supplierDueAmount)}`, due: r.supplierDueAmount }));
  }
  return [];
};

/** ✅ দুই পথ — নাম ধরে (Default, পুরনো দেনা আগে), আর একটা লেনদেনের বিপরীতে (Settle in full এখানে) */
const PaymentOutFormModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState("name");
  const handleClose = () => {
    setMode("name");
    onClose();
  };

  if (mode === "name") {
    return (
      <PartyPaymentFormModal
        isOpen={isOpen}
        onClose={handleClose}
        formId="payment-out-name-form"
        title="New Payment Out"
        description="Choose who you are paying — oldest dues are cleared first"
        defaultPartyType="Vendor"
        useDuesQuery={useGetPaymentOutDuesQuery}
        useCreateMutation={useCreatePaymentOutMutation}
        accountField="paymentAccount"
        accountLabel="Paid from"
        dueLabel="To pay"
        approvePermission="paymentOut:approve"
        receiptPath={(id) => `/pos/payment-out/${id}/receipt`}
        onSwitchMode={() => setMode("single")}
      />
    );
  }

  return (
    <SettlementFormModal
      isOpen={isOpen}
      onClose={handleClose}
      formId="payment-out-form"
      title="New Payment Out"
      description="Pay a customer or supplier against a credit transaction"
      entityTypes={ENTITY_TYPES}
      useSources={usePaymentOutSources}
      useCreateMutation={useCreatePaymentOutMutation}
      accountField="paymentAccount"
      accountLabel="Paid from"
      partyLabel="Payee"
      successMessage="Payment Out saved as Draft"
      settleInFullFor="Send"
      onSwitchMode={() => setMode("name")}
    />
  );
};

export default PaymentOutFormModal;
