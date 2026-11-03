"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileDown, Printer, ReceiptText } from "lucide-react";
import { useGetExpenseVoucherQuery } from "@/redux/features/pos/posExpenseApi";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Button from "@/compoent/ui/Button";
import SegmentedControl from "@/compoent/ui/SegmentedControl";
import ExpenseVoucher from "@/compoent/pos/ExpenseVoucher";

const PAPER = [
  { value: "a4", label: "A4" },
  { value: "thermal", label: "80mm" },
];

// Print এর কাগজের মাপ — Thermal এ লম্বা ফিতা, A4 এ সাধারণ পাতা
const PAGE_STYLE = {
  a4: "@media print { @page { size: A4; margin: 14mm; } }",
  thermal: "@media print { @page { size: 80mm auto; margin: 3mm 4mm; } }",
};

const ExpenseVoucherPage = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useGetExpenseVoucherQuery(id, { skip: !id });
  const [paper, setPaper] = useState("a4");
  const voucher = data?.data;

  if (isLoading) return <PageLoader className="h-[60vh]" />;
  if (error || !voucher) {
    return (
      <div className="p-6">
        <EmptyState icon={ReceiptText} title="Voucher not available" description={error?.data?.message || "This expense could not be found."} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 print:p-0">
      <style>{PAGE_STYLE[paper]}</style>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <Link href="/pos/expense" className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Expenses
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Voucher {voucher.voucherNumber}</h1>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <SegmentedControl label="Paper" value={paper} onChange={setPaper} options={PAPER} className="w-40" />
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
        <ExpenseVoucher voucher={voucher} variant={paper} />
      </div>
    </div>
  );
};

export default ExpenseVoucherPage;
