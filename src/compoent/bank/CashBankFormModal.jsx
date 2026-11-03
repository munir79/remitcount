"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Landmark, Link2, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateBankAccountMutation, useGetNewBankAccountPreviewQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetAllBranchesQuery } from "@/redux/features/branch/branchApi";
import { handleEnterToNext } from "@/hooks/useEnterToNext";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Combobox from "../ui/Combobox";
import SegmentedControl from "../ui/SegmentedControl";
import FormModalFooter from "../ui/FormModalFooter";

const FORM_ID = "cash-bank-form";

const TYPE_OPTIONS = [
  { value: "Cash", label: "Cash drawer", icon: Wallet },
  { value: "Bank", label: "Bank account", icon: Landmark },
];

const initialState = (type = "Cash") => ({
  accountType: type,
  name: "",
  account: "", // Advanced — আগে থেকে থাকা Account
  bankName: "",
  bankAccountNumber: "",
  bankBranchName: "",
  accountHolderName: "",
  location: "",
  branch: "",
  openingBalance: "",
  allowNegativeBalance: false,
});

/**
 * ✅ নতুন Cash Drawer / Bank — এক ধাপে
 * নাম লিখলেই Chart of Accounts এ ঠিক Folder এর নিচে Account তৈরি হয় (Drawer → "Cash in Hand" 1101…, Bank → "Cash at Bank" 1201…)
 * Advanced: আগে থেকে বানানো Account Link (শুধু সেই Folder এর ভেতরের)
 */
const CashBankFormModal = ({ isOpen, onClose, defaultType = "Cash" }) => {
  const { user } = useAuth();
  const [form, setForm] = useState(() => initialState(defaultType));
  const [useExisting, setUseExisting] = useState(false);
  const [errors, setErrors] = useState({});
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const isBank = form.accountType === "Bank";
  const { data: previewData } = useGetNewBankAccountPreviewQuery(form.accountType, { skip: !isOpen, refetchOnMountOrArgChange: true });
  const { data: branchData } = useGetAllBranchesQuery({ limit: 100 }, { skip: !isOpen });
  const [createBankAccount, { isLoading }] = useCreateBankAccountMutation();

  const preview = previewData?.data;
  const linkable = preview?.linkable || [];
  const branches = branchData?.data?.data || [];
  const needsBranch = !isBank && branches.length > 0 && !user?.branch;

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleChange = (e) => setField(e.target.name, e.target.type === "checkbox" ? e.target.checked : e.target.value);

  const handleClose = () => {
    setForm(initialState(defaultType));
    setUseExisting(false);
    setErrors({});
    setRequestId(crypto.randomUUID());
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (useExisting ? !form.account : !form.name.trim()) next[useExisting ? "account" : "name"] = useExisting ? "Choose an account" : `Name the ${isBank ? "bank account" : "cash drawer"}`;
    if (isBank && !form.bankName.trim()) next.bankName = "Enter the bank name";
    if (needsBranch && !form.branch) next.branch = "Choose the branch";
    if (isBank && form.openingBalance !== "" && !Number.isFinite(Number(form.openingBalance))) next.openingBalance = "Enter a number";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    try {
      await createBankAccount({
        accountType: form.accountType,
        ...(useExisting ? { account: form.account } : { name: form.name.trim() }),
        location: form.location,
        branch: form.branch || undefined,
        ...(isBank
          ? {
              bankName: form.bankName.trim(),
              bankAccountNumber: form.bankAccountNumber,
              bankBranchName: form.bankBranchName,
              accountHolderName: form.accountHolderName,
              allowNegativeBalance: form.allowNegativeBalance,
              openingBalance: Number(form.openingBalance) || 0,
            }
          : {}),
        clientRequestId: requestId,
      }).unwrap();
      toast.success(`${isBank ? "Bank account" : "Cash drawer"} added`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add cash drawer or bank"
      description="Creates its account in the chart of accounts for you"
      size="lg"
      footer={<FormModalFooter formId={FORM_ID} onCancel={handleClose} isLoading={isLoading} submitLabel="Add" />}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} onKeyDown={handleEnterToNext} noValidate className="grid gap-4 sm:grid-cols-2">
        <SegmentedControl
          label="Type"
          value={form.accountType}
          onChange={(v) => {
            setForm((prev) => ({ ...prev, accountType: v, account: "", openingBalance: "" }));
            setErrors({});
          }}
          options={TYPE_OPTIONS}
          className="sm:col-span-2"
        />

        {useExisting ? (
          <Combobox
            id="account"
            label={`Existing account in ${preview ? `${preview.folder.code} ${preview.folder.name}` : "the folder"}`}
            required
            value={form.account}
            onChange={(v) => setField("account", v)}
            options={linkable.map((a) => ({ value: a._id, label: a.name, sub: a.code }))}
            placeholder="Choose an account"
            emptyText={`No unused accounts in ${preview?.folder.name || "this folder"}`}
            error={errors.account}
            className="sm:col-span-2"
          />
        ) : (
          <Input
            id="name"
            name="name"
            label={isBank ? "Account name" : "Drawer name"}
            required
            placeholder={isBank ? "e.g. Maybank Current" : "e.g. Counter 1"}
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            className="sm:col-span-2"
            hint={
              preview && (
                <span className="flex flex-wrap items-center gap-1">
                  New account
                  <span className="font-mono font-medium text-slate-700">{preview.nextCode}</span>
                  <span className="font-medium text-slate-700">{form.name.trim() || (isBank ? "Bank account" : "Cash drawer")}</span>
                  <ArrowRight className="h-3 w-3" />
                  inside {preview.folder.code} {preview.folder.name}
                </span>
              )
            }
          />
        )}

        {isBank && (
          <>
            <Input id="bankName" name="bankName" label="Bank name" required placeholder="e.g. Maybank" value={form.bankName} onChange={handleChange} error={errors.bankName} />
            <Input id="bankAccountNumber" name="bankAccountNumber" label="Account number" value={form.bankAccountNumber} onChange={handleChange} />
            <Input id="bankBranchName" name="bankBranchName" label="Bank branch" value={form.bankBranchName} onChange={handleChange} />
            <Input id="accountHolderName" name="accountHolderName" label="Account holder" value={form.accountHolderName} onChange={handleChange} />
            {!useExisting && (
              <Input
                id="openingBalance"
                name="openingBalance"
                type="number"
                inputMode="decimal"
                step="any"
                label="Balance today"
                prefix="RM"
                placeholder="0.00"
                value={form.openingBalance}
                onChange={handleChange}
                error={errors.openingBalance}
                hint="Money already in this bank — recorded as an opening balance"
                className="sm:col-span-2"
              />
            )}
            <label className="flex items-center gap-2.5 text-sm text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                name="allowNegativeBalance"
                checked={form.allowNegativeBalance}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Allow overdraft (balance may go below zero)
            </label>
          </>
        )}

        {!isBank && (
          <Input id="location" name="location" label="Location" placeholder="e.g. Front counter" value={form.location} onChange={handleChange} className={needsBranch ? "" : "sm:col-span-2"} />
        )}
        {branches.length > 0 && !user?.branch && (
          <Select id="branch" name="branch" label="Branch" required={!isBank} value={form.branch} onChange={handleChange} error={errors.branch} className={isBank ? "sm:col-span-2" : ""}>
            <option value="">{isBank ? "Company-wide" : "Choose branch"}</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}

        {!isBank && (
          <p className="text-xs text-slate-500 sm:col-span-2">
            A drawer starts at RM 0. The cashier counts the cash when opening the session, or you can move cash in from the bank.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs sm:col-span-2">
          <button
            type="button"
            onClick={() => {
              setUseExisting((v) => !v);
              setErrors({});
            }}
            className="flex items-center gap-1.5 font-medium text-indigo-600 hover:text-indigo-800"
          >
            <Link2 className="h-3.5 w-3.5" />
            {useExisting ? "Create a new account instead" : "Advanced: link an existing account"}
          </button>
          <Link href="/accounts" onClick={handleClose} className="font-medium text-slate-500 hover:text-slate-800">
            Open chart of accounts
          </Link>
        </div>
      </form>
    </Modal>
  );
};

export default CashBankFormModal;
