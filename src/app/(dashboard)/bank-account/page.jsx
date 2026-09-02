"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Landmark } from "lucide-react";
import { useCreateBankAccountMutation, useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Modal from "@/compoent/ui/Modal";
import Select from "@/compoent/ui/Select";
import Input from "@/compoent/ui/Input";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Badge from "@/compoent/ui/Badge";


const COLUMNS = [
  { key: "name", label: "Account" },
  { key: "type", label: "Type" },
  { key: "bank", label: "Bank Details" },
  { key: "balance", label: "Balance" },
  { key: "status", label: "Status" },
];

const initialFormState = {
  account: "",
  accountType: "Bank",
  bankName: "",
  bankAccountNumber: "",
  bankBranchName: "",
  accountHolderName: "",
  location: "",
  allowNegativeBalance: false,
};

const BankAccountPage = () => {
  const { data, isLoading, refetch } = useGetAllBankAccountsQuery({ limit: 100 });
  const { data: accountData } = useGetAllAccountsQuery({ type: "Asset", isGroup: false, limit: 500 });
  const [createBankAccount, { isLoading: isCreating }] = useCreateBankAccountMutation();

  const bankAccounts = data?.data?.data || [];
  const assetAccounts = accountData?.data?.data || [];

  useSocketEvent("company-data-updated", (payload) => {
    if (payload.module === "BankAccount") refetch();
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.account) newErrors.account = "Chart of Accounts link is required";
    if (formData.accountType === "Bank" && !formData.bankName) newErrors.bankName = "Bank name is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createBankAccount({
        ...formData,
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Bank/Cash account created successfully");
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create account");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Bank Accounts</h1>
          <p className="text-sm text-neutral-500">Cash drawers and bank accounts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : bankAccounts.length === 0 ? (
        <EmptyState icon={Landmark} title="No bank/cash accounts yet" description="Register your first cash drawer or bank account" />
      ) : (
        <Table columns={COLUMNS}>
          {bankAccounts.map((ba) => (
            <tr key={ba._id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 font-medium text-neutral-900">{ba.account?.name}</td>
              <td className="px-4 py-3">
                <Badge variant={ba.accountType === "Cash" ? "warning" : "primary"}>{ba.accountType}</Badge>
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {ba.accountType === "Bank" ? `${ba.bankName || "—"} — ${ba.bankAccountNumber || "—"}` : ba.location || "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900">
                ৳ {Number(ba.account?.currentBalance || 0).toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <Badge variant={ba.status === "active" ? "success" : "neutral"}>{ba.status}</Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Bank/Cash Account">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select id="account" name="account" label="Chart of Accounts" value={formData.account} onChange={handleChange} error={errors.account}>
            <option value="">Select an Asset account</option>
            {assetAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} — {a.name}
              </option>
            ))}
          </Select>

          <Select id="accountType" name="accountType" label="Type" value={formData.accountType} onChange={handleChange}>
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
          </Select>

          {formData.accountType === "Bank" ? (
            <>
              <Input id="bankName" name="bankName" label="Bank Name" value={formData.bankName} onChange={handleChange} error={errors.bankName} />
              <div className="grid grid-cols-2 gap-4">
                <Input id="bankAccountNumber" name="bankAccountNumber" label="Account Number" value={formData.bankAccountNumber} onChange={handleChange} />
                <Input id="bankBranchName" name="bankBranchName" label="Branch" value={formData.bankBranchName} onChange={handleChange} />
              </div>
              <Input id="accountHolderName" name="accountHolderName" label="Account Holder Name" value={formData.accountHolderName} onChange={handleChange} />
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  name="allowNegativeBalance"
                  checked={formData.allowNegativeBalance}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600"
                />
                Allow overdraft (negative balance)
              </label>
            </>
          ) : (
            <Input id="location" name="location" label="Location (e.g. Head Office Counter)" value={formData.location} onChange={handleChange} />
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BankAccountPage;