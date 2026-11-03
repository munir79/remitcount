"use client";
import Link from "next/link";
import { ArrowDownCircle, ArrowUpCircle, Banknote, Clock, Landmark, ReceiptText, Split, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetSingleSendQuery } from "@/redux/features/pos/sendApi";
import { describeInverse, describeRate } from "@/lib/currencyMath";
import RateDisplay from "../ui/RateDisplay";
import { getCountryName } from "@/lib/countries";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import PageLoader from "../ui/PageLoader";
import { STATUS_VARIANT } from "../ui/TableCells";

export const PAYMENT_METHOD_META = {
  Cash: { label: "Cash", icon: Banknote, tone: "bg-amber-50 text-amber-700 ring-amber-600/15" },
  Bank: { label: "Bank transfer", icon: Landmark, tone: "bg-sky-50 text-sky-700 ring-sky-600/15" },
  Credit: { label: "Credit", icon: Clock, tone: "bg-violet-50 text-violet-700 ring-violet-600/15" },
  Split: { label: "Split", icon: Split, tone: "bg-indigo-50 text-indigo-700 ring-indigo-600/15" },
};

/**
 * Send এর Payment লাইন — নতুন Record এ customerPayments, পুরনো (Split এর আগের) এ customerPaymentAccount থেকে
 * Backend এর getPaymentPlan এর মতো একই নিয়ম
 */
export const getSendPayments = (s) => {
  if (s.customerPayments?.length || s.customerReceivableAccount) return s.customerPayments || [];
  if (s.paymentTerm === "Credit") return [];
  return [{ method: s.paymentMethod === "Bank" ? "Bank" : "Cash", account: s.customerPaymentAccount, amount: s.customerTotalMYR }];
};

// Send এর সময়েই যা পাওয়া গেছে (পরের Payment In বাদে)
export const upfrontPaid = (s) => getSendPayments(s).reduce((sum, p) => sum + Number(p.amount || 0), 0);

/** Cash / Bank / Credit — রঙিন ছোট Badge */
export const PaymentMethodBadge = ({ method }) => {
  const meta = PAYMENT_METHOD_META[method] || PAYMENT_METHOD_META.Cash;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${meta.tone}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
};

const Line = ({ label, value, strong, tone }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`text-right tabular-nums ${strong ? "font-semibold" : ""} ${tone || "text-slate-800"}`}>{value}</span>
  </div>
);

const SideCard = ({ icon: Icon, title, status, children, action }) => (
  <section className="rounded-xl border border-slate-200 p-4">
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon className="h-4 w-4 text-slate-400" />
        {title}
      </h3>
      {status && <Badge variant={STATUS_VARIANT[status] || "neutral"}>{status}</Badge>}
    </div>
    <div className="divide-y divide-slate-100">{children}</div>
    {action && <div className="mt-3">{action}</div>}
  </section>
);

const actionLink =
  "inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-[13px] font-semibold text-indigo-700 transition hover:bg-indigo-100";

/**
 * ✅ একটা Send এর পুরো হিসাব — Customer কীভাবে দিলেন (Cash / Bank / Credit, কোন Account এ, কত বাকি)
 * আর Supplier কে কত দিতে হবে / দেওয়া হয়েছে। লাভ ও Supplier Rate শুধু Admin দেখেন (Backend ও পাঠায় না)
 */
const SendDetailModal = ({ sendId, onClose }) => {
  const { hasPermission } = useAuth();
  const canSeeCost = hasPermission("rate:update");
  const { data, isLoading } = useGetSingleSendQuery(sendId, { skip: !sendId });
  const s = data?.data;
  const currency = s?.currency || (s && { code: s.currencyCode, quoteStyle: s.quoteStyle });
  const decimals = s?.currency?.decimals ?? 2;
  const isPosted = s?.status === "Posted";
  const payments = s ? getSendPayments(s) : [];
  const onCreditAtSend = s ? Math.round((Number(s.customerTotalMYR) - upfrontPaid(s)) * 100) / 100 : 0;

  return (
    <Modal
      isOpen={Boolean(sendId)}
      onClose={onClose}
      title={s ? `Send ${s.sendNumber}` : "Send"}
      description={s ? `${formatDateTime(s.createdAt || s.date)}${s.createdBy?.name ? ` · by ${s.createdBy.name}` : ""}` : undefined}
      size="xl"
      footer={
        s &&
        s.status !== "Draft" && (
          <Link href={`/pos/send/${s._id}/receipt`} onClick={onClose} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <ReceiptText className="h-4 w-4" />
            View receipt
          </Link>
        )
      }
    >
      {isLoading || !s ? (
        <PageLoader className="h-48" />
      ) : (
        <div className="space-y-4">
          {/* উপরে — কে, কাকে, কত */}
          <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Sender</p>
              <p className="font-semibold text-slate-900">{s.customer?.name}</p>
              <p className="text-xs text-slate-500">
                {[s.customer?.phone, s.customer?.nationality && getCountryName(s.customer.nationality)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Receiver</p>
              <p className="font-semibold text-slate-900">{s.receiverBankDetails?.name}</p>
              <p className="text-xs text-slate-500">{[s.receiverBankDetails?.bank, s.receiverBankDetails?.account].filter(Boolean).join(" · ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Amount</p>
              <p className="font-semibold tabular-nums text-slate-900">
                {s.currencyCode} {formatNumber(s.foreignAmount, decimals)}
              </p>
              <p className="text-xs text-slate-500">{describeRate(s.customerRate, currency)}</p>
              <p className="text-xs text-slate-400">{describeInverse(s.customerRate, currency)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Customer কীভাবে দিলেন */}
            <SideCard
              icon={ArrowDownCircle}
              title="Customer payment"
              status={isPosted ? s.customerPaymentStatus : s.status}
              action={
                isPosted &&
                s.customerDueAmount > 0 &&
                hasPermission("paymentIn:create") && (
                  <Link href="/pos/payment-in" onClick={onClose} className={actionLink}>
                    Receive payment
                  </Link>
                )
              }
            >
              <Line label="Amount" value={formatMoney(Number(s.customerTotalMYR) - Number(s.customerFee || 0))} />
              <Line label="Service fee" value={formatMoney(s.customerFee)} />
              <Line label="Total" value={formatMoney(s.customerTotalMYR)} strong />
              {/* প্রতিটা Payment লাইন — কোন পদ্ধতিতে, কোন Drawer / Bank এ, কত (Cash এ ফেরত সহ) */}
              {payments.map((p, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-1.5 text-sm">
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <PaymentMethodBadge method={p.method} />
                      <span className="truncate text-slate-600">{p.account?.name || "—"}</span>
                    </span>
                    {p.tendered > 0 && p.change > 0 && (
                      <span className="text-xs text-slate-500">
                        Received {formatMoney(p.tendered)} · change {formatMoney(p.change)}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-slate-800">{formatMoney(p.amount)}</span>
                </div>
              ))}
              {onCreditAtSend > 0 && (
                <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    <PaymentMethodBadge method="Credit" />
                    <span className="truncate text-slate-600">{(s.customerReceivableAccount || s.customerPaymentAccount)?.name || "—"}</span>
                  </span>
                  <span className="tabular-nums text-slate-800">{formatMoney(onCreditAtSend)}</span>
                </div>
              )}
              <Line label="Received" value={formatMoney(s.customerPaidAmount)} tone="text-emerald-700" />
              <Line label="To collect" value={formatMoney(s.customerDueAmount)} strong tone={s.customerDueAmount > 0 ? "text-rose-600" : "text-slate-400"} />
            </SideCard>

            {/* Supplier কে কত */}
            <SideCard
              icon={ArrowUpCircle}
              title={`Supplier · ${s.supplier?.name || ""}`}
              status={isPosted ? s.supplierPaymentStatus : undefined}
              action={
                isPosted &&
                s.supplierDueAmount > 0 &&
                hasPermission("paymentOut:create") && (
                  <Link href="/pos/payment-out" onClick={onClose} className={actionLink}>
                    Pay supplier
                  </Link>
                )
              }
            >
              {canSeeCost && (
                <>
                  <Line label="Supplier rate" value={<RateDisplay rate={s.supplierRate} currency={currency} className="items-end" />} />
                  <Line label="Supplier fee" value={formatMoney(s.supplierFee)} />
                  <Line label="Supplier total" value={formatMoney(s.supplierTotalMYR)} strong />
                  {/* Payment Out → Settle in full: Supplier বেশি (+) / কম (−) নিয়েছিল */}
                  {Number(s.supplierAdjustment) !== 0 && s.supplierAdjustment != null && (
                    <Line
                      label={s.supplierAdjustment > 0 ? "Supplier took more" : "Supplier took less"}
                      value={`${s.supplierAdjustment > 0 ? "+" : "−"} ${formatMoney(Math.abs(s.supplierAdjustment))}`}
                      tone={s.supplierAdjustment > 0 ? "text-rose-600" : "text-emerald-700"}
                    />
                  )}
                </>
              )}
              <Line label="Payable account" value={s.supplierPayableAccount?.name || "—"} />
              <Line label="Paid to supplier" value={formatMoney(s.supplierPaidAmount)} tone="text-emerald-700" />
              <Line label="Still to pay" value={formatMoney(s.supplierDueAmount)} strong tone={s.supplierDueAmount > 0 ? "text-amber-700" : "text-slate-400"} />
            </SideCard>
          </div>

          {canSeeCost && typeof s.profitAmount === "number" && (
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${s.profitAmount >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
              <span className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4" />
                Profit on this send
              </span>
              <span className="text-lg font-semibold tabular-nums">{formatMoney(s.profitAmount)}</span>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Status: {s.status}
            {s.journal?.journalNumber ? ` · Journal ${s.journal.journalNumber}` : ""}
            {s.rateOverriddenBy ? ` · Rate changed from board ${s.boardRate}` : ""}
          </p>
        </div>
      )}
    </Modal>
  );
};

export default SendDetailModal;
