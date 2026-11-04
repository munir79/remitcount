"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, FileText, RotateCcw, StopCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApproveCashierSessionMutation, useGetSessionSummaryQuery, useRejectCashierSessionMutation } from "@/redux/features/pos/cashierSessionApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatMoney } from "@/lib/format";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Button from "@/compoent/ui/Button";
import Input from "@/compoent/ui/Input";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import SessionReport from "@/compoent/pos/SessionReport";
import CloseSessionModal from "@/compoent/pos/CloseSessionModal";

/**
 * ✅ একটা Session এর Report — Print করা যায়
 * অনুমোদনের অপেক্ষায় থাকলে Manager এখান থেকেই Approve / Recount এ ফেরত পাঠান
 */
const SessionReportPage = () => {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const { data, isLoading, error, refetch } = useGetSessionSummaryQuery(id, { skip: !id });
  const [approve, { isLoading: isApproving }] = useApproveCashierSessionMutation();
  const [reject, { isLoading: isRejecting }] = useRejectCashierSessionMutation();
  const [note, setNote] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useSocketEvent("company-data-updated", (payload) => {
    if (["CashierSession", "CashTransfer"].includes(payload?.module)) refetch();
  });

  if (isLoading) return <PageLoader className="h-[60vh]" />;
  const summary = data?.data;
  if (error || !summary) {
    return (
      <div className="p-6">
        <EmptyState icon={FileText} title="Session not available" description={error?.data?.message || "This session could not be found."} />
      </div>
    );
  }

  const s = summary.session;
  const canManage = hasPermission("cashierSession:manage");
  const canReview = s.status === "PendingApproval" && canManage;

  const act = async (fn, message) => {
    try {
      await fn({ id: s._id, note }).unwrap();
      toast.success(message);
      setNote("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/pos/cash" className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          Cash & sessions
        </Link>
        <div className="flex items-center gap-2">
          {s.status === "Open" && canManage && (
            <Button variant="secondary" onClick={() => setIsClosing(true)}>
              <StopCircle className="h-4 w-4 text-rose-500" />
              Count and close
            </Button>
          )}
          <PrintButton />
        </div>
      </div>
      <CloseSessionModal isOpen={isClosing} onClose={() => setIsClosing(false)} session={s} />

      <PrintHeader title="Cashier session report" subtitle={`${s.cashAccount?.name || ""} · ${s.cashier?.name || ""}`} />
      <h1 className="mb-4 text-lg font-semibold text-slate-900 print:hidden">Cashier session report</h1>

      <SessionReport summary={summary} />

      {canReview && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 print:hidden">
          <p className="text-sm font-semibold text-amber-900">
            {s.cashier?.name} counted {formatMoney(s.closingPhysicalCash)} — {s.variance > 0 ? "over" : "short"} by {formatMoney(Math.abs(s.variance))}
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            Approve to close the session and record the difference in Cash Over/Short, or send it back so the cashier counts again.
          </p>
          <Input id="reviewNote" label="Note (optional)" className="mt-3" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Counted again together — confirmed short" />
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => act(reject, "Sent back for recount")} isLoading={isRejecting} disabled={isApproving}>
              <RotateCcw className="h-4 w-4" />
              Count again
            </Button>
            <Button onClick={() => act(approve, "Difference approved — session closed")} isLoading={isApproving} disabled={isRejecting}>
              <CheckCircle2 className="h-4 w-4" />
              Approve difference
            </Button>
          </div>
        </section>
      )}

      <div className="mt-10 hidden grid-cols-2 gap-10 text-xs text-slate-500 print:grid">
        <div>
          <div className="h-10 border-b border-slate-400" />
          <p className="mt-1">Cashier signature</p>
        </div>
        <div>
          <div className="h-10 border-b border-slate-400" />
          <p className="mt-1">Manager signature</p>
        </div>
      </div>
    </div>
  );
};

export default SessionReportPage;
