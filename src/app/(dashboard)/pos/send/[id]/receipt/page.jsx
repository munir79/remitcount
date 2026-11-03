"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileDown, MessageCircle, Printer, ReceiptText } from "lucide-react";
import { useGetSendReceiptQuery } from "@/redux/features/pos/sendApi";
import { formatMoney, formatNumber } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Button from "@/compoent/ui/Button";
import SegmentedControl from "@/compoent/ui/SegmentedControl";
import SendReceipt from "@/compoent/send/SendReceipt";

const PAPER = [
  { value: "a4", label: "A4" },
  { value: "thermal", label: "80mm" },
];

// Print এর কাগজের মাপ — Thermal এ লম্বা ফিতা, A4 এ সাধারণ পাতা
const PAGE_STYLE = {
  a4: "@media print { @page { size: A4; margin: 14mm; } }",
  thermal: "@media print { @page { size: 80mm auto; margin: 3mm 4mm; } }",
};

const SendReceiptPage = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useGetSendReceiptQuery(id, { skip: !id });
  const [paper, setPaper] = useState("a4");
  const receipt = data?.data;

  if (isLoading) return <PageLoader className="h-[60vh]" />;
  if (error || !receipt) {
    return (
      <div className="p-6">
        <EmptyState icon={ReceiptText} title="Receipt not available" description={error?.data?.message || "This send could not be found."} />
      </div>
    );
  }

  const decimals = receipt.currency?.decimals ?? 2;
  const whatsappText = [
    `${receipt.company?.name || "Remittance"} — Receipt ${receipt.receiptNumber}`,
    `Receiver: ${receipt.receiver?.name}${receipt.receiver?.bank ? ` (${receipt.receiver.bank})` : ""}`,
    `Amount: ${receipt.currencyCode} ${formatNumber(receipt.foreignAmount, decimals)}`,
    `Total paid: ${formatMoney(receipt.paidAmount)}${Number(receipt.dueAmount) > 0 ? ` · Due: ${formatMoney(receipt.dueAmount)}` : ""}`,
    "Thank you!",
  ].join("\n");
  const whatsappLink = buildWhatsAppLink(receipt.customer?.phone, whatsappText);

  return (
    <div className="p-4 sm:p-6 lg:p-8 print:p-0">
      <style>{PAGE_STYLE[paper]}</style>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <Link href="/pos/send" className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Send history
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Receipt {receipt.receiptNumber}</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <SegmentedControl label="Paper" value={paper} onChange={setPaper} options={PAPER} className="w-40" />
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgb(16_24_40/0.05)] ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              WhatsApp
            </a>
          )}
          {/* Browser এর Print Dialog এ "Save as PDF" বাছলে PDF Download হয় */}
          <Button variant="secondary" onClick={() => window.print()} title="Choose “Save as PDF” in the print dialog">
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className={paper === "thermal" ? "flex justify-center rounded-2xl bg-slate-100 py-6 print:block print:bg-white print:py-0" : ""}>
        <SendReceipt receipt={receipt} variant={paper} />
      </div>
    </div>
  );
};

export default SendReceiptPage;
