"use client";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Folder, Lock, Trash2 } from "lucide-react";
import { useCreateAccountMutation, useDeleteAccountMutation, useSuggestNextCodeQuery, useUpdateAccountMutation } from "@/redux/features/account/accountApi";
import { handleEnterToNext } from "@/hooks/useEnterToNext";
import { formatMoney } from "@/lib/format";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Combobox from "../ui/Combobox";
import Button from "../ui/Button";
import SegmentedControl from "../ui/SegmentedControl";
import ConfirmDialog from "../ui/ConfirmDialog";

const FORM_ID = "account-form";
export const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"];

const KIND_OPTIONS = [
  { value: "account", label: "Account", icon: FileText },
  { value: "folder", label: "Folder", icon: Folder },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// প্রতিটা Type এর জন্য উদাহরণ — নতুন Admin বুঝতে পারেন কী লিখবেন
const NAME_EXAMPLE = {
  Asset: "e.g. Office Laptop",
  Liability: "e.g. Bank Loan",
  Equity: "e.g. Partner's Capital",
  Income: "e.g. Commission Income",
  Expense: "e.g. Staff Meals",
};

const initialState = (account, defaults) =>
  account
    ? { name: account.name, code: account.code, type: account.type, parent: account.parent || "", kind: account.isGroup ? "folder" : "account", openingBalance: "0", status: account.status || "active" }
    : { name: "", code: "", type: defaults?.type || "Asset", parent: defaults?.parent || "", kind: "account", openingBalance: "", status: "active" };

/**
 * ✅ Account / Folder — নতুন অথবা Edit
 *  account দিলে Edit: নাম, Code, Folder, Active/Inactive (System Account এর Code/Folder বদলায় না), Delete
 *  defaults: { type, parent } — যেমন একটা Folder এর ভেতরে "Add" চাপলে
 *  groupAccounts — Tree এর সব Folder (Parent বাছাই)
 *  Parent পাল্টালে Code নিজে থেকে সেই Folder এর পরেরটা (1100 → 1101)
 *  Parent পরিবর্তনের পরে Parent কে key দিয়ে আবার Mount করা হয় (Page থেকে)
 */
const AccountFormModal = ({ isOpen, onClose, groupAccounts = [], account = null, defaults = null }) => {
  const isEdit = Boolean(account);
  const isSystem = Boolean(account?.isSystemAccount);
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation();

  const [formData, setFormData] = useState(() => initialState(account, defaults));
  const [codeTouched, setCodeTouched] = useState(false); // User নিজে Code লিখেছেন কিনা
  const [errors, setErrors] = useState({});
  const parentChanged = isEdit && String(formData.parent || "") !== String(account.parent || "");
  const hasChildren = Boolean(account?.children?.length);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // বাছা Folder এর ভেতরের পরের Code আর অনুমোদিত পরিসর — নতুন হলে সবসময়, Edit এ Folder বদলালে
  const { data: suggestion } = useSuggestNextCodeQuery(
    { type: formData.type, ...(formData.parent ? { parent: formData.parent } : {}), ...(isEdit ? { exclude: account._id } : {}) },
    { skip: !isOpen || isSystem, refetchOnMountOrArgChange: true }
  );
  const suggested = suggestion?.data?.suggestedCode || "";
  const allowed = suggestion?.data?.allowed;
  const parentName = groupAccounts.find((g) => g._id === formData.parent)?.name;
  // Edit এ অন্য Folder এ সরালে (নিজে Code না লিখলে) নতুন Folder এর পরের Code
  const code = isEdit ? (parentChanged && !codeTouched ? suggested : formData.code) : formData.code !== "" ? formData.code : suggested;

  // নিজের ভেতরে নিজেকে রাখা যায় না — Edit এ নিজের Folder বাদ
  const parentOptions = groupAccounts
    .filter((g) => g.type === formData.type && g._id !== account?._id)
    .map((g) => ({ value: g._id, label: g.name, sub: g.code }));

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setFormData(initialState(account, defaults));
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!formData.name.trim()) next.name = "Enter the account name";
    if (!/^\d{4}$/.test(code.trim())) next.code = "Enter a 4-digit code";
    else if (allowed && (Number(code) < allowed.from || Number(code) > allowed.to)) {
      next.code = `Must be between ${allowed.from} and ${allowed.to}${parentName ? ` inside ${parentName}` : ""}`;
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    const isGroup = formData.kind === "folder";
    try {
      if (isEdit) {
        await updateAccount({
          id: account._id,
          data: {
            name: formData.name.trim(),
            ...(isSystem ? {} : { code: code.trim(), parent: formData.parent || null }),
            status: formData.status,
          },
        }).unwrap();
        toast.success(`${account.name} updated`);
      } else {
        await createAccount({
          name: formData.name.trim(),
          code: code.trim(),
          type: formData.type,
          parent: formData.parent || null,
          isGroup,
          openingBalance: isGroup ? 0 : Number(formData.openingBalance) || 0,
        }).unwrap();
        toast.success(`${isGroup ? "Folder" : "Account"} created`);
      }
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save account");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount(account._id).unwrap();
      toast.success(`${account.name} deleted`);
      setConfirmDelete(false);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete");
      setConfirmDelete(false);
    }
  };

  const isFolder = formData.kind === "folder";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={isEdit ? `Edit ${account.isGroup ? "folder" : "account"}` : "New account"}
        description={isEdit ? `${account.code} · ${account.type}` : "Add an account or a folder to the chart of accounts"}
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            {isEdit && !isSystem ? (
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)} className="text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" form={FORM_ID} isLoading={isCreating || isUpdating}>
                {isEdit ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit} onKeyDown={handleEnterToNext} noValidate className="grid gap-4 sm:grid-cols-2">
          {isSystem && (
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:col-span-2">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              System account — the software posts to it automatically. You can rename it, but its code and folder stay fixed and it can&apos;t be deleted.
            </p>
          )}
          {!isEdit && (
            <>
              <SegmentedControl label="Kind" value={formData.kind} onChange={(v) => setField("kind", v)} options={KIND_OPTIONS} />
              <Select
                id="type"
                label="Type"
                value={formData.type}
                // Type বদলালে Folder ও Code খালি — নতুন Type এর Suggested Code বসে
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value, parent: "", code: "" }))}
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </>
          )}
          <Combobox
            id="parent"
            label="Inside folder"
            value={formData.parent}
            // Folder বদলালে Code আবার Suggest হয়
            onChange={(v) => {
              setFormData((prev) => ({ ...prev, parent: v, ...(isEdit ? { code: account.code } : { code: "" }) }));
              setCodeTouched(false);
              setErrors((prev) => ({ ...prev, code: "" }));
            }}
            options={[{ value: "", label: "None (top level)" }, ...parentOptions]}
            disabled={isSystem || (isEdit && hasChildren)}
            hint={isEdit && hasChildren && !isSystem ? "Move the accounts out of this folder first to move it" : parentChanged ? "A new code from that folder is suggested below" : undefined}
            className="sm:col-span-2"
          />
          <Input
            id="code"
            label="Code"
            required
            inputMode="numeric"
            maxLength={4}
            value={code}
            onChange={(e) => {
              setField("code", e.target.value.replace(/\D/g, ""));
              setCodeTouched(true);
            }}
            error={errors.code}
            hint={
              allowed
                ? `Allowed ${allowed.from}–${allowed.to}${parentName ? ` in ${parentName}` : ` for ${formData.type}`}`
                : isSystem
                  ? "System code — fixed"
                  : undefined
            }
            disabled={isSystem || (isEdit && hasChildren)}
          />
          <Input id="name" label="Name" required placeholder={NAME_EXAMPLE[formData.type]} value={formData.name} onChange={(e) => setField("name", e.target.value)} error={errors.name} />
          {!isEdit && !isFolder && (
            <Input
              id="openingBalance"
              type="number"
              inputMode="decimal"
              step="any"
              label="Opening balance"
              prefix="RM"
              placeholder="0.00"
              value={formData.openingBalance}
              onChange={(e) => setField("openingBalance", e.target.value)}
              hint="Balance before you started using the software — recorded against Opening Balance Equity"
              className="sm:col-span-2"
            />
          )}
          {isEdit && !isSystem && (
            <SegmentedControl label="Status" value={formData.status} onChange={(v) => setField("status", v)} options={STATUS_OPTIONS} />
          )}
          {isEdit && !account.isGroup && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-slate-700">Current balance</span>
              <span className="flex h-10 items-center text-sm font-semibold tabular-nums text-slate-900">{formatMoney(account.currentBalance)}</span>
            </div>
          )}
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        title={`Delete ${account?.name || ""}`}
        description="Only accounts that were never used can be deleted. Used accounts can be set to Inactive instead."
      />
    </>
  );
};

export default AccountFormModal;
