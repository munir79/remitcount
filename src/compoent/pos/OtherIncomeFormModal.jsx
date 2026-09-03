"use client";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAllCustomersQuery } from "@/redux/features/customer/customerApi";
import { useCreateOtherIncomeMutation } from "@/redux/features/pos/otherIncomeApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";


const initialFormState = {
  incomeType: "",
  customer: "",
  description: "",
  sellAmount: "",
  costAmount: "0",
  otherCost: "0",
  paymentTerm: "Cash",
  incomeReceivingAccount: "",
  incomeAccount: "",
  costPaymentAccount: "",
  costExpenseAccount: "",
};

const OtherIncomeFormModal = ({ isOpen, onClose }) => {
  const { data: customerData } = useGetAllCustomersQuery({ limit: 500 });
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const [createOtherIncome, { isLoading }] = useCreateOtherIncomeMutation();

  const customers = customerData?.data?.data || [];
  const accounts = accountData?.data?.data || [];
  const assetAccounts = accounts.filter((a) => a.type === "Asset");
  const incomeAccounts = accounts.filter((a) => a.type === "Income");
  const expenseAccounts = accounts.filter((a) => a.type === "Expense");

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const sellAmount = Number(formData.sellAmount) || 0;
  const costAmount = Number(formData.costAmount) || 0;
  const otherCost = Number(formData.otherCost) || 0;
  const totalCost = costAmount + otherCost;
  const profit = sellAmount - totalCost;
  const hasCost = totalCost > 0;

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
    if (!formData.incomeType.trim()) newErrors.incomeType = "Required";
    if (!sellAmount) newErrors.sellAmount = "Required";
    if (!formData.incomeReceivingAccount) newErrors.incomeReceivingAccount = "Required";
    if (!formData.incomeAccount) newErrors.incomeAccount = "Required";
    if (hasCost) {
      if (!formData.costPaymentAccount) newErrors.costPaymentAccount = "Required when cost > 0";
      if (!formData.costExpenseAccount) newErrors.costExpenseAccount = "Required when cost > 0";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createOtherIncome({
        incomeType: formData.incomeType,
        customer: formData.customer || undefined,
        description: formData.description,
        sellAmount,
        costAmount,
        otherCost,
        paymentTerm: formData.paymentTerm,
        incomeReceivingAccount: formData.incomeReceivingAccount,
        incomeAccount: formData.incomeAccount,
        costPaymentAccount: hasCost ? formData.costPaymentAccount : undefined,
        costExpenseAccount: hasCost ? formData.costExpenseAccount : undefined,
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Other Income created as Draft");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create record");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Other Income" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input id="incomeType" name="incomeType" label="Income Type" required placeholder="e.g. Service Fee" value={formData.incomeType} onChange={handleChange} error={errors.incomeType} />
          <Select id="customer" name="customer" label="Customer (Optional)" value={formData.customer} onChange={handleChange}>
            <option value="">Walk-in customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Input id="description" name="description" label="Description" placeholder="Optional" value={formData.description} onChange={handleChange} />

        <div className="grid grid-cols-2 gap-4">
          <Input id="sellAmount" name="sellAmount" type="number" step="0.01" label="Sell Amount" required value={formData.sellAmount} onChange={handleChange} error={errors.sellAmount} />
          <Select id="paymentTerm" name="paymentTerm" label="Payment Term" value={formData.paymentTerm} onChange={handleChange}>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select id="incomeReceivingAccount" name="incomeReceivingAccount" label="Receiving Account" required value={formData.incomeReceivingAccount} onChange={handleChange} error={errors.incomeReceivingAccount}>
            <option value="">Select account</option>
            {assetAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} — {a.name}
              </option>
            ))}
          </Select>
          <Select id="incomeAccount" name="incomeAccount" label="Income Account" required value={formData.incomeAccount} onChange={handleChange} error={errors.incomeAccount}>
            <option value="">Select account</option>
            {incomeAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} — {a.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-3 text-sm font-bold text-slate-800">Cost (Optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input id="costAmount" name="costAmount" type="number" step="0.01" label="Cost Amount" value={formData.costAmount} onChange={handleChange} />
            <Input id="otherCost" name="otherCost" type="number" step="0.01" label="Other Cost" value={formData.otherCost} onChange={handleChange} />
          </div>
          {hasCost && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Select id="costPaymentAccount" name="costPaymentAccount" label="Cost Payment Account" required value={formData.costPaymentAccount} onChange={handleChange} error={errors.costPaymentAccount}>
                <option value="">Select account</option>
                {assetAccounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </Select>
              <Select id="costExpenseAccount" name="costExpenseAccount" label="Cost Expense Account" required value={formData.costExpenseAccount} onChange={handleChange} error={errors.costExpenseAccount}>
                <option value="">Select account</option>
                {expenseAccounts.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className={`rounded-lg px-4 py-3 text-sm font-bold ${profit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          Estimated Profit: ৳ {profit.toFixed(2)}
        </div>

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

export default OtherIncomeFormModal;