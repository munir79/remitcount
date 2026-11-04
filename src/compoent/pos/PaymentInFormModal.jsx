"use client";
import { useState } from "react";
import { ArrowUpCircle, Gift, Send } from "lucide-react";
import { useGetAllOtherIncomesQuery } from "@/redux/features/pos/otherIncomeApi";
import { useCreatePaymentInMutation, useGetPaymentInDuesQuery } from "@/redux/features/pos/paymentInApi";
import { useGetAllSellCurrencyQuery } from "@/redux/features/pos/sellCurrencyApi";
import { useGetAllSendsQuery } from "@/redux/features/pos/sendApi";
import { formatMoney } from "@/lib/format";
import PartyPaymentFormModal from "./PartyPaymentFormModal";
import SettlementFormModal from "./SettlementFormModal";

const ENTITY_TYPES = [
  { value: "SellCurrency", label: "Sell", icon: ArrowUpCircle },
  { value: "Send", label: "Send", icon: Send },
  { value: "OtherIncome", label: "Other Income", icon: Gift },
];

// কোন Record এর বিপরীতে Customer এর কাছ থেকে টাকা আসবে — শুধু Posted ও Due আছে এমন
const usePaymentInSources = (entityType, isOpen) => {
  const params = { status: "Posted", limit: 200 };
  const { data: sellData } = useGetAllSellCurrencyQuery(params, { skip: !isOpen || entityType !== "SellCurrency" });
  const { data: sendData } = useGetAllSendsQuery(params, { skip: !isOpen || entityType !== "Send" });
  const { data: incomeData } = useGetAllOtherIncomesQuery(params, { skip: !isOpen || entityType !== "OtherIncome" });

  if (entityType === "SellCurrency") {
    return (sellData?.data?.data || [])
      .filter((r) => r.dueAmount > 0)
      .map((r) => ({ value: r._id, label: `${r.sellNumber} · ${r.customer?.name || ""}`, sub: `Due ${formatMoney(r.dueAmount)}`, due: r.dueAmount }));
  }
  if (entityType === "Send") {
    return (sendData?.data?.data || [])
      .filter((r) => r.customerDueAmount > 0)
      .map((r) => ({ value: r._id, label: `${r.sendNumber} · ${r.customer?.name || ""}`, sub: `Due ${formatMoney(r.customerDueAmount)}`, due: r.customerDueAmount }));
  }
  if (entityType === "OtherIncome") {
    return (incomeData?.data?.data || [])
      .filter((r) => r.dueAmount > 0)
      .map((r) => ({
        value: r._id,
        label: `${r.incomeNumber} · ${r.customer?.name || r.incomeType}`,
        sub: `Due ${formatMoney(r.dueAmount)}`,
        due: r.dueAmount,
      }));
  }
  return [];
};

/** ✅ দুই পথ — নাম ধরে (Default, পুরনো বাকি আগে), আর একটা লেনদেনের বিপরীতে */
const PaymentInFormModal = ({ isOpen, onClose }) => {
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
        formId="payment-in-name-form"
        title="New Payment In"
        description="Choose who is paying — oldest dues are cleared first"
        defaultPartyType="Customer"
        useDuesQuery={useGetPaymentInDuesQuery}
        useCreateMutation={useCreatePaymentInMutation}
        accountField="depositAccount"
        accountLabel="Received into"
        dueLabel="To collect"
        approvePermission="paymentIn:approve"
        receiptPath={(id) => `/pos/payment-in/${id}/receipt`}
        onSwitchMode={() => setMode("single")}
      />
    );
  }

  return (
    <SettlementFormModal
      isOpen={isOpen}
      onClose={handleClose}
      formId="payment-in-form"
      title="New Payment In"
      description="Receive money from a customer against a credit transaction"
      entityTypes={ENTITY_TYPES}
      useSources={usePaymentInSources}
      useCreateMutation={useCreatePaymentInMutation}
      accountField="depositAccount"
      accountLabel="Received into"
      partyLabel="Customer"
      successMessage="Payment In saved as Draft"
      onSwitchMode={() => setMode("name")}
    />
  );
};

export default PaymentInFormModal;
