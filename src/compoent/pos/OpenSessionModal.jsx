"use client";
import { useGetAllBankAccountsQuery } from "@/redux/features/bankAccount/bankAccountApi";
import { useOpenCashierSessionMutation } from "@/redux/features/pos/cashierSessionApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Button from "../ui/Button";


const OpenSessionModal = ({ isOpen, onClose }) => {
  const { data: bankAccountData } = useGetAllBankAccountsQuery({ limit: 100 });
  const [openCashierSession, { isLoading }] = useOpenCashierSessionMutation();

  const cashAccounts = (bankAccountData?.data?.data || []).filter((ba) => ba.accountType === "Cash");

  const [cashAccount, setCashAccount] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setCashAccount("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cashAccount) {
      setError("Please select a cash drawer");
      return;
    }

    try {
      await openCashierSession({ cashAccount, clientRequestId: crypto.randomUUID() }).unwrap();
      toast.success("Cashier session opened successfully");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to open session");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Open Cashier Session">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="cashAccount"
          label="Cash Drawer"
          required
          value={cashAccount}
          onChange={(e) => {
            setCashAccount(e.target.value);
            setError("");
          }}
          error={error}
        >
          <option value="">Select cash drawer</option>
          {cashAccounts.map((ba) => (
            <option key={ba._id} value={ba.account?._id}>
              {ba.account?.name}
            </option>
          ))}
        </Select>

        {cashAccounts.length === 0 && (
          <p className="text-xs text-amber-600">
            No Cash-type account registered yet. Go to Bank Accounts to add one.
          </p>
        )}

        <p className="text-xs text-slate-500">
          The current system balance of this account will be recorded as your opening balance.
        </p>

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Open Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OpenSessionModal;