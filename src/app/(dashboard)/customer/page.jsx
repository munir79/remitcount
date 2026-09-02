"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
  useGetAllCustomersQuery,
  useUpdateCustomerMutation,
} from "@/redux/features/customer/customerApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Badge from "@/compoent/ui/Badge";
import Pagination from "@/compoent/ui/Pagination";
import Modal from "@/compoent/ui/Modal";
import Input from "@/compoent/ui/Input";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import SearchInput from "@/compoent/ui/SearchInput";
import Avatar from "@/compoent/ui/Avatar";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "balance", label: "Balance" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const initialFormState = { name: "", phone: "", email: "", address: "", openingBalance: "0" };

const CustomerPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useGetAllCustomersQuery({ page, limit: 10, search: search || undefined });
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation();

  const customers = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Customer") refetch();
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData(initialFormState);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      openingBalance: String(customer.openingBalance || 0),
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

    try {
      if (editingCustomer) {
        await updateCustomer({
          id: editingCustomer._id,
          data: { name: formData.name, phone: formData.phone, email: formData.email, address: formData.address },
        }).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await createCustomer({
          ...formData,
          openingBalance: Number(formData.openingBalance) || 0,
          clientRequestId: crypto.randomUUID(),
        }).unwrap();
        toast.success("Customer created successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async () => {
    const targetName = deleteTarget?.name;
    try {
      await deleteCustomer(deleteTarget._id).unwrap();
      toast.success(`"${targetName}" deleted successfully`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete customer");
    }
  };

  return (
    // ✅ Fix — পুরো Return এখন একটা Fragment দিয়ে Wrap করা, Modal/ConfirmDialog 
    // এখন <div className="p-6"> এর বাইরে, Page Component এর একদম Top Level এ
    <>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Customers</h1>
            <p className="mt-0.5 text-sm text-neutral-500">Manage your customers (Debtors)</p>
          </div>
          <Button type="button" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Add Customer
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
        ) : customers.length === 0 ? (
          <EmptyState title="No customers yet" description="Add your first customer to get started" />
        ) : (
          <>
            <Table columns={COLUMNS}>
              {customers.map((c) => (
                <tr key={c._id} className="group hover:bg-neutral-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} />
                      <span className="font-medium text-neutral-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.phone || "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-neutral-900">
                    ৳ {Number(c.currentBalance).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === "active" ? "success" : "neutral"}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button type="button" size="sm" variant="ghost" onClick={() => openEditModal(c)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}>
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
      </div>

      {/* ✅ এখন এখানে, বাইরে */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? "Edit Customer" : "Add Customer"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="name" name="name" label="Full Name" placeholder="e.g. Kirby Koch" value={formData.name} onChange={handleChange} error={errors.name} />

          <div className="grid grid-cols-2 gap-4">
            <Input id="phone" name="phone" label="Phone" placeholder="+60 1X-XXX XXXX" value={formData.phone} onChange={handleChange} />
            <Input id="email" name="email" type="email" label="Email" placeholder="name@example.com" value={formData.email} onChange={handleChange} />
          </div>

          <Input id="address" name="address" label="Address" placeholder="Optional" value={formData.address} onChange={handleChange} />

          {!editingCustomer && (
            <Input
              id="openingBalance"
              name="openingBalance"
              type="number"
              label="Opening Balance"
              hint="Existing balance owed by this customer, if any"
              value={formData.openingBalance}
              onChange={handleChange}
            />
          )}

          <div className="mt-1 flex justify-end gap-2.5 border-t border-neutral-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating || isUpdating}>
              {editingCustomer ? "Save Changes" : "Create Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Customer"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </>
  );
};

export default CustomerPage;