"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Shield, ShieldCheck, Trash2, UserCheck, UserX, Users } from "lucide-react";
import { useGetAllStaffQuery, useUpdateStaffMutation } from "@/redux/features/auth/authApi";
import { useGetAllBranchesQuery } from "@/redux/features/branch/branchApi";
import { useDeleteRoleMutation, useGetAllRolesQuery } from "@/redux/features/role/roleApi";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Button from "@/compoent/ui/Button";
import Avatar from "@/compoent/ui/Avatar";
import Badge from "@/compoent/ui/Badge";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import { TD } from "@/compoent/ui/TableCells";
import AddStaffModal from "@/compoent/settings/AddStaffModal";
import RoleFormModal from "@/compoent/settings/RoleFormModal";

const STAFF_COLUMNS = [
  { key: "name", label: "Staff" },
  { key: "role", label: "Role" },
  { key: "branch", label: "Branch" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const inlineSelect =
  "h-8 max-w-[180px] cursor-pointer rounded-lg border border-slate-300 bg-white px-2 text-[13px] text-slate-700 hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15";

const TABS = [
  { value: "staff", label: "Staff", icon: Users },
  { value: "roles", label: "Roles & permissions", icon: Shield },
];

const StaffPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("staff");
  const { data: staffData, isLoading: isStaffLoading } = useGetAllStaffQuery({ limit: 100 });
  const { data: roleData, isLoading: isRoleLoading } = useGetAllRolesQuery();
  const { data: branchData } = useGetAllBranchesQuery({ limit: 100 });
  const [updateStaff] = useUpdateStaffMutation();
  const [deleteRole, { isLoading: isDeletingRole }] = useDeleteRoleMutation();

  const staff = staffData?.data?.data || [];
  const roles = roleData?.data || [];
  const branches = branchData?.data?.data || [];
  const assignableRoles = roles.filter((r) => !r.isCompanyAdminRole);

  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState(null);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const update = async (member, data, message) => {
    try {
      await updateStaff({ id: member._id, data }).unwrap();
      toast.success(message);
      return true;
    } catch (err) {
      toast.error(err?.data?.message || "Update failed");
      return false;
    }
  };

  const handleDeleteRole = async () => {
    try {
      await deleteRole(deleteRoleTarget._id).unwrap();
      toast.success("Role deleted");
      setDeleteRoleTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete role");
    }
  };

  const openRoleForm = (role) => {
    setEditingRole(role);
    setIsRoleFormOpen(true);
  };

  const staffCountByRole = staff.reduce((acc, s) => {
    const id = s.role?._id;
    if (id) acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Roles & Staff"
        description="Who can sign in, which branch they work at, and what they can do"
        actions={
          tab === "staff" ? (
            <Button onClick={() => setIsAddStaffOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          ) : (
            <Button onClick={() => openRoleForm(null)}>
              <Plus className="h-4 w-4" />
              Custom Role
            </Button>
          )
        }
      />

      <div role="tablist" className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === value ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className={`rounded-full px-1.5 text-xs ${tab === value ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
              {value === "staff" ? staff.length : roles.length}
            </span>
          </button>
        ))}
      </div>

      {tab === "staff" &&
        (isStaffLoading ? (
          <PageLoader />
        ) : staff.length === 0 ? (
          <EmptyState icon={Users} title="No staff yet" description="Add cashiers and managers so they can sign in." />
        ) : (
          <Table columns={STAFF_COLUMNS}>
            {staff.map((s) => {
              const isAdmin = s.role?.isCompanyAdminRole;
              const isSelf = s._id === user?._id;
              return (
                <tr key={s._id} className={s.isActive ? "" : "opacity-60"}>
                  <td className={TD}>
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {s.name}
                          {isSelf && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}
                        </p>
                        <p className="truncate text-xs text-slate-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={TD}>
                    {isAdmin ? (
                      <Badge variant="primary" dot={false}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Company Admin
                      </Badge>
                    ) : (
                      <select
                        aria-label={`Role for ${s.name}`}
                        value={s.role?._id || ""}
                        onChange={(e) => update(s, { roleId: e.target.value }, `${s.name}'s role updated`)}
                        className={inlineSelect}
                      >
                        {!s.role && <option value="">No role</option>}
                        {assignableRoles.map((r) => (
                          <option key={r._id} value={r._id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className={TD}>
                    {isAdmin ? (
                      <span className="text-[13px] text-slate-500">All branches</span>
                    ) : (
                      <select
                        aria-label={`Branch for ${s.name}`}
                        value={s.branch?._id || ""}
                        onChange={(e) => update(s, { branch: e.target.value || null }, `${s.name}'s branch updated`)}
                        className={inlineSelect}
                      >
                        <option value="">All branches</option>
                        {branches.map((b) => (
                          <option key={b._id} value={b._id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className={TD}>
                    <Badge variant={s.isActive ? "success" : "neutral"}>{s.isActive ? "Active" : "Suspended"}</Badge>
                  </td>
                  <td className={`${TD} text-right`}>
                    {!isAdmin &&
                      (s.isActive ? (
                        <Button size="xs" variant="ghost" onClick={() => setSuspendTarget(s)}>
                          <UserX className="h-3.5 w-3.5" />
                          Suspend
                        </Button>
                      ) : (
                        <Button size="xs" variant="soft" onClick={() => update(s, { isActive: true }, `${s.name} reactivated`)}>
                          <UserCheck className="h-3.5 w-3.5" />
                          Activate
                        </Button>
                      ))}
                  </td>
                </tr>
              );
            })}
          </Table>
        ))}

      {tab === "roles" &&
        (isRoleLoading ? (
          <PageLoader />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roles.map((r) => (
              <div key={r._id} className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.isCompanyAdminRole ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                      {r.isCompanyAdminRole ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">
                        {r.permissions?.length || 0} permissions · {staffCountByRole[r._id] || 0} staff
                      </p>
                    </div>
                  </div>
                  {r.isSystemRole && (
                    <Badge variant="neutral" dot={false}>
                      System
                    </Badge>
                  )}
                </div>
                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  {r.isCompanyAdminRole ? (
                    <p className="text-xs text-slate-500">Full access — cannot be edited.</p>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => openRoleForm(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit permissions
                    </Button>
                  )}
                  {!r.isSystemRole && (
                    <Button size="sm" variant="ghost" onClick={() => setDeleteRoleTarget(r)}>
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

      <AddStaffModal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} />
      <RoleFormModal isOpen={isRoleFormOpen} onClose={() => setIsRoleFormOpen(false)} editingRole={editingRole} />

      <ConfirmDialog
        isOpen={Boolean(suspendTarget)}
        onClose={() => setSuspendTarget(null)}
        onConfirm={async () => {
          if (await update(suspendTarget, { isActive: false }, `${suspendTarget.name} suspended`)) setSuspendTarget(null);
        }}
        confirmLabel="Suspend"
        title={`Suspend ${suspendTarget?.name || ""}`}
        description={`${suspendTarget?.name} will no longer be able to sign in. You can reactivate them any time.`}
      />
      <ConfirmDialog
        isOpen={Boolean(deleteRoleTarget)}
        onClose={() => setDeleteRoleTarget(null)}
        onConfirm={handleDeleteRole}
        isLoading={isDeletingRole}
        confirmLabel="Delete role"
        title={`Delete "${deleteRoleTarget?.name || ""}"`}
        description="Staff with this role must be moved to another role first."
      />
    </div>
  );
};

export default StaffPage;
