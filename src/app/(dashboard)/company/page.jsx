"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { useGetMyCompanyQuery, useUpdateCompanyMutation } from "@/redux/features/company/companyApi";
import Button from "@/compoent/ui/Button";
import Card from "@/compoent/ui/Card";
import Input from "@/compoent/ui/Input";


const CompanyPage = () => {
  const { data, isLoading } = useGetMyCompanyQuery();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();

  const company = data?.data;

  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        phone: company.phone || "",
        address: company.address || "",
      });
    }
  }, [company]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Company name is required" });
      return;
    }

    try {
      await updateCompany(formData).unwrap();
      toast.success("Company details updated successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update company");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Company Settings</h1>
        <p className="mt-0.5 text-sm text-slate-600">Manage your company profile</p>
      </div>

      <div className="max-w-xl">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{company?.name}</p>
              <p className="text-xs text-slate-500">{company?.email} (cannot be changed)</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input id="name" name="name" label="Company Name" required value={formData.name} onChange={handleChange} error={errors.name} />
            <Input id="phone" name="phone" label="Phone" value={formData.phone} onChange={handleChange} />
            <Input id="address" name="address" label="Address" value={formData.address} onChange={handleChange} />

            <div className="mt-1 flex justify-end border-t border-slate-100 pt-4">
              <Button type="submit" isLoading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CompanyPage;