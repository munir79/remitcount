"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronRight, ChevronDown, Loader2, Lock, Folder, FolderOpen, FileText } from "lucide-react";
import { useCreateAccountMutation, useGetAccountTreeQuery, useLazySuggestNextCodeQuery } from "@/redux/features/account/accountApi";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Modal from "@/compoent/ui/Modal";
import Select from "@/compoent/ui/Select";
import Input from "@/compoent/ui/Input";
import { useSocketEvent } from "@/socket/useSocketEvent";


const TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"];

const TYPE_COLORS = {
  Asset: "text-sky-600",
  Liability: "text-rose-600",
  Equity: "text-violet-600",
  Income: "text-emerald-600",
  Expense: "text-amber-600",
};

const initialFormState = { name: "", code: "", type: "Asset", parent: "", isGroup: false, openingBalance: "0" };

const AccountTreeNode = ({ node, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  if (node.isGroup) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2.5 text-left transition hover:bg-slate-50"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            )
          ) : (
            <span className="w-4 shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className={`h-4 w-4 shrink-0 ${TYPE_COLORS[node.type] || "text-slate-400"}`} />
          ) : (
            <Folder className={`h-4 w-4 shrink-0 ${TYPE_COLORS[node.type] || "text-slate-400"}`} />
          )}
          <span className="text-xs text-slate-400">{node.code}</span>
          <span className="text-sm font-bold text-slate-800">{node.name}</span>
          {node.isSystemAccount && <Lock className="h-3 w-3 text-slate-300" />}
          <span className="ml-auto text-xs text-slate-400">
            {node.children?.length || 0} {node.children?.length === 1 ? "item" : "items"}
          </span>
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => (
              <AccountTreeNode key={child._id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Leaf Account — একটা "File" এর মতো, Balance সহ
  return (
    <div
      className="flex items-center justify-between border-b border-slate-50 px-3 py-2.5 transition hover:bg-slate-50"
      style={{ paddingLeft: `${depth * 24 + 12 + 22}px` }}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 shrink-0 text-slate-300" />
        <span className="text-xs text-slate-400">{node.code}</span>
        <span className="text-sm text-slate-700">{node.name}</span>
        {node.isSystemAccount && <Lock className="h-3 w-3 text-slate-300" />}
      </div>
      <span className="text-sm tabular-nums font-semibold text-slate-900">৳ {Number(node.currentBalance).toFixed(2)}</span>
    </div>
  );
};

const AccountsPage = () => {
  const { data, isLoading, refetch } = useGetAccountTreeQuery();
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
  const [triggerSuggestCode] = useLazySuggestNextCodeQuery();

  const tree = data?.data || [];

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Account") refetch();
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const flattenAccounts = (nodes, result = []) => {
    nodes.forEach((n) => {
      if (n.isGroup) result.push(n);
      if (n.children?.length) flattenAccounts(n.children, result);
    });
    return result;
  };
  const groupAccounts = flattenAccounts(tree).filter((a) => a.type === formData.type);

  const handleTypeChange = async (e) => {
    const newType = e.target.value;
    setFormData((prev) => ({ ...prev, type: newType, parent: "" }));
    try {
      const result = await triggerSuggestCode(newType).unwrap();
      setFormData((prev) => ({ ...prev, code: result.data.suggestedCode }));
    } catch (err) {
      // Ignore — Suggestion Fail হলেও Manually Code দেওয়া যাবে
    }
  };

  const openCreateModal = async () => {
    setFormData(initialFormState);
    setErrors({});
    setIsModalOpen(true);
    try {
      const result = await triggerSuggestCode("Asset").unwrap();
      setFormData((prev) => ({ ...prev, code: result.data.suggestedCode }));
    } catch (err) {
      // Ignore
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Account name is required";
    if (!formData.code.trim()) newErrors.code = "Account code is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createAccount({
        name: formData.name,
        code: formData.code,
        type: formData.type,
        parent: formData.parent || null,
        isGroup: formData.isGroup,
        openingBalance: Number(formData.openingBalance) || 0,
        clientRequestId: crypto.randomUUID(),
      }).unwrap();
      toast.success("Account created successfully");
      closeModal();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create account");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Chart of Accounts</h1>
          <p className="mt-0.5 text-sm text-slate-600">Folder-organized view of your account structure</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : tree.length === 0 ? (
        <EmptyState icon={Folder} title="No accounts yet" description="Create your first account to get started" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {tree.map((node) => (
            <AccountTreeNode key={node._id} node={node} />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Create Account">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Select id="type" label="Account Type" value={formData.type} onChange={handleTypeChange}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="code"
              label="Code"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              error={errors.code}
            />
            <Input
              id="name"
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              error={errors.name}
            />
          </div>

          <Select
            id="parent"
            label="Parent Folder (optional)"
            value={formData.parent}
            onChange={(e) => setFormData((prev) => ({ ...prev, parent: e.target.value }))}
          >
            <option value="">No parent (top-level)</option>
            {groupAccounts.map((g) => (
              <option key={g._id} value={g._id}>
                📁 {g.code} — {g.name}
              </option>
            ))}
          </Select>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.isGroup}
              onChange={(e) => setFormData((prev) => ({ ...prev, isGroup: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            This is a Folder (Group Account — cannot receive transactions directly)
          </label>

          {!formData.isGroup && (
            <Input
              id="openingBalance"
              type="number"
              label="Opening Balance"
              value={formData.openingBalance}
              onChange={(e) => setFormData((prev) => ({ ...prev, openingBalance: e.target.value }))}
            />
          )}

          <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountsPage;