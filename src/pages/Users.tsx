import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "@/integrations/api/users";
import * as departmentsApi from "@/integrations/api/departments";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/integrations/api/types";

export default function Users() {
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ email: "", displayName: "", departmentId: "" });
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: departmentsPage } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      return departmentsApi.listDepartments();
    },
  });

  const { data: usersPage, isLoading } = useQuery({
    queryKey: ["users", selectedDepartmentId === "all" ? null : selectedDepartmentId],
    queryFn: async () => {
      return usersApi.listUsers({
        departmentId: selectedDepartmentId === "all" ? undefined : selectedDepartmentId,
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; displayName: string; departmentId: string }) => {
      return usersApi.createUser(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setOpen(false);
      setFormData({ email: "", displayName: "", departmentId: "" });
    },
    onError: (error: any) => {
      console.error("Create user error:", error);
      toast.error(error?.message || "Failed to create user");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { email?: string; displayName?: string; departmentId?: string } }) => {
      return usersApi.updateUser(id, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate all user queries, including department-filtered ones
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Also invalidate the old department's user list if department changed
      if (editingUser && variables.data.departmentId && editingUser.departmentId !== variables.data.departmentId) {
        queryClient.invalidateQueries({ queryKey: ["users", editingUser.departmentId] });
      }
      // Invalidate the new department's user list
      if (variables.data.departmentId) {
        queryClient.invalidateQueries({ queryKey: ["users", variables.data.departmentId] });
      }
      // Invalidate department detail pages that might show this user
      queryClient.invalidateQueries({ queryKey: ["users", "department"] });
      // Refetch the current query to ensure the list updates
      queryClient.refetchQueries({ 
        queryKey: ["users", selectedDepartmentId === "all" ? null : selectedDepartmentId] 
      });
      toast.success("User updated successfully");
      setOpen(false);
      setEditingUser(null);
      setFormData({ email: "", displayName: "", departmentId: "" });
    },
    onError: (error: any) => {
      console.error("Update user error:", error);
      toast.error(error?.message || "Failed to update user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return usersApi.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete user error:", error);
      toast.error(error?.message || "Failed to delete user");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ email: user.email, displayName: user.displayName, departmentId: user.departmentId });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingUser(null);
      setFormData({ email: "", displayName: "", departmentId: "" });
    }
  };

  const users = usersPage?.content || [];
  const departments = departmentsPage?.content || [];
  const departmentMap = new Map(departments.map((d) => [d.id, d.name]));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Users</h2>
          <p className="text-muted-foreground mt-1">Manage users who can receive license assignments</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                <DialogDescription>
                  {editingUser ? "Update user information" : "Add a new user to the system"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="departmentId">Department *</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsPage?.content?.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingUser ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 items-end">
        <div className="grid gap-2 flex-1 max-w-xs">
          <Label htmlFor="department-filter">Filter by Department</Label>
          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
            <SelectTrigger id="department-filter">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No users found. Click "Add User" to create one.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{departmentMap.get(user.departmentId) || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(user.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


