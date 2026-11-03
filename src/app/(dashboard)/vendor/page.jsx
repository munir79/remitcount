"use client";
import { Truck } from "lucide-react";
import {
  useCreateVendorMutation,
  useDeleteVendorMutation,
  useGetAllVendorsQuery,
  useUpdateVendorMutation,
} from "@/redux/features/vendor/vendorApi";
import Input from "@/compoent/ui/Input";
import PartyDirectoryPage from "@/compoent/pos/PartyDirectoryPage";

const BASE_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  tinNumber: "",
  bankName: "",
  accountNumber: "",
  branchName: "",
  openingBalance: "0",
};

const toForm = (v) => ({
  name: v.name,
  phone: v.phone || "",
  email: v.email || "",
  address: v.address || "",
  tinNumber: v.tinNumber || "",
  bankName: v.bankInfo?.bankName || "",
  accountNumber: v.bankInfo?.accountNumber || "",
  branchName: v.bankInfo?.branchName || "",
  openingBalance: String(v.openingBalance || 0),
});

const toPayload = (f) => ({
  name: f.name.trim(),
  phone: f.phone.trim(),
  email: f.email.trim(),
  address: f.address.trim(),
  tinNumber: f.tinNumber.trim(),
  bankInfo: { bankName: f.bankName.trim(), accountNumber: f.accountNumber.trim(), branchName: f.branchName.trim() },
});

// Vendor এর বাড়তি Field — TIN ও Bank Information
const VendorExtraFields = ({ formData, onChange }) => (
  <>
    <Input id="tinNumber" name="tinNumber" label="TIN number" placeholder="Optional" value={formData.tinNumber} onChange={onChange} className="sm:col-span-2" />
    <p className="pt-1 text-sm font-semibold text-slate-900 sm:col-span-2">Bank information</p>
    <Input id="bankName" name="bankName" label="Bank" value={formData.bankName} onChange={onChange} />
    <Input id="accountNumber" name="accountNumber" label="Account no." value={formData.accountNumber} onChange={onChange} />
    <Input id="branchName" name="branchName" label="Bank branch" value={formData.branchName} onChange={onChange} className="sm:col-span-2" />
  </>
);

const VendorPage = () => (
  <PartyDirectoryPage
    title="Vendors"
    description="Suppliers and remittance partners you pay"
    singular="Vendor"
    icon={Truck}
    useListQuery={useGetAllVendorsQuery}
    useCreateMutation={useCreateVendorMutation}
    useUpdateMutation={useUpdateVendorMutation}
    useDeleteMutation={useDeleteVendorMutation}
    socketModule="Vendor"
    baseForm={BASE_FORM}
    toForm={toForm}
    toPayload={toPayload}
    ExtraFields={VendorExtraFields}
    extraColumn={{ key: "tin", label: "TIN", render: (v) => v.tinNumber || "—" }}
    openingBalanceHint="Amount still to pay this supplier from before. If they owe you instead (e.g. a deposit), enter it with a minus (e.g. -500)."
    modalSize="lg"
  />
);

export default VendorPage;
