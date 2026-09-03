"use client";
import { useCreateRoleMutation, useGetAllPermissionsQuery, useUpdateRoleMutation } from "@/redux/features/role/roleApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";


const RoleFormModal = ({ isOpen, onClose, editingRole }) => {
  const { data: permissionData } = useGetAllPermissionsQuery();
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const permissions = permissionData?.data || [];
  const groupedPermissions = permissions.reduce((acc, p) => {
    acc[p.module] = acc[p.module] || [];
    acc[p.module].push(p);
    return acc;
  }, {});

  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingRole) {
      setName(editingRole.name);
      setSelectedPermissions(editingRole.permissions?.map((p) => p._id) || []);
    } else {
      setName("");
      setSelectedPermissions([]);
    }
  }, [editingRole, isOpen]);

  const togglePermission = (id) => {
    setSelectedPermissions((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleModule = (modulePermissions) => {
    const ids = modulePermissions.map((p) => p._id);
    const allSelected = ids.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const handleClose = () => {
    setName("");
    setSelectedPermissions([]);
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingRole && !name.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole({ id: editingRole._id, data: { permissions: selectedPermissions } }).unwrap();
        toast.success("Role updated successfully");
      } else {
        await createRole({ name, permissions: selectedPermissions }).unwrap();
        toast.success("Role created successfully");
      }
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editingRole ? `Edit "${editingRole.name}" Permissions` : "Create Custom Role"} size="xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!editingRole && (
          <Input
            id="name"
            label="Role Name"
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

        <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
          {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
            const ids = modulePermissions.map((p) => p._id);
            const allSelected = ids.every((id) => selectedPermissions.includes(id));

            return (
              <div key={module} className="border-b border-slate-100 last:border-0">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
                  <span className="text-sm font-bold capitalize text-slate-800">{module}</span>
                  <button
                    type="button"
                    onClick={() => toggleModule(modulePermissions)}
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    {allSelected ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-3">
                  {modulePermissions.map((p) => (
                    <label key={p._id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(p._id)}
                        onChange={() => togglePermission(p._id)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />
                      {p.action}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-1 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {editingRole ? "Save Permissions" : "Create Role"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RoleFormModal;