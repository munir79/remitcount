"use client";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAllBuyCurrencyQuery } from "@/redux/features/pos/buyCurrencyApi";
import { useCreatePaymentOutMutation } from "@/redux/features/pos/paymentOutApi";
import { useGetAllSendsQuery } from "@/redux/features/pos/sendApi";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Input from "../ui/Input";
import Button from "../ui/Button";


const ENTITY_TYPES = [
  { value: "BuyCurrency", label: "Buy Currency" },
  { value: "Send", label: "Send (Supplier Side)" },
];

const PaymentOutFormModal = ({ isOpen, onClose }) => {
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [errors, setErrors] = useState({});

  const { data: buyData } = useGetAllBuyCurrencyQuery({ status: "Posted", limit: 200 }, { skip: entityType !== "BuyCurrency" });
  const { data: sendData } = useGetAllSendsQuery({ status: "Posted", limit: 200 }, { skip: entityType !== "Send" });
  const { data: accountData } = useGetAllAccountsQuery({ type: "Asset", isGroup: false, limit: 500 });
  const [createPaymentOut, { isLoading }] = useCreatePaymentOutMutation();

  const assetAccounts = accountData?.data?.data || [];

  const entityOptions = useMemo(() => {
    if (entityType === "BuyCurrency") {
      return (buyData?.data?.data || [])
        .filter((r) => r.dueAmount > 0)
        .map((r) => ({ id: r._id, label: `${r.buyNumber} — ${r.customer?.name} (Due: ৳${r.dueAmount})`, due: r.dueAmount }));
    }
    if (entityType === "Send") {
      return (sendData?.data?.data || [])
        .filter((r) => r.supplierDueAmount > 0)
        .map((r) => ({ id: r._id, label: `${r.sendNumber} — ${r.supplier?.name} (Due: ৳${r.supplierDueAmount})`, due: r.supplierDueAmount }));
    }
    return [];
  }, [entityType, buyData, sendData]);

  const selectedEntity = entityOptions.find((o) => o.id === entityId);

  const handleClose = () => {
    setEntityType("");
    setEntityId("");
    setAmount("");
    setPaymentAccount("");
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!entityType) newErrors.entityType = "Required";
    if (!entityId) newErrors.entityId = "Required";
    if (!amount || Number(amount) <= 0) newErrors.amount = "Required";
    if (selectedEntity && Number(amount) > selectedEntity.due) newErrors.amount = `Cannot exceed due amount (৳${selectedEntity.due})`;
    if (!paymentAccount) newErrors.paymentAccount = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createPaymentOut({
        entityType,
        entityId,
        amount: Number(amount),
        paymentAccount,
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Payment Out created as Draft");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create payment");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Payment Out">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          id="entityType"
          label="Against"
          required
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setEntityId("");
            setErrors((prev) => ({ ...prev, entityType: "" }));
          }}
          error={errors.entityType}
        >
          <option value="">Select transaction type</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        {entityType && (
          <Select
            id="entityId"
            label="Select Record"
            required
            value={entityId}
            onChange={(e) => {
              setEntityId(e.target.value);
              setErrors((prev) => ({ ...prev, entityId: "" }));
            }}
            error={errors.entityId}
          >
            <option value="">Select record with due balance</option>
            {entityOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        )}

        {entityOptions.length === 0 && entityType && (
          <p className="text-xs text-amber-600">No records with a due balance found for this type.</p>
        )}

        <Input
          id="amount"
          type="number"
          step="0.01"
          label="Amount"
          required
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setErrors((prev) => ({ ...prev, amount: "" }));
          }}
          error={errors.amount}
          hint={selectedEntity ? `Maximum: ৳${selectedEntity.due}` : undefined}
        />

        <Select id="paymentAccount" label="Payment Account" required value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} error={errors.paymentAccount}>
          <option value="">Select account</option>
          {assetAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>

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

export default PaymentOutFormModal;