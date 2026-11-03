"use client";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useCreateCurrencyStockMutation } from "@/redux/features/pos/currencyStockApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import SetupNotice from "../ui/SetupNotice";


const CurrencyStockFormModal = ({ isOpen, onClose }) => {
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const [createCurrencyStock, { isLoading }] = useCreateCurrencyStockMutation();

  const accounts = accountData?.data?.data || [];
  const assetAccounts = accounts.filter((a) => a.type === "Asset");
  const expenseAccounts = accounts.filter((a) => a.type === "Expense");

  const [formData, setFormData] = useState({ currencyCode: "", inventoryAccount: "", cogsAccount: "" });
  const [errors, setErrors] = useState({});
  // Default — "Foreign Currency Inventory" আর "Currency Exchange Cost" (System Account)
  const inventoryAccount = formData.inventoryAccount || assetAccounts.find((a) => a.systemKey === "CURRENCY_INVENTORY")?._id || "";
  const cogsAccount = formData.cogsAccount || expenseAccounts.find((a) => a.systemKey === "FX_COST")?._id || "";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleClose = () => {
    setFormData({ currencyCode: "", inventoryAccount: "", cogsAccount: "" });
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.currencyCode.trim()) newErrors.currencyCode = "Required";
    if (!inventoryAccount) newErrors.inventoryAccount = "Required";
    if (!cogsAccount) newErrors.cogsAccount = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createCurrencyStock({ ...formData, inventoryAccount, cogsAccount, clientRequestId: crypto.randomUUID() }).unwrap();
      toast.success("Currency registered successfully");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to register currency");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register Currency">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="currencyCode" name="currencyCode" label="Currency Code" required placeholder="e.g. IDR" value={formData.currencyCode} onChange={handleChange} error={errors.currencyCode} />

        <Select id="inventoryAccount" name="inventoryAccount" label="Currency Stock Account (Asset)" required value={inventoryAccount} onChange={handleChange} error={errors.inventoryAccount}>
          <option value="">Select account</option>
          {assetAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>

        <Select id="cogsAccount" name="cogsAccount" label="Currency COGS Account (Expense)" required value={cogsAccount} onChange={handleChange} error={errors.cogsAccount}>
          <option value="">Select account</option>
          {expenseAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>

        {accountData && (assetAccounts.length === 0 || expenseAccounts.length === 0) && (
          <SetupNotice
            message="You need an asset account for the currency stock (e.g. “Currency Inventory”) and an expense account for its cost."
            actionLabel="Open Chart of Accounts"
            href="/accounts"
            permission="account:create"
            adminHint="Ask your admin to create them."
            onNavigate={handleClose}
          />
        )}

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Register
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CurrencyStockFormModal;