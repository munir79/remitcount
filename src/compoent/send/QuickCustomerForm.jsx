"use client";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, X } from "lucide-react";
import { useCreateCustomerMutation } from "@/redux/features/customer/customerApi";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import CountrySelect from "../ui/CountrySelect";

export const ID_TYPES = [
  { value: "MyKad", label: "MyKad (IC)" },
  { value: "Passport", label: "Passport" },
  { value: "Other", label: "Other" },
];

// খোঁজার লেখাটা নম্বরের মতো হলে Phone এ, নাহলে নামে বসে
const looksLikePhone = (text) => /^[+\d][\d\s-]{5,}$/.test(text.trim());

/**
 * ✅ Send Form এর ভেতরেই নতুন Customer — Form ছেড়ে যেতে হয় না
 * initialText — Customer খোঁজার সময় যা টাইপ করা হয়েছিল (নাম বা Phone)
 */
const QuickCustomerForm = ({ initialText = "", onCreated, onCancel }) => {
  const [createCustomer, { isLoading }] = useCreateCustomerMutation();
  const [requestId] = useState(() => crypto.randomUUID());
  const [form, setForm] = useState(() => ({
    name: looksLikePhone(initialText) ? "" : initialText,
    phone: looksLikePhone(initialText) ? initialText : "",
    idType: "Passport",
    idNumber: "",
    nationality: "",
  }));
  const [errors, setErrors] = useState({});

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Enter the customer's name";
    if (!form.phone.trim()) newErrors.phone = "Enter a phone number";
    if (!form.idNumber.trim()) newErrors.idNumber = "Enter the IC / passport number";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    try {
      const res = await createCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        nationality: form.nationality.trim(),
        clientRequestId: requestId,
      }).unwrap();
      toast.success(`${res.data.name} added as a customer`);
      onCreated(res.data);
    } catch (err) {
      toast.error(err?.data?.message || "Could not add customer");
    }
  };

  return (
    // Send Form এর ভেতরে — নিজস্ব <form> না (Nested Form চলে না), Enter এ Save
    <div
      className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4"
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.tagName === "INPUT") {
          e.preventDefault();
          e.stopPropagation();
          handleSave();
        }
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
          <UserPlus className="h-4 w-4" />
          New customer
        </p>
        <button type="button" onClick={onCancel} aria-label="Cancel new customer" className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="qcName" label="Full name" required autoFocus value={form.name} onChange={(e) => setField("name", e.target.value)} error={errors.name} />
        <Input id="qcPhone" type="tel" label="Phone" required placeholder="+60 12-345 6789" value={form.phone} onChange={(e) => setField("phone", e.target.value)} error={errors.phone} />
        <Select id="qcIdType" label="ID type" value={form.idType} onChange={(e) => setField("idType", e.target.value)}>
          {ID_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Input id="qcIdNumber" label="ID number" required placeholder={form.idType === "MyKad" ? "900101-14-5678" : "A12345678"} value={form.idNumber} onChange={(e) => setField("idNumber", e.target.value)} error={errors.idNumber} inputClassName="uppercase" />
        <CountrySelect
          id="qcNationality"
          label="Nationality"
          value={form.nationality}
          onChange={(code) => setField("nationality", code)}
          hint="Used to pick the send currency automatically"
          className="sm:col-span-2"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} isLoading={isLoading}>
          Save & use customer
        </Button>
      </div>
    </div>
  );
};

export default QuickCustomerForm;
