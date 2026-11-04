"use client";
import { useParams } from "next/navigation";
import { useGetPaymentInReceiptQuery } from "@/redux/features/pos/paymentInApi";
import PaymentReceiptView from "@/compoent/pos/PaymentReceiptView";

const PaymentInReceiptPage = () => {
  const { id } = useParams();
  const query = useGetPaymentInReceiptQuery(id, { skip: !id });
  return <PaymentReceiptView {...query} direction="in" backHref="/pos/payment-in" backLabel="Payment In" />;
};

export default PaymentInReceiptPage;
