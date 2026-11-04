"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, Clock, FileText, Hourglass, PlayCircle, StopCircle, UserCheck, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyAssignmentQuery, useGetMyOpenSessionQuery } from "@/redux/features/pos/cashierSessionApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatDateTime, formatMoney } from "@/lib/format";
import Button from "../ui/Button";
import StartSessionModal from "./StartSessionModal";
import CloseSessionModal from "./CloseSessionModal";
import CashTransferModal from "./CashTransferModal";

/**
 * ✅ POS এর উপরে — আমার Session: খোলা / অনুমোদনের অপেক্ষায় / Assign এর অপেক্ষায় / কিছুই না
 * Session নিজে খোলা যায় না — Manager Assign করলে তবেই গুনে শুরু
 * খোলা থাকলে: Move cash (Drawer ↔ Bank), Report, Close
 */
const CashierSessionBar = () => {
  const { hasPermission } = useAuth();
  const { data, isLoading, refetch } = useGetMyOpenSessionQuery();
  const canManage = hasPermission("cashierSession:manage");
  const { data: assignmentData, refetch: refetchAssignment } = useGetMyAssignmentQuery(undefined, { skip: !hasPermission("cashierSession:create") });
  const [modal, setModal] = useState(null); // "start" | "close" | "transfer"

  useSocketEvent("company-data-updated", (payload) => {
    if (["CashierSession", "CashTransfer"].includes(payload?.module)) {
      refetch();
      if (hasPermission("cashierSession:create")) refetchAssignment();
    }
  });

  const mySession = data?.data || null;
  const assignment = assignmentData?.data || null;

  if (isLoading) {
    return <div className="mb-6 h-[72px] animate-pulse rounded-2xl border border-slate-200/80 bg-white shadow-card" />;
  }

  const isOpen = mySession?.status === "Open";
  const isStale = isOpen && mySession.isStale; // আগের দিনের — লেনদেন বন্ধ
  const isWaiting = !mySession && Boolean(assignment);
  const isPending = mySession?.status === "PendingApproval";
  const tone = isOpen ? "emerald" : "amber";

  return (
    <div
      className={`mb-6 flex flex-col gap-4 rounded-2xl border bg-white px-5 py-4 shadow-card lg:flex-row lg:items-center lg:justify-between ${
        isOpen ? "border-emerald-200" : "border-amber-200"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone === "emerald" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
          {isPending ? <Hourglass className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
          <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${isOpen ? "bg-emerald-500" : "bg-amber-400"}`} />
        </div>

        {isStale ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Session from an earlier day · {mySession.cashAccount?.name}</p>
            <p className="mt-0.5 text-[13px] text-slate-500">No cash can be recorded. {canManage ? "Count and close it." : "Your manager must count and close it."}</p>
          </div>
        ) : isOpen ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              Session open · <span className="font-medium text-slate-600">{mySession.cashAccount?.name}</span>
            </p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
              <span>
                Opening <span className="font-medium tabular-nums text-slate-700">{formatMoney(mySession.openingBalance)}</span>
              </span>
              {mySession.cashAccount?.currentBalance !== undefined && (
                <span>
                  In drawer now <span className="font-medium tabular-nums text-slate-700">{formatMoney(mySession.cashAccount.currentBalance)}</span>
                </span>
              )}
              {mySession.openedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(mySession.openedAt)}
                </span>
              )}
            </p>
          </div>
        ) : isPending ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Waiting for manager approval · {mySession.cashAccount?.name}</p>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Your count was {formatMoney(mySession.closingPhysicalCash)}
              {mySession.variance !== undefined && ` (${mySession.variance > 0 ? "over" : "short"} ${formatMoney(Math.abs(mySession.variance))})`}. No cash can be recorded until it is approved.
            </p>
          </div>
        ) : isWaiting ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{assignment.drawerName} is assigned to you</p>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {assignment.triesLeft === 0 ? "Your count did not match. Call your manager." : `${assignment.assignedBy} assigned it. Count the drawer to start.`}
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">No drawer assigned today</p>
            <p className="mt-0.5 text-[13px] text-slate-500">{canManage ? "Assign a drawer from Cash & sessions." : "Your manager must assign a drawer before you can record cash."}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {isStale && (
          <Link
            href={`/pos/cash/session/${mySession._id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            {canManage ? "Count and close" : "View report"}
          </Link>
        )}
        {isOpen && !isStale && (
          <>
            {hasPermission("cashTransfer:create") && (
              <Button variant="secondary" onClick={() => setModal("transfer")}>
                <ArrowLeftRight className="h-4 w-4" />
                Move cash
              </Button>
            )}
            <Link
              href={`/pos/cash/session/${mySession._id}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <FileText className="h-4 w-4" />
              Report
            </Link>
            <Button variant="secondary" onClick={() => setModal("close")}>
              <StopCircle className="h-4 w-4 text-rose-500" />
              Close session
            </Button>
          </>
        )}
        {isPending && (
          <Link
            href={`/pos/cash/session/${mySession._id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" />
            View report
          </Link>
        )}
        {isWaiting && assignment.triesLeft > 0 && (
          <Button onClick={() => setModal("start")}>
            <PlayCircle className="h-4 w-4" />
            Count and start
          </Button>
        )}
        {!mySession && !assignment && canManage && (
          <Link
            href="/pos/cash"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <UserCheck className="h-4 w-4" />
            Assign drawers
          </Link>
        )}
      </div>

      <StartSessionModal isOpen={modal === "start"} onClose={() => setModal(null)} assignment={assignment} />
      <CloseSessionModal isOpen={modal === "close"} onClose={() => setModal(null)} session={mySession} />
      {isOpen && <CashTransferModal key={mySession._id} isOpen={modal === "transfer"} onClose={() => setModal(null)} defaultFrom={mySession.cashAccount?._id} />}
    </div>
  );
};

export default CashierSessionBar;
