"use client";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAllCustomersQuery } from "@/redux/features/customer/customerApi";
import { useCreateSellCurrencyMutation } from "@/redux/features/pos/sellCurrencyApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Input from "../ui/Input";
import { useGetAllCurrencyStocksQuery } from "@/redux/features/pos/currencyStockApi";
import Button from "../ui/Button";


const initialFormState = {
  customer: "",
  currencyStock: "",
  foreignAmount: "",
  rate: "",
  fees: "0",
  paymentTerm: "Cash",
  paymentAccount: "",
  salesIncomeAccount: "",
};

const SellCurrencyFormModal = ({ isOpen, onClose }) => {
  const { data: customerData } = useGetAllCustomersQuery({ limit: 500 });
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const { data: stockData } = useGetAllCurrencyStocksQuery({ limit: 100 });
  const [createSellCurrency, { isLoading }] = useCreateSellCurrencyMutation();

  const customers = customerData?.data?.data || [];
  const stocks = stockData?.data?.data || [];
  const accounts = accountData?.data?.data || [];
  const assetAccounts = accounts.filter((a) => a.type === "Asset");
  const incomeAccounts = accounts.filter((a) => a.type === "Income");

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const selectedStock = stocks.find((s) => s._id === formData.currencyStock);
  const foreignAmount = Number(formData.foreignAmount) || 0;
  const rate = Number(formData.rate) || 0;
  const fees = Number(formData.fees) || 0;
  const total = foreignAmount * rate + fees;
  const insufficientStock = selectedStock && foreignAmount > selectedStock.stockQty;

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
    if (!formData.customer) newErrors.customer = "Required";
    if (!formData.currencyStock) newErrors.currencyStock = "Required";
    if (!foreignAmount) newErrors.foreignAmount = "Required";
    if (!rate) newErrors.rate = "Required";
    if (!formData.paymentAccount) newErrors.paymentAccount = "Required";
    if (!formData.salesIncomeAccount) newErrors.salesIncomeAccount = "Required";
    if (insufficientStock) newErrors.foreignAmount = `Only ${selectedStock.stockQty} ${selectedStock.currencyCode} available`;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createSellCurrency({
        customer: formData.customer,
        currencyStock: formData.currencyStock,
        foreignAmount,
        rate,
        fees,
        paymentTerm: formData.paymentTerm,
        paymentAccount: formData.paymentAccount,
        salesIncomeAccount: formData.salesIncomeAccount,
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Sell Currency created as Draft");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create record");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sell Currency" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Select id="customer" name="customer" label="Customer" required value={formData.customer} onChange={handleChange} error={errors.customer}>
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select id="currencyStock" name="currencyStock" label="Currency" required value={formData.currencyStock} onChange={handleChange} error={errors.currencyStock}>
            <option value="">Select currency</option>
            {stocks.map((s) => (
              <option key={s._id} value={s._id}>
                {s.currencyCode} (Stock: {s.stockQty})
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input id="foreignAmount" name="foreignAmount" type="number" step="0.01" label="Foreign Amount" required value={formData.foreignAmount} onChange={handleChange} error={errors.foreignAmount} />
          <Input id="rate" name="rate" type="number" step="0.000001" label="Rate" required value={formData.rate} onChange={handleChange} error={errors.rate} />
          <Input id="fees" name="fees" type="number" step="0.01" label="Fees" value={formData.fees} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select id="paymentTerm" name="paymentTerm" label="Payment Term" value={formData.paymentTerm} onChange={handleChange}>
            <option value="Cash">Cash</option>
            <option value="Credit">Credit</option>
          </Select>
          <Select id="paymentAccount" name="paymentAccount" label="Receivable Account" required value={formData.paymentAccount} onChange={handleChange} error={errors.paymentAccount}>
            <option value="">Select account</option>
            {assetAccounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} — {a.name}
              </option>
            ))}
          </Select>
        </div>

        <Select id="salesIncomeAccount" name="salesIncomeAccount" label="Sales Income Account" required value={formData.salesIncomeAccount} onChange={handleChange} error={errors.salesIncomeAccount}>
          <option value="">Select account</option>
          {incomeAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>

        <div className={`rounded-lg px-4 py-3 text-sm font-bold ${insufficientStock ? "bg-rose-50 text-rose-700" : "bg-slate-50 text-slate-800"}`}>
          Total: ৳ {total.toFixed(2)}
          {selectedStock && <span className="ml-2 font-normal">(Available: {selectedStock.stockQty} {selectedStock.currencyCode})</span>}
        </div>

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={insufficientStock}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SellCurrencyFormModal;