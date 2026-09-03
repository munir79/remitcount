"use client";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useCreatePosExpenseMutation } from "@/redux/features/pos/posExpenseApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Input from "../ui/Input";
import Button from "../ui/Button";


const initialFormState = {
  expenseType: "",
  classification: "Direct",
  amount: "",
  expenseAccount: "",
  paymentAccount: "",
  description: "",
};

const PosExpenseFormModal = ({ isOpen, onClose }) => {
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const [createPosExpense, { isLoading }] = useCreatePosExpenseMutation();

  const accounts = accountData?.data?.data || [];
  const expenseAccounts = accounts.filter((a) => a.type === "Expense");
  const assetAccounts = accounts.filter((a) => a.type === "Asset");

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.expenseType.trim()) newErrors.expenseType = "Required";
    if (!formData.amount || Number(formData.amount) <= 0) newErrors.amount = "Required";
    if (!formData.expenseAccount) newErrors.expenseAccount = "Required";
    if (!formData.paymentAccount) newErrors.paymentAccount = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createPosExpense({
        ...formData,
        amount: Number(formData.amount),
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Expense created as Draft");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create expense");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Expense">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="expenseType" name="expenseType" label="Expense Type" required placeholder="e.g. Office Rent" value={formData.expenseType} onChange={handleChange} error={errors.expenseType} />

        <div className="grid grid-cols-2 gap-4">
          <Select id="classification" name="classification" label="Classification" value={formData.classification} onChange={handleChange}>
            <option value="Direct">Direct</option>
            <option value="Admin">Admin</option>
          </Select>
          <Input id="amount" name="amount" type="number" step="0.01" label="Amount" required value={formData.amount} onChange={handleChange} error={errors.amount} />
        </div>

        <Select id="expenseAccount" name="expenseAccount" label="Expense Account" required value={formData.expenseAccount} onChange={handleChange} error={errors.expenseAccount}>
          <option value="">Select account</option>
          {expenseAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>

        <Select id="paymentAccount" name="paymentAccount" label="Payment Account" required value={formData.paymentAccount} onChange={handleChange} error={errors.paymentAccount}>
          <option value="">Select account</option>
          {assetAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>

        <Input id="description" name="description" label="Description" placeholder="Optional" value={formData.description} onChange={handleChange} />

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PosExpenseFormModal;