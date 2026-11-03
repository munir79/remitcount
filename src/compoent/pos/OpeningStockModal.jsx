"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useCreateOpeningStockMutation } from "@/redux/features/pos/currencyStockApi";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import { describeInverse, describeRate, foreignToBase, rateUnitLabel } from "@/lib/currencyMath";
import { formatMoney, formatNumber } from "@/lib/format";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Combobox from "../ui/Combobox";
import Button from "../ui/Button";
import SetupNotice from "../ui/SetupNotice";

const FORM_ID = "opening-stock-form";
const EMPTY = { currency: "", drawer: "", qty: "", costRate: "", notes: "" };

/**
 * ✅ চালুর দিন হাতে থাকা Foreign Currency — কোন Drawer এ, কত, কত খরচে কেনা ছিল
 * খরচ না জানলে আজকের "We buy" Rate নিজে থেকে বসে (বদলানো যায়)
 * Journal: Foreign Currency Inventory / Opening Balance Equity — Drawer এর RM বদলায় না
 */
const OpeningStockModal = ({ isOpen, onClose }) => {
  const { data: boardData } = useGetRateBoardQuery(undefined, { skip: !isOpen });
  const { data: bankData } = useGetAllBankAccountsQuery({ limit: 100 }, { skip: !isOpen });
  const [createOpening, { isLoading }] = useCreateOpeningStockMutation();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const board = boardData?.data || [];
  const row = board.find((b) => b.currency._id === form.currency);
  const currency = row?.currency;
  const drawers = (bankData?.data?.data || []).filter((b) => b.accountType === "Cash" && b.account && b.status !== "inactive");
  // খরচ না লিখলে আজকের "We buy" Rate
  const costRate = Number(form.costRate) > 0 ? Number(form.costRate) : row?.buyRate || 0;
  const qty = Number(form.qty) || 0;
  const costMYR = currency && costRate > 0 ? foreignToBase(qty, costRate, currency.quoteStyle) : 0;

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setForm(EMPTY);
    setErrors({});
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.currency) next.currency = "Choose the currency";
    if (!form.drawer) next.drawer = "Choose the drawer the notes are in";
    if (!(qty > 0)) next.qty = "Enter how much is in the drawer";
    if (!(costRate > 0)) next.costRate = "Enter the cost rate";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      const res = await createOpening({ currency: form.currency, drawer: form.drawer, qty, costRate, notes: form.notes, clientRequestId: requestId }).unwrap();
      toast.success(`${res.data.openingNumber} — ${currency.code} ${formatNumber(qty, currency.decimals ?? 2)} added`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add opening stock");
      setRequestId(crypto.randomUUID());
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add opening stock"
      description="Foreign currency you already have on the day you start using the software"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isLoading}>
            Add stock
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
        {bankData && drawers.length === 0 && (
          <SetupNotice compact message="No cash drawer yet." actionLabel="Add cash drawer" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin to add one." onNavigate={handleClose} />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Combobox
            id="openingCurrency"
            label="Currency"
            required
            value={form.currency}
            onChange={(v) => setForm((prev) => ({ ...prev, currency: v, costRate: "" }))}
            options={board.map((b) => ({ value: b.currency._id, label: b.currency.code, sub: b.currency.name }))}
            placeholder="Choose"
            searchPlaceholder="Code or name…"
            error={errors.currency}
          />
          <Combobox
            id="openingDrawer"
            label="In which drawer"
            required
            value={form.drawer}
            onChange={(v) => set("drawer", v)}
            options={drawers.map((b) => ({ value: b.account._id, label: b.account.name, sub: [b.location || "Cash drawer", b.branch?.name].filter(Boolean).join(" · ") }))}
            placeholder="Choose drawer"
            error={errors.drawer}
          />
          <Input
            id="openingQty"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            label="Amount on hand"
            required
            suffix={currency?.code}
            value={form.qty}
            onChange={(e) => set("qty", e.target.value)}
            error={errors.qty}
            disabled={!currency}
          />
          <Input
            id="openingCostRate"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            label={`Cost rate${currency ? ` (${rateUnitLabel(currency)})` : ""}`}
            placeholder={row?.buyRate ? String(row.buyRate) : ""}
            value={form.costRate}
            onChange={(e) => set("costRate", e.target.value)}
            error={errors.costRate}
            hint={
              currency && costRate > 0
                ? `${Number(form.costRate) > 0 ? "" : "Today's buy rate · "}${describeRate(costRate, currency)} · ${describeInverse(costRate, currency)}`
                : "What it cost when it was bought — leave empty to use today's buy rate"
            }
            disabled={!currency}
          />
        </div>
        <Input id="openingNotes" label="Note" placeholder="e.g. Count on go-live day" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        {currency && qty > 0 && costRate > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">
              Stock value ({currency.code} {formatNumber(qty, currency.decimals ?? 2)})
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{formatMoney(costMYR)}</span>
          </div>
        )}
        <p className="text-xs text-slate-500">Recorded as the owner&apos;s opening stock (Opening Balance Equity). The drawer&apos;s RM does not change.</p>
      </form>
    </Modal>
  );
};

export default OpeningStockModal;
