"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useListFilters } from "@/hooks/useListFilters";
import { handleEnterToNext } from "@/hooks/useEnterToNext";
import { useSocketEvent } from "@/socket/useSocketEvent";
import PageHeader from "../ui/PageHeader";
import ListToolbar from "../ui/ListToolbar";
import PageLoader from "../ui/PageLoader";
import EmptyState from "../ui/EmptyState";
import Table from "../ui/Table";
import Button from "../ui/Button";
import Pagination from "../ui/Pagination";
import Avatar from "../ui/Avatar";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import ConfirmDialog from "../ui/ConfirmDialog";
import FormModalFooter from "../ui/FormModalFooter";
import WhatsAppButton from "../ui/WhatsAppButton";
import { MoneyCell, StatusCell, TD } from "../ui/TableCells";

const ACTIVE_STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const iconButton = "flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition";

/**
 * ✅ Customer ও Vendor Directory — একই Layout, শুধু Field আলাদা
 *
 * baseForm — Form এর শুরুর মান; toForm(record) — Edit এর সময় Record → Form
 * toPayload(form) — Form → API Body; ExtraFields — বাড়তি Field (যেমন Vendor এর Bank Info)
 * extraColumn — Table এর তৃতীয় Column { key, label, render(record) }
 */
const PartyDirectoryPage = ({
  title,
  description,
  singular,
  icon,
  useListQuery,
  useCreateMutation,
  useUpdateMutation,
  useDeleteMutation,
  socketModule,
  baseForm,
  toForm,
  toPayload,
  ExtraFields,
  extraColumn,
  openingBalanceHint,
  modalSize = "md",
}) => {
  const filters = useListFilters();
  const { data, isLoading, isFetching, refetch } = useListQuery({
    page: filters.params.page,
    limit: filters.params.limit,
    search: filters.params.search,
    status: filters.params.status,
  });
  const [createParty, { isLoading: isCreating }] = useCreateMutation();
  const [updateParty, { isLoading: isUpdating }] = useUpdateMutation();
  const [deleteParty, { isLoading: isDeleting }] = useDeleteMutation();

  const records = data?.data?.data || [];
  const pagination = data?.data?.pagination;

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === socketModule) refetch();
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(baseForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());

  const formId = `${socketModule.toLowerCase()}-form`;

  const openCreate = () => {
    setEditing(null);
    setFormData(baseForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    setFormData(toForm(record));
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setRequestId(crypto.randomUUID());
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Enter a name";
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Enter a valid email";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (editing) {
        await updateParty({ id: editing._id, data: toPayload(formData) }).unwrap();
        toast.success(`${singular} updated`);
      } else {
        await createParty({ ...toPayload(formData), openingBalance: Number(formData.openingBalance) || 0, clientRequestId: requestId }).unwrap();
        toast.success(`${singular} added`);
      }
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteParty(deleteTarget._id).unwrap();
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || `Failed to delete ${singular.toLowerCase()}`);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone" },
    extraColumn,
    { key: "balance", label: "Balance", align: "right" },
    { key: "status", label: "Status" },
    { key: "actions", label: "" },
  ].filter(Boolean);

  const addButton = (
    <Button onClick={openCreate}>
      <Plus className="h-4 w-4" />
      Add {singular}
    </Button>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title={title} description={description} actions={addButton} />

      <ListToolbar
        statusOptions={ACTIVE_STATUS_OPTIONS}
        status={filters.status}
        onStatusChange={filters.setStatus}
        search={filters.search}
        onSearchChange={filters.setSearch}
        searchPlaceholder="Search name, phone or email…"
      />

      {isLoading ? (
        <PageLoader />
      ) : records.length === 0 ? (
        <EmptyState
          icon={icon}
          title={filters.hasActiveFilters ? `No matching ${title.toLowerCase()}` : `No ${title.toLowerCase()} yet`}
          description={filters.hasActiveFilters ? "Try a different search." : `Add your first ${singular.toLowerCase()} to get started.`}
          action={!filters.hasActiveFilters && addButton}
        />
      ) : (
        <>
          <Table columns={columns} className={isFetching ? "opacity-70 transition-opacity" : ""}>
            {records.map((r) => (
              <tr key={r._id}>
                <td className={TD}>
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{r.name}</p>
                      {r.email && <p className="truncate text-xs text-slate-500">{r.email}</p>}
                    </div>
                  </div>
                </td>
                <td className={`${TD} tabular-nums text-slate-600`}>{r.phone || "—"}</td>
                {extraColumn && <td className={`${TD} text-slate-600`}>{extraColumn.render(r)}</td>}
                <MoneyCell value={r.currentBalance} strong />
                <StatusCell status={r.status} />
                <td className={`${TD} text-right`}>
                  <div className="flex items-center justify-end gap-1">
                    {r.phone && <WhatsAppButton phone={r.phone} message={`Hi ${r.name},`} />}
                    <button type="button" title="Edit" aria-label={`Edit ${r.name}`} onClick={() => openEdit(r)} className={`${iconButton} hover:bg-slate-100 hover:text-slate-700`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" title="Delete" aria-label={`Delete ${r.name}`} onClick={() => setDeleteTarget(r)} className={`${iconButton} hover:bg-rose-50 hover:text-rose-600`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={pagination} onPageChange={filters.setPage} />
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editing ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}
        size={modalSize}
        footer={
          <FormModalFooter formId={formId} onCancel={closeModal} isLoading={isCreating || isUpdating} submitLabel={editing ? "Save changes" : `Add ${singular.toLowerCase()}`} />
        }
      >
        <form id={formId} onSubmit={handleSubmit} onKeyDown={handleEnterToNext} noValidate className="grid gap-4 sm:grid-cols-2">
          <Input id="name" name="name" label="Name" required value={formData.name} onChange={handleChange} error={errors.name} className="sm:col-span-2" />
          <Input id="phone" name="phone" type="tel" label="Phone" placeholder="+60 12-345 6789" hint="Include country code for WhatsApp" value={formData.phone} onChange={handleChange} />
          <Input id="email" name="email" type="email" label="Email" placeholder="Optional" value={formData.email} onChange={handleChange} error={errors.email} />
          <Input id="address" name="address" label="Address" placeholder="Optional" value={formData.address} onChange={handleChange} className="sm:col-span-2" />
          {ExtraFields && <ExtraFields formData={formData} onChange={handleChange} />}
          {!editing && (
            <Input
              id="openingBalance"
              name="openingBalance"
              type="number"
              inputMode="decimal"
              step="any"
              label="Opening balance"
              prefix="RM"
              hint={openingBalanceHint}
              value={formData.openingBalance}
              onChange={handleChange}
              className="sm:col-span-2"
            />
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        title={`Delete ${singular.toLowerCase()}`}
        description={`Delete "${deleteTarget?.name}"? This cannot be undone. Records with a balance cannot be deleted.`}
      />
    </div>
  );
};

export default PartyDirectoryPage;
