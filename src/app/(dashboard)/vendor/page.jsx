"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useCreateVendorMutation,
  useDeleteVendorMutation,
  useGetAllVendorsQuery,
  useUpdateVendorMutation,
} from "@/redux/features/vendor/vendorApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "@/compoent/ui/Button";
import Input from "@/compoent/ui/Input";
import Modal from "@/compoent/ui/Modal";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Avatar from "@/compoent/ui/Avatar";
import Pagination from "@/compoent/ui/Pagination";
import EmptyState from "@/compoent/ui/EmptyState";
import SearchInput from "@/compoent/ui/SearchInput";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "tin", label: "TIN" },
  { key: "balance", label: "Balance" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const initialFormState = {
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

const VendorPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useGetAllVendorsQuery({ page, limit: 10, search: search || undefined });
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

  const vendors = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Vendor") refetch();
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreateModal = () => {
    setEditingVendor(null);
    setFormData(initialFormState);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      phone: vendor.phone || "",
      email: vendor.email || "",
      address: vendor.address || "",
      tinNumber: vendor.tinNumber || "",
      bankName: vendor.bankInfo?.bankName || "",
      accountNumber: vendor.bankInfo?.accountNumber || "",
      branchName: vendor.bankInfo?.branchName || "",
      openingBalance: String(vendor.openingBalance || 0),
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Name is required" });
      return;
    }

    const payload = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      tinNumber: formData.tinNumber,
      bankInfo: { bankName: formData.bankName, accountNumber: formData.accountNumber, branchName: formData.branchName },
    };

    try {
      if (editingVendor) {
        await updateVendor({ id: editingVendor._id, data: payload }).unwrap();
        toast.success("Vendor updated successfully");
      } else {
        await createVendor({
          ...payload,
          openingBalance: Number(formData.openingBalance) || 0,
          clientRequestId: crypto.randomUUID(),
        }).unwrap();
        toast.success("Vendor created successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async () => {
    const name = deleteTarget?.name;
    try {
      await deleteVendor(deleteTarget._id).unwrap();
      toast.success(`"${name}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete vendor");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Vendors</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage your suppliers (Creditors)</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or phone..."
        />
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState title="No vendors yet" description="Add your first supplier to get started" />
      ) : (
        <>
          <Table columns={COLUMNS}>
            {vendors.map((v) => (
              <tr key={v._id} className="group hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={v.name} />
                    <span className="font-semibold text-slate-900">{v.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{v.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-700">{v.tinNumber || "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                  ৳ {Number(v.currentBalance).toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={v.status === "active" ? "success" : "neutral"}>{v.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(v)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(v)}>
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingVendor ? "Edit Vendor" : "Add Vendor"} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="name" name="name" label="Name" required placeholder="e.g. Trans Global Supplier" value={formData.name} onChange={handleChange} error={errors.name} />
            <Input id="phone" name="phone" label="Phone" placeholder="+60 1X-XXX XXXX" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="email" name="email" type="email" label="Email" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
            <Input id="tinNumber" name="tinNumber" label="TIN Number" placeholder="Optional" value={formData.tinNumber} onChange={handleChange} />
          </div>
          <Input id="address" name="address" label="Address" placeholder="Optional" value={formData.address} onChange={handleChange} />

          <div>
            <p className="mb-3 text-sm font-bold text-slate-800">Bank Information</p>
            <div className="grid grid-cols-3 gap-4">
              <Input id="bankName" name="bankName" label="Bank Name" value={formData.bankName} onChange={handleChange} />
              <Input id="accountNumber" name="accountNumber" label="Account No." value={formData.accountNumber} onChange={handleChange} />
              <Input id="branchName" name="branchName" label="Branch" value={formData.branchName} onChange={handleChange} />
            </div>
          </div>

          {!editingVendor && (
            <Input
              id="openingBalance"
              name="openingBalance"
              type="number"
              label="Opening Balance"
              hint="Existing balance owed to this vendor, if any"
              value={formData.openingBalance}
              onChange={handleChange}
            />
          )}

          <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating || isUpdating}>
              {editingVendor ? "Save Changes" : "Create Vendor"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Vendor"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default VendorPage;