"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, Check, Pencil, Plus, Truck, X } from "lucide-react";
import { useCreateExpenseTypeMutation, useGetExpenseTypesQuery, useUpdateExpenseTypeMutation } from "@/redux/features/pos/posExpenseApi";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import SegmentedControl from "../ui/SegmentedControl";

// Client PDF: Admin Expenses / Direct Expenses
export const CLASSIFICATIONS = [
  { value: "Admin", label: "Admin", icon: Briefcase },
  { value: "Direct", label: "Direct", icon: Truck },
];

/**
 * ✅ খরচের ধরন — যোগ, নাম বদল, বন্ধ / চালু
 * যোগ করার সময় Admin না Direct বলে দিতে হয় — সেই Folder এ নিজের খরচের Account তৈরি হয়; পরে বদলানো যায় না
 * পুরনো লেনদেনে তখনকার নামই থাকে
 */
const ExpenseTypesModal = ({ isOpen, onClose }) => {
  const { data } = useGetExpenseTypesQuery(undefined, { skip: !isOpen });
  const [createType, { isLoading: isCreating }] = useCreateExpenseTypeMutation();
  const [updateType, { isLoading: isUpdating }] = useUpdateExpenseTypeMutation();
  const [newName, setNewName] = useState("");
  const [newClass, setNewClass] = useState("Admin");
  const [editing, setEditing] = useState(null); // { id, name }
  const types = data?.data || [];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createType({ name: newName.trim(), classification: newClass }).unwrap();
      toast.success(`"${newName.trim()}" added`);
      setNewName("");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add");
    }
  };

  const save = async (id, data, message) => {
    try {
      await updateType({ id, data }).unwrap();
      toast.success(message);
      setEditing(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense types" description="The list shown in New Expense — each is linked to its expense account" footer={<Button onClick={onClose}>Done</Button>}>
      <form onSubmit={handleAdd} className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <Input id="newExpenseType" label="New type" placeholder="e.g. Courier" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <SegmentedControl label="Classification" value={newClass} onChange={setNewClass} options={CLASSIFICATIONS} />
        <Button type="submit" isLoading={isCreating} disabled={!newName.trim()}>
          {!isCreating && <Plus className="h-4 w-4" />}
          Add
        </Button>
      </form>
      <p className="mb-3 text-xs text-slate-500">Admin = running the shop (rent, salaries, electricity). Direct = cost of doing the transactions (remittance charges). It cannot be changed later.</p>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {types.map((t) => (
          <li key={t._id} className="flex items-center gap-3 px-4 py-2.5">
            {editing?.id === t._id ? (
              <>
                <input
                  aria-label="Type name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="h-9 flex-1 rounded-lg border border-slate-300 px-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
                />
                <button type="button" aria-label="Save" disabled={isUpdating} onClick={() => save(t._id, { name: editing.name }, "Renamed")} className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50">
                  <Check className="h-4 w-4" />
                </button>
                <button type="button" aria-label="Cancel" onClick={() => setEditing(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${t.status === "inactive" ? "text-slate-400" : "text-slate-900"}`}>{t.name}</p>
                  <p className="truncate text-xs text-slate-500">{t.account ? `${t.account.code} ${t.account.name}` : ""}</p>
                </div>
                <Badge variant={t.classification === "Admin" ? "primary" : "info"} dot={false}>
                  {t.classification}
                </Badge>
                {t.status === "inactive" && <Badge variant="neutral">Not used</Badge>}
                <button type="button" aria-label={`Rename ${t.name}`} onClick={() => setEditing({ id: t._id, name: t.name })} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => save(t._id, { status: t.status === "inactive" ? "active" : "inactive" }, t.status === "inactive" ? "Back in use" : "No longer used")}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {t.status === "inactive" ? "Use again" : "Stop using"}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export default ExpenseTypesModal;
