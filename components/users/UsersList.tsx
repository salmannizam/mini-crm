"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { UserRole, getCreatableRoles, getRoleDisplayName } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  leadCount?: number;
  reportingTo?: string;
  reportingToName?: string;
  createdAt: string;
}

export function UsersList() {
  const { addToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: UserRole.USER,
    reportingTo: "",
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.USER);
  const [availableManagers, setAvailableManagers] = useState<Array<{ id: string; name: string; role: UserRole }>>([]);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Fetch available managers when role changes
    if (formData.role) {
      fetchAvailableManagers(formData.role);
    }
  }, [formData.role]);

  const fetchCurrentUser = async () => {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const data = await res.json();
      setCurrentUserRole(data.role);
    }
  };

  const fetchAvailableManagers = async (role: UserRole) => {
    if (role === UserRole.ADMIN) {
      setAvailableManagers([]);
      return;
    }
    const res = await fetch(`/api/users?forReportingTo=${role}`);
    if (res.ok) {
      const data = await res.json();
      setAvailableManagers(data.users || []);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "User created successfully", variant: "success" });
      setCreateDialogOpen(false);
      setFormData({ name: "", email: "", password: "", role: UserRole.USER, reportingTo: "" });
      fetchUsers();
    } else {
      const error = await res.json();
      addToast({ title: "Error", description: error.error || "Failed to create user", variant: "error" });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updateData: any = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      reportingTo: formData.reportingTo || null,
    };

    const res = await fetch(`/api/users/${selectedUser._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "User updated successfully", variant: "success" });
      setEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } else {
      const error = await res.json();
      addToast({ title: "Error", description: error.error || "Failed to update user", variant: "error" });
    }
  };

  const handleToggleActive = async (user: User) => {
    const res = await fetch(`/api/users/${user._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });

    if (res.ok) {
      addToast({
        title: "Success",
        description: `User ${!user.isActive ? "activated" : "deactivated"} successfully`,
        variant: "success",
      });
      fetchUsers();
    } else {
      addToast({ title: "Error", description: "Failed to update user", variant: "error" });
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    const res = await fetch(`/api/users/${user._id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      addToast({ title: "Success", description: "User deleted successfully", variant: "success" });
      fetchUsers();
    } else {
      addToast({ title: "Error", description: "Failed to delete user", variant: "error" });
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      reportingTo: user.reportingTo || "",
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Reports To</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Leads</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.role === UserRole.ADMIN ? "blue" : "default"}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {user.reportingToName || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? "green" : "red"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.leadCount || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(user)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will be able to login with the provided credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="create-role">Role</Label>
              <Select
                id="create-role"
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setFormData({ ...formData, role: newRole, reportingTo: "" });
                }}
                required
              >
                {getCreatableRoles(currentUserRole).map((role) => (
                  <option key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </option>
                ))}
              </Select>
            </div>
            {formData.role !== UserRole.ADMIN && (
              <div>
                <Label htmlFor="create-reportingTo">Reports To</Label>
                <Select
                  id="create-reportingTo"
                  value={formData.reportingTo}
                  onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                >
                  <option value="">Select Manager</option>
                  {availableManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({getRoleDisplayName(manager.role)})
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                id="edit-role"
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setFormData({ ...formData, role: newRole, reportingTo: "" });
                }}
                required
              >
                {getCreatableRoles(currentUserRole).map((role) => (
                  <option key={role} value={role}>
                    {getRoleDisplayName(role)}
                  </option>
                ))}
              </Select>
            </div>
            {formData.role !== UserRole.ADMIN && (
              <div>
                <Label htmlFor="edit-reportingTo">Reports To</Label>
                <Select
                  id="edit-reportingTo"
                  value={formData.reportingTo}
                  onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                >
                  <option value="">Select Manager</option>
                  {availableManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({getRoleDisplayName(manager.role)})
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
