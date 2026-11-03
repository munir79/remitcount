"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, CalendarDays, Hourglass, Wallet, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllCashierSessionsQuery, useGetBranchDaySummaryQuery } from "@/redux/features/pos/cashierSessionApi";
import { useCancelCashTransferMutation, useGetAllCashTransfersQuery } from "@/redux/features/pos/cashTransferApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { formatDateTime, formatMoney, formatNumber, todayInCompany } from "@/lib/format";

// RM হলে "RM 1,000.00", Foreign হলে "USD 100.00"
const transferAmount = (t) => (t?.currencyCode && t.currencyCode !== "MYR" ? `${t.currencyCode} ${formatNumber(t.amount, t.currency?.decimals ?? 2)}` : formatMoney(t?.amount));
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import StatCard from "@/compoent/ui/StatCard";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Button from "@/compoent/ui/Button";
import Input from "@/compoent/ui/Input";
import SegmentedControl from "@/compoent/ui/SegmentedControl";
import BranchSelector from "@/compoent/ui/BranchSelector";
import Pagination from "@/compoent/ui/Pagination";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import { STATUS_VARIANT, TD } from "@/compoent/ui/TableCells";
import CashTransferModal from "@/compoent/pos/CashTransferModal";
import { SESSION_STATUS } from "@/compoent/pos/SessionReport";

// আজকের তারিখ — Malaysia র হিসাবে "YYYY-MM-DD"

const Money = ({ value, signed = false }) => {
  if (value === null || value === undefined) return <span className="text-slate-300">—</span>;
  if (!signed) return <span className="tabular-nums">{formatMoney(value)}</span>;
  if (Number(value) === 0) return <span className="tabular-nums text-emerald-700">0.00</span>;
  return (
    <span className={`font-medium tabular-nums ${value > 0 ? "text-sky-700" : "text-rose-600"}`}>
      {value > 0 ? "+" : "−"} {formatMoney(Math.abs(value))}
    </span>
  );
};

const SessionStatusBadge = ({ status }) => {
  const meta = SESSION_STATUS[status] || SESSION_STATUS.Open;
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
};

// ============================================================
// Day summary — Branch এর সব Drawer (Manager / Admin)
// ============================================================
const DaySummaryTab = ({ showBranch }) => {
  const router = useRouter();
  const [date, setDate] = useState(todayInCompany);
  const [branch, setBranch] = useState("");
  const { data, isLoading, isFetching, refetch } = useGetBranchDaySummaryQuery({ date, ...(branch ? { branch } : {}) });
  useSocketEvent("company-data-updated", (p) => {
    if (["CashierSession", "CashTransfer"].includes(p?.module)) refetch();
  });
  const d = data?.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <Input id="summaryDate" type="date" label="Date" value={date} max={todayInCompany()} onChange={(e) => setDate(e.target.value || todayInCompany())} className="w-44" />
        {showBranch && <BranchSelector branch={branch} onBranchChange={setBranch} className="w-52" />}
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>
      <PrintHeader title="Branch cash summary" subtitle={d ? `Date ${d.date}` : ""} />

      {isLoading || !d ? (
        <PageLoader />
      ) : (
        <div className={`space-y-6 ${isFetching ? "opacity-70" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Cash in drawers" value={formatMoney(d.cashTotal)} icon={Wallet} tone="amber" hint={`${d.drawers.length} drawer(s)`} />
            <StatCard
              label="Cash differences"
              value={`${d.totalVariance > 0 ? "+" : d.totalVariance < 0 ? "−" : ""}${formatMoney(Math.abs(d.totalVariance))}`}
              icon={Hourglass}
              tone={d.totalVariance < 0 ? "rose" : "sky"}
              hint={[d.openCount && `${d.openCount} still open`, d.pendingCount && `${d.pendingCount} waiting approval`].filter(Boolean).join(" · ") || "All sessions closed"}
            />
          </div>

          {d.drawers.length === 0 ? (
            <EmptyState icon={Wallet} title="No cash drawers" description="Add cash drawers for this branch in Cash & Bank." />
          ) : (
            <Table
              columns={[
                { key: "drawer", label: "Drawer / cashier" },
                { key: "open", label: "Opening", align: "right" },
                { key: "exp", label: "Expected", align: "right" },
                { key: "count", label: "Counted", align: "right" },
                { key: "diff", label: "Difference", align: "right" },
                { key: "status", label: "Status" },
              ]}
            >
              {d.drawers.flatMap((dr) =>
                dr.sessions.length === 0
                  ? [
                      <tr key={dr._id}>
                        <td className={TD}>
                          <p className="font-medium text-slate-900">{dr.name}</p>
                          <p className="text-xs text-slate-500">Not used this day · balance {formatMoney(dr.balance)}</p>
                        </td>
                        <td className={TD} colSpan={5} />
                      </tr>,
                    ]
                  : dr.sessions.map((s, i) => (
                      <tr key={s._id} onClick={() => router.push(`/pos/cash/session/${s._id}`)} className="cursor-pointer">
                        <td className={TD}>
                          <p className="font-medium text-slate-900">{i === 0 ? dr.name : ""}</p>
                          <p className="text-xs text-slate-500">
                            {s.cashier} · {formatDateTime(s.openedAt)}
                            {s.closedAt ? ` → ${formatDateTime(s.closedAt)}` : ""}
                          </p>
                        </td>
                        <td className={`${TD} text-right`}>
                          <Money value={s.openingBalance} />
                          {s.openingVariance ? (
                            <p className="text-[11px] text-slate-400">
                              <Money value={s.openingVariance} signed /> at open
                            </p>
                          ) : null}
                        </td>
                        <td className={`${TD} text-right`}>
                          <Money value={s.expected} />
                        </td>
                        <td className={`${TD} text-right`}>
                          <Money value={s.counted} />
                        </td>
                        <td className={`${TD} text-right`}>{s.variance === null ? <span className="text-slate-300">—</span> : <Money value={s.variance} signed />}</td>
                        <td className={TD}>
                          <SessionStatusBadge status={s.status} />
                          {s.approvedBy && <p className="mt-0.5 text-[11px] text-slate-400">Approved by {s.approvedBy}</p>}
                        </td>
                      </tr>
                    ))
              )}
            </Table>
          )}

        </div>
      )}
    </div>
  );
};

// ============================================================
// Sessions — Cashier নিজের; Manager নিজের Branch এর (অনুমোদনের অপেক্ষায় থাকাগুলো আগে)
// ============================================================
const SESSION_FILTERS = [
  { value: "", label: "All" },
  { value: "PendingApproval", label: "Waiting" },
  { value: "Open", label: "Open" },
  { value: "Closed", label: "Closed" },
];

const SessionsTab = ({ isManager }) => {
  const router = useRouter();
  const [status, setStatus] = useState(isManager ? "PendingApproval" : "");
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetAllCashierSessionsQuery({ page, limit: 20, ...(status ? { status } : {}) });
  useSocketEvent("company-data-updated", (p) => {
    if (p?.module === "CashierSession") refetch();
  });
  const rows = data?.data?.data || [];

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        options={SESSION_FILTERS}
        className="max-w-md"
      />
      {isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title={status === "PendingApproval" ? "Nothing waiting for approval" : "No sessions"} description="Cashier sessions appear here when drawers are opened." />
      ) : (
        <>
          <Table
            columns={[
              { key: "who", label: "Cashier / drawer" },
              { key: "time", label: "Opened → closed" },
              { key: "open", label: "Opening", align: "right" },
              { key: "count", label: "Counted", align: "right" },
              { key: "diff", label: "Difference", align: "right" },
              { key: "status", label: "Status" },
            ]}
          >
            {rows.map((s) => (
              <tr key={s._id} onClick={() => router.push(`/pos/cash/session/${s._id}`)} className={`cursor-pointer ${s.status === "PendingApproval" ? "bg-amber-50/50" : ""}`}>
                <td className={TD}>
                  <p className="font-medium text-slate-900">{s.cashier?.name}</p>
                  <p className="text-xs text-slate-500">{[s.cashAccount?.name, s.branch?.name].filter(Boolean).join(" · ")}</p>
                </td>
                <td className={`${TD} text-xs text-slate-600`}>
                  {formatDateTime(s.openedAt)}
                  {s.closedAt && <p className="text-slate-400">→ {formatDateTime(s.closedAt)}</p>}
                </td>
                <td className={`${TD} text-right`}>
                  <Money value={s.openingBalance} />
                </td>
                <td className={`${TD} text-right`}>
                  <Money value={s.closingPhysicalCash} />
                </td>
                <td className={`${TD} text-right`}>{s.variance === null || s.variance === undefined ? <span className="text-slate-300">—</span> : <Money value={s.variance} signed />}</td>
                <td className={TD}>
                  <SessionStatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={data?.data?.pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

// ============================================================
// Transfers — Drawer ↔ Bank
// ============================================================
const TransfersTab = ({ canManage }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useGetAllCashTransfersQuery({ page, limit: 20 });
  const [cancelTransfer, { isLoading: isCancelling }] = useCancelCashTransferMutation();
  const [target, setTarget] = useState(null);
  useSocketEvent("company-data-updated", (p) => {
    if (p?.module === "CashTransfer") refetch();
  });
  const rows = data?.data?.data || [];

  const handleCancel = async () => {
    try {
      await cancelTransfer({ id: target._id, reason: "Cancelled by manager" }).unwrap();
      toast.success(`${target.transferNumber} cancelled`);
      setTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to cancel");
    }
  };

  if (isLoading) return <PageLoader />;
  if (rows.length === 0) return <EmptyState icon={ArrowLeftRight} title="No cash transfers yet" description="Moving cash between a drawer and the bank is recorded here." />;

  return (
    <>
      <Table
        columns={[
          { key: "no", label: "Transfer" },
          { key: "route", label: "From → to" },
          { key: "amount", label: "Amount", align: "right" },
          { key: "status", label: "Status" },
          { key: "actions", label: "" },
        ]}
      >
        {rows.map((t) => (
          <tr key={t._id}>
            <td className={TD}>
              <p className="font-mono text-[13px] font-semibold text-slate-900">{t.transferNumber}</p>
              <p className="text-xs text-slate-500">
                {formatDateTime(t.createdAt)} · {t.createdBy?.name}
              </p>
            </td>
            <td className={TD}>
              <p className="text-sm text-slate-800">
                {t.fromAccount?.name} <span className="text-slate-400">→</span> {t.toAccount?.name}
              </p>
              {t.notes && <p className="text-xs text-slate-500">{t.notes}</p>}
            </td>
            <td className={`${TD} text-right font-semibold tabular-nums text-slate-900`}>{transferAmount(t)}</td>
            <td className={TD}>
              <Badge variant={STATUS_VARIANT[t.status === "Posted" ? "Posted" : "Cancelled"]}>{t.status}</Badge>
            </td>
            <td className={`${TD} text-right`}>
              {canManage && t.status === "Posted" && (
                <button
                  type="button"
                  onClick={() => setTarget(t)}
                  title="Cancel transfer"
                  aria-label={`Cancel ${t.transferNumber}`}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pagination pagination={data?.data?.pagination} onPageChange={setPage} />
      <ConfirmDialog
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={handleCancel}
        isLoading={isCancelling}
        confirmLabel="Cancel transfer"
        title={`Cancel ${target?.transferNumber || ""}`}
        description={`Move ${transferAmount(target)} back from ${target?.toAccount?.name} to ${target?.fromAccount?.name}? A drawer involved must have an open session.`}
      />
    </>
  );
};

// ============================================================
const CashPage = () => {
  const { hasPermission, user } = useAuth();
  const isManager = hasPermission("cashierSession:manage");
  const tabs = [
    ...(isManager ? [{ value: "summary", label: "Day summary", icon: CalendarDays }] : []),
    { value: "sessions", label: "Sessions", icon: Wallet },
    ...(hasPermission("cashTransfer:read") ? [{ value: "transfers", label: "Transfers", icon: ArrowLeftRight }] : []),
  ];
  const [tab, setTab] = useState(tabs[0].value);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Cash & sessions"
        description={isManager ? "Every cash drawer in your branch, cashier sessions and cash moved to or from the bank" : "Your cashier sessions and cash transfers"}
        actions={
          hasPermission("cashTransfer:create") && (
            <Button onClick={() => setIsTransferOpen(true)} className="print:hidden">
              <ArrowLeftRight className="h-4 w-4" />
              Move cash
            </Button>
          )
        }
      />
      {tabs.length > 1 && <SegmentedControl value={tab} onChange={setTab} options={tabs} className="mb-6 max-w-lg print:hidden" />}

      {tab === "summary" && <DaySummaryTab showBranch={!user?.branch} />}
      {tab === "sessions" && <SessionsTab isManager={isManager} />}
      {tab === "transfers" && <TransfersTab canManage={hasPermission("cashTransfer:manage")} />}

      <CashTransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
    </div>
  );
};

export default CashPage;
