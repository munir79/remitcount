"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateCompanyMutation } from "@/redux/features/company/companyApi";
import { useLazyGetMyProfileQuery } from "@/redux/features/auth/authApi";
import Card from "@/compoent/ui/Card";
import Input from "@/compoent/ui/Input";
import Button from "@/compoent/ui/Button";
import { getLandingPage } from "@/lib/getLandingPage";


const CreateCompanyPage = () => {
  const router = useRouter();
  const [createCompany, { isLoading }] = useCreateCompanyMutation();
  const [triggerGetProfile] = useLazyGetMyProfileQuery();

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Company name is required";
    if (!formData.email.trim()) newErrors.email = "Company email is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createCompany(formData).unwrap();

      // ✅ Company তৈরি হওয়ার পর এখন এই User "Company Admin" — Permission নতুন করে আনা জরুরি
      let userPermissions = [];
      try {
        const profileResult = await triggerGetProfile().unwrap();
        userPermissions = profileResult.data.permissions || [];
        localStorage.setItem("permissions", JSON.stringify(userPermissions));
      } catch (permErr) {
        localStorage.setItem("permissions", JSON.stringify([]));
      }

      toast.success("Company created successfully");
      router.push(getLandingPage(userPermissions));
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create company");
    }
  };

  return (
    <Card>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Set up your company</h1>
        <p className="mt-1 text-sm text-neutral-500">This will be your business workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          name="name"
          label="Company Name"
          placeholder="e.g. Global Money Changer Sdn Bhd"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
        />
        <Input
          id="email"
          name="email"
          type="email"
          label="Company Email"
          placeholder="contact@company.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
        />
        <Input
          id="phone"
          name="phone"
          label="Phone (optional)"
          placeholder="+60 1X-XXX XXXX"
          value={formData.phone}
          onChange={handleChange}
        />
        <Input
          id="address"
          name="address"
          label="Address (optional)"
          placeholder="Business address"
          value={formData.address}
          onChange={handleChange}
        />

        <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
          Create Company
        </Button>
      </form>
    </Card>
  );
};

export default CreateCompanyPage;