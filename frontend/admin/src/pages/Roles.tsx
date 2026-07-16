// src/pages/Roles.tsx

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  Loader2,
  ShieldCheck,
  Plus,
  RefreshCw,
  X,
  Check,
  Shield,
  Key,
  Edit2,
  Trash2,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../components/dashboard/AdminLayout";
import { Button, Input, Label } from "../components/ui/form";
import { useAuth } from "../contexts/AuthContext";
import {
  createRole,
  fetchRolesAndPermissions,
  assignPermissionsToRole,
  type RoleWithPermissions,
} from "../services/rolesApi";
import { cn } from "../lib/utils";

// ============================================
// Components
// ============================================

// Confirmation Dialog Component
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
}) {
  if (!isOpen) return null;

  const confirmStyles =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#0B2545] hover:bg-[#1a3a5c]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                variant === "danger" ? "bg-red-100" : "bg-amber-100",
              )}
            >
              {variant === "danger" ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0B2545]">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={onConfirm}
              className={cn("flex-1 h-10 text-white", confirmStyles)}
            >
              {confirmText}
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 h-10 bg-white text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
            >
              {cancelText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Role Modal Component
function EditRoleModal({
  isOpen,
  onClose,
  role,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  role: RoleWithPermissions | null;
  onSave: (newName: string) => void;
}) {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (role) {
      setName(role.name);
    }
  }, [role]);

  if (!isOpen || !role) return null;

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Role name cannot be empty.");
      return;
    }
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0B2545]">Edit Role</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name">Role Name</Label>
              <Input
                id="edit-role-name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                placeholder="e.g., Vice-Principal"
                className="mt-1.5"
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Role names should be unique and descriptive.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || name === role.name}
              className="flex-1 h-10 bg-[#0B2545] text-white hover:bg-[#1a3a5c] disabled:opacity-50"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Update Role
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 h-10 bg-white text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function Roles() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [masterPermissions, setMasterPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<string, string[]>
  >({});

  // Edit state
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(
    null,
  );
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "default" | "danger";
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const loadRoles = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRolesAndPermissions();
      setRoles(data.roles);
      setMasterPermissions(data.master_permissions);

      // Initialize selected permissions state
      const permState: Record<string, string[]> = {};
      data.roles.forEach((role) => {
        permState[role.id] = role.permissions;
      });
      setSelectedPermissions(permState);
    } catch (err) {
      setError(
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to load roles."
          : "Failed to load roles.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/auth", { replace: true });
  };

  const handleCreateRole = async (): Promise<void> => {
    if (!newRoleName.trim()) {
      toast.error("Please enter a role name.");
      return;
    }

    // Show confirmation before creating
    setConfirmDialog({
      isOpen: true,
      title: "Create New Role",
      message: `Are you sure you want to create the role "${newRoleName.trim()}"?`,
      variant: "default",
      confirmText: "Create Role",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setCreating(true);
        try {
          await createRole(newRoleName.trim());
          toast.success(`Role "${newRoleName}" created successfully!`);
          setNewRoleName("");
          setShowCreateModal(false);
          await loadRoles();
        } catch (err) {
          toast.error(
            err instanceof AxiosError
              ? err.response?.data?.message || "Failed to create role."
              : "Failed to create role.",
          );
        } finally {
          setCreating(false);
        }
      },
    });
  };

  const handleEditRole = (role: RoleWithPermissions): void => {
    setEditingRole(role);
    setShowEditModal(true);
  };

  const handleSaveRoleEdit = async (newName: string): Promise<void> => {
    if (!editingRole) return;

    setConfirmDialog({
      isOpen: true,
      title: "Update Role",
      message: `Are you sure you want to rename "${editingRole.name}" to "${newName}"?`,
      variant: "default",
      confirmText: "Update Role",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        // Note: This would need a backend endpoint to update role name
        // For now, we'll show a toast and close the modal
        toast.error(
          "Role update endpoint not yet implemented. Please implement PUT /roles/:id",
        );
        setShowEditModal(false);
        setEditingRole(null);
      },
    });
  };

  const handleDeleteRole = (role: RoleWithPermissions): void => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Role",
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      variant: "danger",
      confirmText: "Delete Role",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        // Note: This would need a backend endpoint to delete role
        toast.error(
          "Role deletion endpoint not yet implemented. Please implement DELETE /roles/:id",
        );
      },
    });
  };

  const handleTogglePermission = async (
    roleId: string,
    permission: string,
  ): Promise<void> => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const currentPermissions = selectedPermissions[roleId] || [];
    const isAdding = !currentPermissions.includes(permission);
    const newPermissions = isAdding
      ? [...currentPermissions, permission]
      : currentPermissions.filter((p) => p !== permission);

    // Show confirmation
    setConfirmDialog({
      isOpen: true,
      title: isAdding ? "Add Permission" : "Remove Permission",
      message: isAdding
        ? `Are you sure you want to add "${getPermissionLabel(permission)}" to "${role.name}"?`
        : `Are you sure you want to remove "${getPermissionLabel(permission)}" from "${role.name}"?`,
      variant: isAdding ? "default" : "danger",
      confirmText: isAdding ? "Add Permission" : "Remove Permission",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });

        // Optimistically update UI
        setSelectedPermissions((prev) => ({
          ...prev,
          [roleId]: newPermissions,
        }));

        try {
          await assignPermissionsToRole(role.name, newPermissions);
          toast.success(`Permissions updated for "${role.name}"`);
          await loadRoles();
        } catch (err) {
          // Revert on error
          setSelectedPermissions((prev) => ({
            ...prev,
            [roleId]: currentPermissions,
          }));
          toast.error(
            err instanceof AxiosError
              ? err.response?.data?.message || "Failed to update permissions."
              : "Failed to update permissions.",
          );
        }
      },
    });
  };

  const getPermissionColor = (permission: string): string => {
    if (permission.includes("manage"))
      return "bg-purple-50 text-purple-700 ring-purple-100";
    if (permission.includes("view"))
      return "bg-blue-50 text-blue-700 ring-blue-100";
    if (permission.includes("create"))
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    if (permission.includes("delete"))
      return "bg-red-50 text-red-700 ring-red-100";
    return "bg-slate-50 text-slate-700 ring-slate-100";
  };

  const getPermissionLabel = (permission: string): string => {
    return permission
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate KPIs
  const totalRoles = roles.length;
  const totalPermissions = masterPermissions.length;
  const rolesWithPermissions = roles.filter(
    (r) => r.permissions.length > 0,
  ).length;
  const rolesWithoutPermissions = roles.filter(
    (r) => r.permissions.length === 0,
  ).length;
  const totalAssignedPermissions = roles.reduce(
    (acc, r) => acc + r.permissions.length,
    0,
  );
  const unassignedPermissions = Math.max(
    0,
    totalPermissions - totalAssignedPermissions,
  );

  return (
    <AdminLayout
      title="Roles & Permissions"
      menuOpen={menuOpen}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onLogout={handleLogout}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545]">
              Roles & Permissions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Manage system roles and their associated permissions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="h-10 bg-[#0B2545] px-3 sm:px-4 text-white hover:bg-[#1a3a5c] text-sm whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span>New Role</span>
            </Button>
            <Button
              type="button"
              onClick={loadRoles}
              className="h-10 bg-white px-3 text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* KPI Cards - Responsive grid with proper breakpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
          {/* Total Roles */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-normal break-words">
                Total Roles
              </p>
              <p className="text-2xl font-bold text-[#0B2545]">{totalRoles}</p>
            </div>
          </div>

          {/* Total Permissions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-normal break-words">
                Total Permissions
              </p>
              <p className="text-2xl font-bold text-[#0B2545]">
                {totalPermissions}
              </p>
            </div>
          </div>

          {/* Roles With Permissions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-normal break-words">
                Roles With Permissions
              </p>
              <p className="text-2xl font-bold text-[#0B2545]">
                {rolesWithPermissions}
              </p>
            </div>
          </div>

          {/* Roles Without Permissions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-normal break-words">
                Roles Without Permissions
              </p>
              <p className="text-2xl font-bold text-[#0B2545]">
                {rolesWithoutPermissions}
              </p>
            </div>
          </div>

          {/* Unassigned Permissions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 whitespace-normal break-words">
                Unassigned Permissions
              </p>
              <p className="text-2xl font-bold text-[#0B2545]">
                {unassignedPermissions}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#0B2545]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Failed to load roles</p>
                <p className="mt-1">{error}</p>
                <button
                  type="button"
                  onClick={loadRoles}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B2545] ring-1 ring-red-200 hover:bg-red-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Roles Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[12.5px] min-w-[700px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 bg-slate-50/40 border-b border-slate-200">
                      <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">
                        Role
                      </th>
                      <th className="px-3 py-3 font-semibold whitespace-nowrap">
                        Permissions
                      </th>
                      <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-8 text-slate-500"
                        >
                          No roles found. Create your first role!
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr
                          key={role.id}
                          className="border-t border-slate-100 hover:bg-slate-50/50"
                        >
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-[#0B2545] shrink-0" />
                              <span className="font-semibold text-[#0B2545] text-sm">
                                {role.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {masterPermissions.map((permission) => {
                                const isChecked =
                                  selectedPermissions[role.id]?.includes(
                                    permission,
                                  ) || false;
                                return (
                                  <button
                                    key={`${role.id}-${permission}`}
                                    onClick={() =>
                                      handleTogglePermission(
                                        role.id,
                                        permission,
                                      )
                                    }
                                    className={cn(
                                      "px-1.5 sm:px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-medium ring-1 transition-all whitespace-nowrap",
                                      isChecked
                                        ? getPermissionColor(permission)
                                        : "bg-white text-slate-400 ring-slate-200 hover:bg-slate-50",
                                    )}
                                  >
                                    <span className="flex items-center gap-0.5 sm:gap-1">
                                      {isChecked && (
                                        <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                      )}
                                      {getPermissionLabel(permission)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditRole(role)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                                title="Edit role"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role)}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-slate-400 hover:text-red-600"
                                title="Delete role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-500">
              <span className="font-medium">Permission types:</span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-purple-50 ring-1 ring-purple-100" />
                Manage
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-blue-50 ring-1 ring-blue-100" />
                View
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-emerald-50 ring-1 ring-emerald-100" />
                Create
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-red-50 ring-1 ring-red-100" />
                Delete
              </span>
            </div>
          </>
        )}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0B2545]">
                Create New Role
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    value={newRoleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewRoleName(e.target.value)
                    }
                    placeholder="e.g., Vice-Principal"
                    className="mt-1.5"
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") {
                        handleCreateRole();
                      }
                    }}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Role names should be unique and descriptive.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleCreateRole}
                  disabled={creating || !newRoleName.trim()}
                  className="flex-1 h-10 bg-[#0B2545] text-white hover:bg-[#1a3a5c] disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Role
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-10 bg-white text-[#0B2545] ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      <EditRoleModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRole(null);
        }}
        role={editingRole}
        onSave={handleSaveRoleEdit}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
      />
    </AdminLayout>
  );
}

export default Roles;
