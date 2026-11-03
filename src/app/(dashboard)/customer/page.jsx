"use client";
import { Users } from "lucide-react";
import {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetAllCustomersQuery,
  useUpdateCustomerMutation,
} from "@/redux/features/customer/customerApi";
import Input from "@/compoent/ui/Input";
import Select from "@/compoent/ui/Select";
import PartyDirectoryPage from "@/compoent/pos/PartyDirectoryPage";
import { ID_TYPES } from "@/compoent/send/QuickCustomerForm";
import CountrySelect from "@/compoent/ui/CountrySelect";
import { getCountryName } from "@/lib/countries";

const BASE_FORM = { name: "", phone: "", email: "", address: "", idType: "Passport", idNumber: "", nationality: "", openingBalance: "0" };

const toForm = (c) => ({
  name: c.name,
  phone: c.phone || "",
  email: c.email || "",
  address: c.address || "",
  idType: c.idType || "Passport",
  idNumber: c.idNumber || "",
  nationality: c.nationality || "",
  openingBalance: String(c.openingBalance || 0),
});

const toPayload = (f) => ({
  name: f.name.trim(),
  phone: f.phone.trim(),
  email: f.email.trim(),
  address: f.address.trim(),
  idType: f.idNumber.trim() ? f.idType : null,
  idNumber: f.idNumber.trim(),
  nationality: f.nationality.trim(),
});

// ✅ KYC — Malaysia MSB নিয়মে Customer এর পরিচয়পত্র
const CustomerKycFields = ({ formData, onChange }) => (
  <>
    <p className="pt-1 text-sm font-semibold text-slate-900 sm:col-span-2">Identification (KYC)</p>
    <Select id="idType" name="idType" label="ID type" value={formData.idType} onChange={onChange}>
      {ID_TYPES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </Select>
    <Input id="idNumber" name="idNumber" label="ID number" placeholder={formData.idType === "MyKad" ? "900101-14-5678" : "A12345678"} value={formData.idNumber} onChange={onChange} inputClassName="uppercase" />
    {/* Form এর onChange Event চায় — Country Code কে Event এর আকারে পাঠানো */}
    <CountrySelect
      id="nationality"
      label="Nationality"
      value={formData.nationality}
      onChange={(code) => onChange({ target: { name: "nationality", value: code } })}
      hint="Picks the send currency automatically"
      className="sm:col-span-2"
    />
  </>
);

const CustomerPage = () => (
  <PartyDirectoryPage
    title="Customers"
    description="People and businesses you buy from, sell to and send for"
    singular="Customer"
    icon={Users}
    useListQuery={useGetAllCustomersQuery}
    useCreateMutation={useCreateCustomerMutation}
    useUpdateMutation={useUpdateCustomerMutation}
    useDeleteMutation={useDeleteCustomerMutation}
    socketModule="Customer"
    baseForm={BASE_FORM}
    toForm={toForm}
    toPayload={toPayload}
    ExtraFields={CustomerKycFields}
    extraColumn={{
      key: "kyc",
      label: "ID",
      render: (c) => (
        <div>
          {c.idNumber ? `${c.idType || "ID"} · ${c.idNumber}` : <span className="text-amber-600">ID missing</span>}
          {c.nationality && <p className="text-xs text-slate-400">{getCountryName(c.nationality)}</p>}
        </div>
      ),
    }}
    openingBalanceHint="Amount still to collect from this customer from before. If you owe them instead, enter it with a minus (e.g. -418)."
    modalSize="lg"
  />
);

export default CustomerPage;
