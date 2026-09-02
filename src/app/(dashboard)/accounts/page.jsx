"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, ChevronRight, ChevronDown, Loader2, Lock } from "lucide-react";
import { useCreateAccountMutation, useGetAccountTreeQuery, useLazySuggestNextCodeQuery } from "@/redux/features/account/accountApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import Button from "@/compoent/ui/Button";
import Modal from "@/compoent/ui/Modal";
import Select from "@/compoent/ui/Select";
import Input from "@/compoent/ui/Input";
import EmptyState from "@/compoent/ui/EmptyState";


const TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"];

const initialFormState = { name: "", code: "", type: "Asset", parent: "", isGroup: false, openingBalance: "0" };

const AccountTreeNode = ({ node, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <div>
      <div
        className="flex items-center justify-between border-b border-neutral-100 px-3 py-2 hover:bg-neutral-50"
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button onClick={() => setIsExpanded((prev) => !prev)} className="text-neutral-400">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-xs text-neutral-400">{node.code}</span>
          <span className={`text-sm ${node.isGroup ? "font-semibold text-neutral-800" : "text-neutral-600"}`}>
            {node.name}
          </span>
          {node.isSystemAccount && <Lock className="h-3 w-3 text-neutral-300" />}
        </div>
        {!node.isGroup && (
          <span className="text-sm tabular-nums text-neutral-700">৳ {Number(node.currentBalance).toFixed(2)}</span>
        )}
      </div>
      {hasChildren && isExpanded && node.children.map((child) => <AccountTreeNode key={child._id} node={child} depth={depth + 1} />)}
    </div>
  );
};

const AccountsPage = () => {
  const { data, isLoading } = useGetAccountTreeQuery();
  const { data: allAccountsData } = useGetAccountTreeQuery(); // Parent Dropdown এর জন্য একই Data Reuse
  const [createAccount, { isLoading: isCreating }] = useCreateAccountMutation();
  const [triggerSuggestCode] = useLazySuggestNextCodeQuery();

  const tree = data?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  // Parent Dropdown এর জন্য Flat List বানানো
  const flattenAccounts = (nodes, result = []) => {
    nodes.forEach((n) => {
      if (n.isGroup) result.push(n);
      if (n.children?.length) flattenAccounts(n.children, result);
    });
    return result;
  };
  const groupAccounts = flattenAccounts(tree).filter((a) => a.type === formData.type);

  useSocketEvent("company-data-updated", () => {
    // Account Tree কে Refetch করার Query Hook এই Component এ নাই সরাসরি (useGetAccountTreeQuery নিজেই Refetch দরকার)
  });

  const handleTypeChange = async (e) => {
    const newType = e.target.value;
    setFormData((prev) => ({ ...prev, type: newType, parent: "" }));
    try {
      const result = await triggerSuggestCode(newType).unwrap();
      setFormData((prev) => ({ ...prev, code: result.data.suggestedCode }));
    } catch (err) {
      // Suggestion Fail হলেও Form ব্যবহার করা যাবে, শুধু Code Manually দিতে হবে
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
      }).unwrap();
      toast.success("Account created successfully");
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create account");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Chart of Accounts</h1>
          <p className="text-sm text-neutral-500">Manage your company&apos;s account structure</p>
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
        <EmptyState title="No accounts yet" description="Create your first account to get started" />
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white">
          {tree.map((node) => (
            <AccountTreeNode key={node._id} node={node} />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Account">
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
            label="Parent Account (optional)"
            value={formData.parent}
            onChange={(e) => setFormData((prev) => ({ ...prev, parent: e.target.value }))}
          >
            <option value="">No parent (top-level)</option>
            {groupAccounts.map((g) => (
              <option key={g._id} value={g._id}>
                {g.code} — {g.name}
              </option>
            ))}
          </Select>

          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={formData.isGroup}
              onChange={(e) => setFormData((prev) => ({ ...prev, isGroup: e.target.checked }))}
              className="h-4 w-4 rounded border-neutral-300 text-indigo-600"
            />
            This is a Group Account (category, cannot receive transactions directly)
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

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
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