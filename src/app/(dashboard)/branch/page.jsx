"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, MapPin, Pencil, Phone, Plus, Star, Users } from "lucide-react";
import { useCreateBranchMutation, useGetAllBranchesQuery, useUpdateBranchMutation } from "@/redux/features/branch/branchApi";
import { handleEnterToNext } from "@/hooks/useEnterToNext";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Button from "@/compoent/ui/Button";
import Badge from "@/compoent/ui/Badge";
import Modal from "@/compoent/ui/Modal";
import Input from "@/compoent/ui/Input";
import FormModalFooter from "@/compoent/ui/FormModalFooter";

const FORM_ID = "branch-form";
const initialFormState = { name: "", code: "", address: "", phone: "", isHeadOffice: false };

const BranchCard = ({ branch, onEdit }) => (
  <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${branch.isHeadOffice ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>
          {branch.isHeadOffice ? <Star className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{branch.name}</p>
          <p className="font-mono text-xs text-slate-500">{branch.code}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onEdit(branch)}
        title="Edit branch"
        aria-label={`Edit ${branch.name}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>

    <dl className="mt-4 space-y-2 text-sm">
      <div className="flex items-start gap-2 text-slate-600">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <span className="line-clamp-2">{branch.address || "No address"}</span>
      </div>
      <div className="flex items-center gap-2 text-slate-600">
        <Phone className="h-4 w-4 shrink-0 text-slate-400" />
        <span>{branch.phone || "No phone"}</span>
      </div>
    </dl>

    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <Users className="h-3.5 w-3.5" />
        {branch.staffCount ?? 0} staff
      </span>
      <div className="flex gap-1.5">
        {branch.isHeadOffice && <Badge variant="primary" dot={false}>Head office</Badge>}
        <Badge variant={branch.status === "inactive" ? "neutral" : "success"}>{branch.status || "active"}</Badge>
      </div>
    </div>
  </div>
);

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
      code: branch.code || "",
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
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Enter the branch name";
    if (!formData.code.trim()) newErrors.code = "Enter a short branch code";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = { ...formData, name: formData.name.trim(), code: formData.code.trim().toUpperCase() };
    try {
      if (editingBranch) {
        await updateBranch({ id: editingBranch._id, data: payload }).unwrap();
        toast.success("Branch updated");
      } else {
        await createBranch(payload).unwrap();
        toast.success("Branch created");
      }
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const addButton = (
    <Button onClick={openCreateModal}>
      <Plus className="h-4 w-4" />
      Add Branch
    </Button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Branches" description="Counters and outlets of your business" actions={addButton} />

      {isLoading ? (
        <PageLoader />
      ) : branches.length === 0 ? (
        <EmptyState icon={Building2} title="No branches yet" description="Add your head office and other outlets." action={addButton} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {branches.map((b) => (
            <BranchCard key={b._id} branch={b} onEdit={openEditModal} />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBranch ? "Edit branch" : "Add branch"}
        footer={<FormModalFooter formId={FORM_ID} onCancel={closeModal} isLoading={isCreating || isUpdating} submitLabel={editingBranch ? "Save changes" : "Create branch"} />}
      >
        <form id={FORM_ID} onSubmit={handleSubmit} onKeyDown={handleEnterToNext} noValidate className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Input id="name" name="name" label="Branch name" required placeholder="e.g. Kuala Lumpur Central" value={formData.name} onChange={handleChange} error={errors.name} />
          <Input id="code" name="code" label="Code" required placeholder="e.g. KL01" value={formData.code} onChange={handleChange} error={errors.code} />
          <Input id="address" name="address" label="Address" value={formData.address} onChange={handleChange} className="sm:col-span-2" />
          <Input id="phone" name="phone" type="tel" label="Phone" placeholder="+60 3-1234 5678" value={formData.phone} onChange={handleChange} className="sm:col-span-2" />
          <label className="flex items-center gap-2.5 text-sm text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              name="isHeadOffice"
              checked={formData.isHeadOffice}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            This is the head office
          </label>
        </form>
      </Modal>
    </div>
  );
};

export default BranchPage;
