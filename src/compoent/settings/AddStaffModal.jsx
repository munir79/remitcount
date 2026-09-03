"use client";
import { useAddStaffMutation } from "@/redux/features/auth/authApi";
import { useGetAllRolesQuery } from "@/redux/features/role/roleApi";
import { useState } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";


const initialFormState = { name: "", email: "", password: "", role: "" };

const AddStaffModal = ({ isOpen, onClose }) => {
  const { data: roleData } = useGetAllRolesQuery();
  const [addStaff, { isLoading }] = useAddStaffMutation();

  const roles = (roleData?.data || []).filter((r) => !r.isCompanyAdminRole);

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

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
    if (!formData.name.trim()) newErrors.name = "Required";
    if (!formData.email.trim()) newErrors.email = "Required";
    if (!formData.password || formData.password.length < 6) newErrors.password = "At least 6 characters";
    if (!formData.role) newErrors.role = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await addStaff(formData).unwrap();
      toast.success("Staff member added successfully");
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add staff");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Staff Member">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input id="name" name="name" label="Full Name" required value={formData.name} onChange={handleChange} error={errors.name} />
        <Input id="email" name="email" type="email" label="Email" required value={formData.email} onChange={handleChange} error={errors.email} />
        <Input id="password" name="password" type="password" label="Temporary Password" required value={formData.password} onChange={handleChange} error={errors.password} />
        <Select id="role" name="role" label="Role" required value={formData.role} onChange={handleChange} error={errors.role}>
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </Select>

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Add Staff
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStaffModal;