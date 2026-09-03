"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, Building2 } from "lucide-react";
import { useCreateBranchMutation, useGetAllBranchesQuery, useUpdateBranchMutation } from "@/redux/features/branch/branchApi";
import EmptyState from "@/compoent/ui/EmptyState";
import Button from "@/compoent/ui/Button";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Modal from "@/compoent/ui/Modal";
import Input from "@/compoent/ui/Input";


const COLUMNS = [
  { key: "name", label: "Branch Name" },
  { key: "address", label: "Address" },
  { key: "phone", label: "Phone" },
  { key: "head", label: "Head Office" },
  { key: "actions", label: "" },
];

const initialFormState = { name: "", address: "", phone: "", isHeadOffice: false };

const BranchPage = () => {
  const { data, isLoading } = useGetAllBranchesQuery({ limit: 100 });
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();

  const branches = data?.data?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormData(initialFormState);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address || "",
      phone: branch.phone || "",
      isHeadOffice: branch.isHeadOffice || false,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    try {
      if (editingBranch) {
        await updateBranch({ id: editingBranch._id, data: formData }).unwrap();
        toast.success("Branch updated successfully");
      } else {
        await createBranch(formData).unwrap();
        toast.success("Branch created successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Branches</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage your company branches</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : branches.length === 0 ? (
        <EmptyState icon={Building2} title="No branches yet" description="Add your first branch" />
      ) : (
        <Table columns={COLUMNS}>
          {branches.map((b) => (
            <tr key={b._id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-900">{b.name}</td>
              <td className="px-4 py-3 text-slate-700">{b.address || "—"}</td>
              <td className="px-4 py-3 text-slate-700">{b.phone || "—"}</td>
              <td className="px-4 py-3">{b.isHeadOffice && <Badge variant="primary">Head Office</Badge>}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="ghost" onClick={() => openEditModal(b)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBranch ? "Edit Branch" : "Add Branch"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="name" name="name" label="Branch Name" required value={formData.name} onChange={handleChange} error={errors.name} />
          <Input id="address" name="address" label="Address" value={formData.address} onChange={handleChange} />
          <Input id="phone" name="phone" label="Phone" value={formData.phone} onChange={handleChange} />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="isHeadOffice"
              checked={formData.isHeadOffice}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            Mark as Head Office
          </label>

          <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating || isUpdating}>
              {editingBranch ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BranchPage;