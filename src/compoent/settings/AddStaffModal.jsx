"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAddStaffMutation } from "@/redux/features/auth/authApi";
import { useGetAllBranchesQuery } from "@/redux/features/branch/branchApi";
import { useGetAllRolesQuery } from "@/redux/features/role/roleApi";
import { handleEnterToNext } from "@/hooks/useEnterToNext";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import FormModalFooter from "../ui/FormModalFooter";

const FORM_ID = "add-staff-form";
const initialFormState = { name: "", email: "", password: "", roleId: "", branch: "" };

const AddStaffModal = ({ isOpen, onClose }) => {
  const { data: roleData } = useGetAllRolesQuery(undefined, { skip: !isOpen });
  const { data: branchData } = useGetAllBranchesQuery({ limit: 100 }, { skip: !isOpen });
  const [addStaff, { isLoading }] = useAddStaffMutation();

  const roles = (roleData?.data || []).filter((r) => !r.isCompanyAdminRole);
  const branches = branchData?.data?.data || [];

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Enter a name";
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) newErrors.email = "Enter a valid email";
    if (formData.password.length < 6) newErrors.password = "At least 6 characters";
    if (!formData.roleId) newErrors.roleId = "Choose a role";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await addStaff({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        roleId: formData.roleId,
        branch: formData.branch || undefined,
      }).unwrap();
      toast.success(`${formData.name.trim()} added — share the login email and temporary password`);
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add staff");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add staff member"
      description="They sign in with this email and the temporary password"
      size="lg"
      footer={<FormModalFooter formId={FORM_ID} onCancel={handleClose} isLoading={isLoading} submitLabel="Add staff" />}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} onKeyDown={handleEnterToNext} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input id="staffName" name="name" label="Full name" required value={formData.name} onChange={handleChange} error={errors.name} className="sm:col-span-2" />
        <Input id="staffEmail" name="email" type="email" label="Email" required autoComplete="off" value={formData.email} onChange={handleChange} error={errors.email} />
        <Input
          id="staffPassword"
          name="password"
          type={showPassword ? "text" : "password"}
          label="Temporary password"
          required
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <Select id="roleId" name="roleId" label="Role" required value={formData.roleId} onChange={handleChange} error={errors.roleId}>
          <option value="">Choose role</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </Select>
        <Select id="staffBranch" name="branch" label="Branch" hint="Cashiers should belong to one branch" value={formData.branch} onChange={handleChange}>
          <option value="">All branches (company-wide)</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
};

export default AddStaffModal;
