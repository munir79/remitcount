"use client";
import { useGetAllAccountsQuery } from "@/redux/features/account/accountApi";
import { useGetAllCustomersQuery } from "@/redux/features/customer/customerApi";
import { useCreateSendMutation } from "@/redux/features/pos/sendApi";
import { useGetAllVendorsQuery } from "@/redux/features/vendor/vendorApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Select from "../ui/Select";
import Input from "../ui/Input";
import Button from "../ui/Button";


const initialFormState = {
  customer: "",
  receiverName: "",
  receiverBank: "",
  receiverAccount: "",
  receiverBranch: "",
  currencyCode: "",
  foreignAmount: "",
  customerRate: "",
  customerFee: "0",
  paymentTerm: "Cash",
  customerPaymentAccount: "",
  supplier: "",
  supplierRate: "",
  supplierFee: "0",
  supplierPayableAccount: "",
  profitAccount: "",
};

const SendFormModal = ({ isOpen, onClose }) => {
  const { data: customerData } = useGetAllCustomersQuery({ limit: 500 });
  const { data: vendorData } = useGetAllVendorsQuery({ limit: 500 });
  const { data: accountData } = useGetAllAccountsQuery({ isGroup: false, limit: 500 });
  const [createSend, { isLoading }] = useCreateSendMutation();

  const customers = customerData?.data?.data || [];
  const vendors = vendorData?.data?.data || [];
  const accounts = accountData?.data?.data || [];
  const assetAccounts = accounts.filter((a) => a.type === "Asset");
  const liabilityAccounts = accounts.filter((a) => a.type === "Liability");
  const incomeAccounts = accounts.filter((a) => a.type === "Income");

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const foreignAmount = Number(formData.foreignAmount) || 0;
  const customerRate = Number(formData.customerRate) || 0;
  const customerFee = Number(formData.customerFee) || 0;
  const supplierRate = Number(formData.supplierRate) || 0;
  const supplierFee = Number(formData.supplierFee) || 0;

  const customerTotal = foreignAmount * customerRate + customerFee;
  const supplierTotal = foreignAmount * supplierRate + supplierFee;
  const profit = customerTotal - supplierTotal;

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
    if (!formData.receiverName.trim()) newErrors.receiverName = "Required";
    if (!formData.currencyCode.trim()) newErrors.currencyCode = "Required";
    if (!foreignAmount) newErrors.foreignAmount = "Required";
    if (!customerRate) newErrors.customerRate = "Required";
    if (!formData.customerPaymentAccount) newErrors.customerPaymentAccount = "Required";
    if (!formData.supplier) newErrors.supplier = "Required";
    if (!supplierRate) newErrors.supplierRate = "Required";
    if (!formData.supplierPayableAccount) newErrors.supplierPayableAccount = "Required";
    if (!formData.profitAccount) newErrors.profitAccount = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createSend({
        customer: formData.customer,
        receiverBankDetails: {
          name: formData.receiverName,
          bank: formData.receiverBank,
          account: formData.receiverAccount,
          branch: formData.receiverBranch,
        },
        currencyCode: formData.currencyCode,
        foreignAmount,
        customerRate,
        customerFee,
        paymentTerm: formData.paymentTerm,
        customerPaymentAccount: formData.customerPaymentAccount,
        supplier: formData.supplier,
        supplierRate,
        supplierFee,
        supplierPayableAccount: formData.supplierPayableAccount,
        profitAccount: formData.profitAccount,
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Send record created as Draft");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create send record");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Send (Remittance)" size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <p className="mb-3 text-sm font-bold text-slate-800">Customer & Receiver</p>
          <div className="grid grid-cols-2 gap-4">
            <Select id="customer" name="customer" label="Customer" required value={formData.customer} onChange={handleChange} error={errors.customer}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.phone ? `— ${c.phone}` : ""}
                </option>
              ))}
            </Select>
            <Input id="receiverName" name="receiverName" label="Receiver Name" required value={formData.receiverName} onChange={handleChange} error={errors.receiverName} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <Input id="receiverBank" name="receiverBank" label="Receiver Bank" value={formData.receiverBank} onChange={handleChange} />
            <Input id="receiverAccount" name="receiverAccount" label="Receiver Account" value={formData.receiverAccount} onChange={handleChange} />
            <Input id="receiverBranch" name="receiverBranch" label="Receiver Branch" value={formData.receiverBranch} onChange={handleChange} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input id="currencyCode" name="currencyCode" label="Currency Code" required placeholder="e.g. IDR" value={formData.currencyCode} onChange={handleChange} error={errors.currencyCode} />
          <Input id="foreignAmount" name="foreignAmount" type="number" step="0.01" label="Foreign Amount" required value={formData.foreignAmount} onChange={handleChange} error={errors.foreignAmount} />
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-3 text-sm font-bold text-slate-800">Customer Side (Receivable)</p>
          <div className="grid grid-cols-3 gap-4">
            <Input id="customerRate" name="customerRate" type="number" step="0.000001" label="Rate" required value={formData.customerRate} onChange={handleChange} error={errors.customerRate} />
            <Input id="customerFee" name="customerFee" type="number" step="0.01" label="Fee" value={formData.customerFee} onChange={handleChange} />
            <Select id="paymentTerm" name="paymentTerm" label="Payment Term" value={formData.paymentTerm} onChange={handleChange}>
              <option value="Cash">Cash</option>
              <option value="Credit">Credit</option>
            </Select>
          </div>
          <div className="mt-4">
            <Select
              id="customerPaymentAccount"
              name="customerPaymentAccount"
              label="Payment/Receivable Account"
              required
              value={formData.customerPaymentAccount}
              onChange={handleChange}
              error={errors.customerPaymentAccount}
            >
              <option value="">Select account</option>
              {assetAccounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800">
            Customer Total: ৳ {customerTotal.toFixed(2)}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-3 text-sm font-bold text-slate-800">Supplier Side (Payable)</p>
          <Select id="supplier" name="supplier" label="Supplier (Vendor)" required value={formData.supplier} onChange={handleChange} error={errors.supplier}>
            <option value="">Select supplier</option>
            {vendors.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
          </Select>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input id="supplierRate" name="supplierRate" type="number" step="0.000001" label="Rate" required value={formData.supplierRate} onChange={handleChange} error={errors.supplierRate} />
            <Input id="supplierFee" name="supplierFee" type="number" step="0.01" label="Fee" value={formData.supplierFee} onChange={handleChange} />
          </div>
          <div className="mt-4">
            <Select
              id="supplierPayableAccount"
              name="supplierPayableAccount"
              label="Payable Account"
              required
              value={formData.supplierPayableAccount}
              onChange={handleChange}
              error={errors.supplierPayableAccount}
            >
              <option value="">Select account</option>
              {liabilityAccounts.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800">
            Supplier Total: ৳ {supplierTotal.toFixed(2)}
          </div>
        </div>

        <Select id="profitAccount" name="profitAccount" label="Profit Account" required value={formData.profitAccount} onChange={handleChange} error={errors.profitAccount}>
          <option value="">Select income account</option>
          {incomeAccounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.code} — {a.name}
            </option>
          ))}
        </Select>

        <div className={`rounded-lg px-4 py-3 text-sm font-bold ${profit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          Estimated Profit: ৳ {profit.toFixed(2)}
        </div>

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Send
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SendFormModal;