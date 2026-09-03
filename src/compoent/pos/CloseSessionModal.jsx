"use client";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useCloseCashierSessionMutation } from "@/redux/features/pos/cashierSessionApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";


const CloseSessionModal = ({ isOpen, onClose, session }) => {
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const [closeCashierSession, { isLoading }] = useCloseCashierSessionMutation();

  const accounts = accountData?.data?.data || [];
  const varianceAccounts = accounts.filter((a) => a.type === "Income" || a.type === "Expense");

  const [physicalCash, setPhysicalCash] = useState("");
  const [varianceAccount, setVarianceAccount] = useState("");
  const [errors, setErrors] = useState({});

  const currentSystemBalance = session?.cashAccount?.currentBalance || 0;
  const estimatedVariance = physicalCash !== "" ? Number(physicalCash) - currentSystemBalance : null;

  const handleClose = () => {
    setPhysicalCash("");
    setVarianceAccount("");
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (physicalCash === "" || isNaN(Number(physicalCash)) || Number(physicalCash) < 0) {
      newErrors.physicalCash = "Enter the counted physical cash amount";
    }
    if (estimatedVariance !== null && estimatedVariance !== 0 && !varianceAccount) {
      newErrors.varianceAccount = "A variance account is required since there is a mismatch";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await closeCashierSession({
        id: session._id,
        data: { closingPhysicalCash: Number(physicalCash), varianceAccount: varianceAccount || undefined },
      }).unwrap();
      toast.success("Cashier session closed successfully");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to close session");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Close Cashier Session">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
          System balance (closing): <span className="font-semibold text-slate-900">৳ {Number(currentSystemBalance).toFixed(2)}</span>
        </div>

        <Input
          id="physicalCash"
          type="number"
          step="0.01"
          label="Physical Cash Counted"
          required
          value={physicalCash}
          onChange={(e) => {
            setPhysicalCash(e.target.value);
            setErrors((prev) => ({ ...prev, physicalCash: "" }));
          }}
          error={errors.physicalCash}
        />

        {estimatedVariance !== null && (
          <div
            className={`rounded-lg px-3.5 py-2.5 text-sm font-semibold ${
              estimatedVariance === 0
                ? "bg-emerald-50 text-emerald-700"
                : estimatedVariance > 0
                ? "bg-indigo-50 text-indigo-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {estimatedVariance === 0
              ? "✓ Matches exactly, no variance"
              : `Variance: ${estimatedVariance > 0 ? "+" : ""}৳ ${estimatedVariance.toFixed(2)} (${
                  estimatedVariance > 0 ? "Overage" : "Shortage"
                })`}
          </div>
        )}

        {estimatedVariance !== null && estimatedVariance !== 0 && (
          <Select
            id="varianceAccount"
            label="Cash Over/Short Account"
            required
            value={varianceAccount}
            onChange={(e) => {
              setVarianceAccount(e.target.value);
              setErrors((prev) => ({ ...prev, varianceAccount: "" }));
            }}
            error={errors.varianceAccount}
          >
            <option value="">Select account</option>
            {varianceAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} — {a.name} ({a.type})
              </option>
            ))}
          </Select>
        )}

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" isLoading={isLoading}>
            Close Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CloseSessionModal;