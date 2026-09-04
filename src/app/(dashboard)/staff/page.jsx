"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, Users, Shield } from "lucide-react";
import { useGetAllStaffQuery, useUpdateStaffMutation } from "@/redux/features/auth/authApi";
import { useDeleteRoleMutation, useGetAllRolesQuery } from "@/redux/features/role/roleApi";
import Button from "@/compoent/ui/Button";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Avatar from "@/compoent/ui/Avatar";
import Badge from "@/compoent/ui/Badge";
import AddStaffModal from "@/compoent/settings/AddStaffModal";
import RoleFormModal from "@/compoent/settings/RoleFormModal";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";


const STAFF_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const StaffPage = () => {
  const { data: staffData, isLoading: isStaffLoading } = useGetAllStaffQuery({ limit: 100 });
  const { data: roleData, isLoading: isRoleLoading } = useGetAllRolesQuery();
  const [updateStaff] = useUpdateStaffMutation();
  const [deleteRole, { isLoading: isDeletingRole }] = useDeleteRoleMutation();

  const staff = staffData?.data?.data || [];
  const roles = roleData?.data || [];
  const assignableRoles = roles.filter((r) => !r.isCompanyAdminRole);

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);

 const handleRoleChange = async (staffMember, newRoleId) => {
  try {
    // ✅ "role" এর বদলে "roleId" পাঠানো হচ্ছে (Backend এর updateStaffRoleOrBranch 
    // Function ও roleId Field আশা করে)
    await updateStaff({ id: staffMember._id, data: { roleId: newRoleId } }).unwrap();
    toast.success(`${staffMember.name}'s role updated`);
  } catch (err) {
    toast.error(err?.data?.message || "Failed to update role");
  }
};

  const handleToggleActive = async (staffMember) => {
    try {
      await updateStaff({ id: staffMember._id, data: { isActive: !staffMember.isActive } }).unwrap();
      toast.success(`${staffMember.name} ${staffMember.isActive ? "deactivated" : "activated"}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteRole = async () => {
    try {
      await deleteRole(deleteRoleTarget._id).unwrap();
      toast.success("Role deleted successfully");
      setDeleteRoleTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete role");
    }
  };

  return (
    <div className="p-6">
      {/* Staff Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Staff Members</h1>
          <p className="mt-0.5 text-sm text-slate-600">Manage your team and their access levels</p>
        </div>
        <Button onClick={() => setIsAddStaffOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {isStaffLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : staff.length === 0 ? (
        <EmptyState icon={Users} title="No staff members yet" description="Add your first team member" />
      ) : (
        <Table columns={STAFF_COLUMNS}>
          {staff.map((s) => (
            <tr key={s._id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} />
                  <span className="font-semibold text-slate-900">{s.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-700">{s.email}</td>
              <td className="px-4 py-3">
                {s.role?.isCompanyAdminRole ? (
                  <Badge variant="primary">Company Admin</Badge>
                ) : (
                  <select
                    value={s.role?._id || ""}
                    onChange={(e) => handleRoleChange(s, e.target.value)}
                    className="h-8 rounded-md border border-slate-300 px-2 text-xs"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Suspended"}</Badge>
              </td>
              <td className="px-4 py-3 text-right">
                {!s.role?.isCompanyAdminRole && (
                  <Button size="sm" variant="ghost" onClick={() => handleToggleActive(s)}>
                    {s.isActive ? "Suspend" : "Activate"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Roles Section */}
      <div className="mb-6 mt-10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Roles & Permissions</h2>
          <p className="mt-0.5 text-sm text-slate-600">Customize what each role can access</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setEditingRole(null);
            setIsRoleFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Custom Role
        </Button>
      </div>

      {isRoleLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <div key={r._id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <span className="font-semibold text-slate-900">{r.name}</span>
                </div>
                {r.isSystemRole && <Badge variant="neutral">System</Badge>}
              </div>
              <p className="mt-2 text-xs text-slate-500">{r.permissions?.length || 0} permissions</p>
              <div className="mt-3 flex gap-2">
                {!r.isCompanyAdminRole && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingRole(r);
                      setIsRoleFormOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
                {!r.isSystemRole && (
                  <Button size="sm" variant="ghost" onClick={() => setDeleteRoleTarget(r)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddStaffModal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} />
      <RoleFormModal isOpen={isRoleFormOpen} onClose={() => setIsRoleFormOpen(false)} editingRole={editingRole} />

      <ConfirmDialog
        isOpen={Boolean(deleteRoleTarget)}
        onClose={() => setDeleteRoleTarget(null)}
        onConfirm={handleDeleteRole}
        isLoading={isDeletingRole}
        title="Delete Role"
        description={`Delete "${deleteRoleTarget?.name}"? Staff assigned to this role will need to be reassigned first.`}
      />
    </div>
  );
};

export default StaffPage;