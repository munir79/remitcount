"use client";
import { useParams } from "next/navigation";
import { useGetPaymentOutReceiptQuery } from "@/redux/features/pos/paymentOutApi";
import PaymentReceiptView from "@/compoent/pos/PaymentReceiptView";

const PaymentOutReceiptPage = () => {
  const { id } = useParams();
  const query = useGetPaymentOutReceiptQuery(id, { skip: !id });
  return <PaymentReceiptView {...query} direction="out" backHref="/pos/payment-out" backLabel="Payment Out" />;
};

export default PaymentOutReceiptPage;
