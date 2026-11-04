"use client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, Landmark, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateCashTransferMutation, useGetTransferAccountsQuery } from "@/redux/features/pos/cashTransferApi";
import { useGetRateBoardQuery } from "@/redux/features/rate/rateApi";
import { formatMoney, formatNumber } from "@/lib/format";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Combobox from "../ui/Combobox";
import Button from "../ui/Button";
import SetupNotice from "../ui/SetupNotice";

const FORM_ID = "cash-transfer-form";
const TYPE_META = {
  Cash: { label: "Drawer", icon: Wallet },
  Bank: { label: "Bank", icon: Landmark },
};

/** কোন ধরনের (Drawer / Bank), কে খুলে রেখেছেন, আর এখন কত আছে (RM বা বাছা Currency) */
const AccountHint = ({ acc, available, unit }) => {
  if (!acc) return null;
  const Icon = TYPE_META[acc.type]?.icon || Wallet;
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {TYPE_META[acc.type]?.label}
      {acc.openBy && ` · open by ${acc.openBy}`}
      {available !== null && <> · has {unit === "RM" ? formatMoney(available) : `${unit} ${formatNumber(available)}`}</>}
    </span>
  );
};

/**
 * ✅ টাকা / নোট সরানো
 *  - RM: Drawer ↔ Bank, Drawer → অন্য খোলা Drawer (Cashier — নিজের Drawer থেকে; Manager — যেকোনো) — Journal হয়
 *  - Foreign Currency (USD, BDT…): শুধু Drawer → Drawer (নিজের খোলা Drawer থেকে অন্য খোলা Drawer এ) — Journal ছাড়া
 * Backend সব যাচাই করে; defaultFrom / defaultTo — যেমন Session Bar থেকে খুললে নিজের Drawer
 */
const CashTransferModal = ({ isOpen, onClose, defaultFrom = "", defaultTo = "" }) => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("cashTransfer:manage");
  const { data } = useGetTransferAccountsQuery(undefined, { skip: !isOpen, refetchOnMountOrArgChange: true });
  const { data: boardData } = useGetRateBoardQuery(undefined, { skip: !isOpen });
  const [createTransfer, { isLoading }] = useCreateCashTransferMutation();
  const accounts = data?.data || [];

  const [currency, setCurrency] = useState(""); // "" = RM
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const isForeign = Boolean(currency);
  const currencies = (boardData?.data || []).map((b) => b.currency);
  const currencyDoc = currencies.find((c) => c._id === currency);
  const unit = currencyDoc?.code || "RM";
  const heldIn = (acc) => (acc?.holdings || []).find((h) => h.currency === currency)?.qty || 0;
  // Blind Count — Cashier Drawer এর Balance জানেন না (null); Server যাচাই করে
  const available = (acc) => (!acc ? 0 : acc.hideBalance ? null : isForeign ? heldIn(acc) : acc.balance);

  // কোন জায়গা থেকে / কোথায় দেওয়া যায়
  const fromList = isForeign ? accounts.filter((a) => a.type === "Cash" && a.isOpen && (a.mine || canManage)) : accounts.filter((a) => a.canMoveCash);
  // RM — Cashier নিজের Drawer থেকে Bank এ, বা অন্য খোলা Drawer এ দিতে পারেন
  const toList = isForeign ? accounts.filter((a) => a.type === "Cash" && a.isOpen) : accounts.filter((a) => a.canMoveCash || (a.type === "Cash" && a.isOpen));
  const fromAcc = accounts.find((a) => a._id === from);
  const toAcc = accounts.find((a) => a._id === to);
  const amt = Number(amount) || 0;

  const handleClose = () => {
    setCurrency("");
    setFrom(defaultFrom);
    setTo(defaultTo);
    setAmount("");
    setNotes("");
    setErrors({});
    setRequestId(crypto.randomUUID());
    onClose();
  };

  // RM ↔ Foreign বদলালে আগের বাছাই আর খাটে না — নিজের Drawer থাকলে সেটাই "From"
  const changeCurrency = (value) => {
    setCurrency(value);
    const myDrawer = accounts.find((a) => a.mine && a.isOpen);
    setFrom(value ? myDrawer?._id || "" : defaultFrom);
    setTo(value ? "" : defaultTo);
    setAmount("");
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!from) next.from = isForeign ? "Choose the drawer the notes come from" : "Choose where the cash comes from";
    if (!to) next.to = isForeign ? "Choose the drawer that receives the notes" : "Choose where the cash goes";
    if (from && to && from === to) next.to = "Choose a different place";
    if (!(amt > 0)) next.amount = "Enter the amount";
    else if (fromAcc && available(fromAcc) !== null && amt > available(fromAcc)) next.amount = `Only ${isForeign ? `${unit} ${formatNumber(available(fromAcc))}` : formatMoney(available(fromAcc))} available`;
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      const res = await createTransfer({ fromAccount: from, toAccount: to, amount: amt, notes, ...(isForeign ? { currency } : {}), clientRequestId: requestId }).unwrap();
      toast.success(`${res.data.transferNumber} — ${isForeign ? `${unit} ${formatNumber(amt)}` : formatMoney(amt)} moved to ${toAcc?.name}`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to move");
      setRequestId(crypto.randomUUID());
    }
  };

  const options = (list, exclude) =>
    list
      .filter((a) => a._id !== exclude)
      .map((a) => ({
        value: a._id,
        label: a.name,
        sub: [TYPE_META[a.type]?.label, a.mine ? "your drawer" : a.openBy && `open by ${a.openBy}`, a.branch?.name, a.hideBalance ? "" : isForeign ? `${unit} ${formatNumber(heldIn(a))}` : formatMoney(a.balance)]
          .filter(Boolean)
          .join(" · "),
      }));

  const whatOptions = [{ value: "", label: "RM", sub: "Ringgit — drawer ↔ bank" }, ...currencies.map((c) => ({ value: c._id, label: c.code, sub: `${c.name} notes — drawer → drawer` }))];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Move cash"
      description={isForeign ? `Give ${unit} notes from one open drawer to another` : "Between a cash drawer and a bank, or to another open drawer"}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} isLoading={isLoading}>
            {isForeign ? `Move ${unit}` : "Move cash"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-3">
        <Combobox
          id="transferWhat"
          label="What to move"
          value={currency}
          onChange={(v) => changeCurrency(v || "")}
          options={whatOptions}
          placeholder="RM"
          searchPlaceholder="RM, USD, BDT…"
          hint={isForeign ? "Foreign notes stay inside the shop — no accounting entry, only who holds them changes" : undefined}
        />
        {!isForeign && data && !accounts.some((a) => a.type === "Bank") && (
          <SetupNotice compact message="No bank account is set up yet." actionLabel="Add bank account" href="/bank-account" permission="bankAccount:create" adminHint="Ask your admin to add one." onNavigate={handleClose} />
        )}
        {isForeign && data && toList.filter((a) => a._id !== from).length === 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
            No other drawer has an open session — the person receiving the notes must open their session first.
          </p>
        )}
        <Combobox
          id="transferFrom"
          label="From"
          required
          value={from}
          onChange={(v) => {
            setFrom(v);
            setErrors((p) => ({ ...p, from: "", amount: "" }));
          }}
          options={options(fromList, to)}
          placeholder={isForeign ? "Choose drawer" : "Choose drawer or bank"}
          emptyText={isForeign ? "Open your cashier session first" : "Nothing to choose"}
          error={errors.from}
          hint={<AccountHint acc={fromAcc} available={available(fromAcc)} unit={unit} />}
        />
        <div className="flex justify-center text-slate-300">
          <ArrowDown className="h-5 w-5" />
        </div>
        <Combobox
          id="transferTo"
          label="To"
          required
          value={to}
          onChange={(v) => {
            setTo(v);
            setErrors((p) => ({ ...p, to: "" }));
          }}
          options={options(toList, from)}
          placeholder={isForeign ? "Choose drawer" : "Choose drawer or bank"}
          emptyText="Nothing to choose"
          error={errors.to}
          hint={<AccountHint acc={toAcc} available={available(toAcc)} unit={unit} />}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            id="transferAmount"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            label="Amount"
            required
            prefix={isForeign ? undefined : "RM"}
            suffix={isForeign ? unit : undefined}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setErrors((p) => ({ ...p, amount: "" }));
            }}
            error={errors.amount}
          />
          <Input id="transferNotes" label="Note" placeholder={isForeign ? "e.g. Notes for afternoon shift" : "e.g. Deposit excess cash"} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </form>
    </Modal>
  );
};

export default CashTransferModal;
