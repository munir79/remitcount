"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Search } from "lucide-react";
import { useCreateRoleMutation, useGetAllPermissionsQuery, useUpdateRoleMutation } from "@/redux/features/role/roleApi";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import FormModalFooter from "../ui/FormModalFooter";

const FORM_ID = "role-form";

// "currencyStock" → "Currency Stock"
const humanize = (key = "") => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());

/**
 * ✅ Form এর State শুধু এখানে — Parent এ key বদলালে নতুন করে Mount হয়,
 * তাই editingRole থেকে State ভরাতে useEffect লাগে না (আগের Lint Error এর Fix)
 */
const RoleForm = ({ editingRole, onDone, setSubmitting }) => {
  const { data: permissionData } = useGetAllPermissionsQuery();
  const [createRole] = useCreateRoleMutation();
  const [updateRole] = useUpdateRoleMutation();

  const [name, setName] = useState(editingRole?.name || "");
  const [selected, setSelected] = useState(() => new Set(editingRole?.permissions?.map((p) => p._id) || []));
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const map = new Map();
    for (const p of permissionData?.data || []) {
      if (q && !`${p.module} ${p.action} ${p.description || ""}`.toLowerCase().includes(q)) continue;
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module).push(p);
    }
    return [...map.entries()];
  }, [permissionData, filter]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleModule = (perms) => {
    const allOn = perms.every((p) => selected.has(p._id));
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (allOn ? next.delete(p._id) : next.add(p._id)));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRole && !name.trim()) {
      setError("Enter a role name");
      return;
    }
    setSubmitting(true);
    try {
      const permissions = [...selected];
      if (editingRole) {
        await updateRole({ id: editingRole._id, data: { permissions } }).unwrap();
        toast.success(`"${editingRole.name}" permissions saved`);
      } else {
        await createRole({ name: name.trim(), permissions }).unwrap();
        toast.success(`Role "${name.trim()}" created`);
      }
      onDone();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_240px] sm:items-end">
        {editingRole ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{selected.size}</span> permissions selected
          </p>
        ) : (
          <Input
            id="roleName"
            label="Role name"
            required
            placeholder="e.g. Branch Manager"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            error={error}
          />
        )}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter permissions…"
            aria-label="Filter permissions"
            className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
          />
        </div>
      </div>

      <div className="scrollbar-thin max-h-[52vh] space-y-3 overflow-y-auto pr-1">
        {groups.map(([module, perms]) => {
          const onCount = perms.filter((p) => selected.has(p._id)).length;
          const allOn = onCount === perms.length;
          return (
            <section key={module} className="rounded-xl border border-slate-200">
              <div className="flex items-center justify-between rounded-t-xl bg-slate-50 px-4 py-2.5">
                <span className="text-sm font-semibold text-slate-800">
                  {humanize(module)}
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    {onCount}/{perms.length}
                  </span>
                </span>
                <button type="button" onClick={() => toggleModule(perms)} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  {allOn ? "Clear" : "Select all"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2 p-3">
                {perms.map((p) => {
                  const isOn = selected.has(p._id);
                  return (
                    <button
                      key={p._id}
                      type="button"
                      role="checkbox"
                      aria-checked={isOn}
                      title={p.description}
                      onClick={() => toggle(p._id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ring-1 ring-inset transition ${
                        isOn ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isOn && <Check className="h-3.5 w-3.5" />}
                      {humanize(p.action)}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {groups.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No permissions match “{filter}”.</p>}
      </div>
    </form>
  );
};

const RoleFormModal = ({ isOpen, onClose, editingRole }) => {
  const [isSubmitting, setSubmitting] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRole ? `Edit "${editingRole.name}"` : "Create custom role"}
      description="Choose what people with this role can see and do"
      size="2xl"
      footer={
        <FormModalFooter formId={FORM_ID} onCancel={onClose} isLoading={isSubmitting} submitLabel={editingRole ? "Save permissions" : "Create role"} showEnterHint={false} />
      }
    >
      {isOpen && <RoleForm key={editingRole?._id || "new"} editingRole={editingRole} onDone={onClose} setSubmitting={setSubmitting} />}
    </Modal>
  );
};

export default RoleFormModal;
