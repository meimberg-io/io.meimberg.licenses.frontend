import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as departmentsApi from "@/integrations/api/departments";
import * as usersApi from "@/integrations/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Department, User } from "@/integrations/api/types";

export default function DepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewDepartment = id === "new";

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
  });

  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch department data
  const { data: department, isLoading: departmentLoading } = useQuery({
    queryKey: ["department", id],
    queryFn: async () => {
      if (isNewDepartment) return null;
      return departmentsApi.getDepartment(id!);
    },
    enabled: !isNewDepartment && !!id,
  });

  // Fetch all users
  const { data: allUsersPage } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return usersApi.listUsers();
    },
  });

  // Fetch users in this department
  const { data: departmentUsersPage } = useQuery({
    queryKey: ["users", "department", id],
    queryFn: async () => {
      if (isNewDepartment || !id) return { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 };
      return usersApi.listUsers({ departmentId: id });
    },
    enabled: !isNewDepartment && !!id,
  });

  const allUsers = allUsersPage?.content || [];
  const departmentUsers = departmentUsersPage?.content || [];
  const departmentUserIds = new Set(departmentUsers.map((u) => u.id));
  const availableUsers = allUsers.filter((u) => !departmentUserIds.has(u.id));

  // Update form when department data loads
  useEffect(() => {
    if (department) {
      setDepartmentForm({
        name: department.name,
      });
    }
  }, [department]);

  // Create department mutation
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: typeof departmentForm) => {
      return departmentsApi.createDepartment(data);
    },
    onSuccess: async (newDepartment) => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      navigate(`/departments/${newDepartment.id}`);
    },
    onError: (error: any) => {
      console.error("Create department error:", error);
      toast.error(error?.message || "Failed to create department");
    },
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async (data: typeof departmentForm) => {
      if (!id) throw new Error("Department ID is required");
      return departmentsApi.updateDepartment(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department", id] });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
    },
    onError: (error: any) => {
      console.error("Update department error:", error);
      toast.error(error?.message || "Failed to update department");
    },
  });

  // Add user to department mutation
  const addUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!id) throw new Error("Department ID is required");
      const user = allUsers.find((u) => u.id === userId);
      if (!user) throw new Error("User not found");
      return usersApi.updateUser(userId, { departmentId: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "department", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User added to department successfully");
      setAddUserDialogOpen(false);
      setSelectedUserId("");
    },
    onError: (error: any) => {
      console.error("Add user error:", error);
      toast.error(error?.message || "Failed to add user to department");
    },
  });

  // Remove user from department mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return usersApi.updateUser(userId, { departmentId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "department", id] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User removed from department successfully");
    },
    onError: (error: any) => {
      console.error("Remove user error:", error);
      toast.error(error?.message || "Failed to remove user from department");
    },
  });

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewDepartment) {
      createDepartmentMutation.mutate(departmentForm);
    } else {
      updateDepartmentMutation.mutate(departmentForm);
    }
  };

  const handleAddUser = () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }
    addUserMutation.mutate(selectedUserId);
  };

  if (departmentLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-right">
          {isNewDepartment ? "New Department" : (department?.name || departmentForm?.name || "Department")}
        </h2>
      </div>

      <form onSubmit={handleSaveDepartment}>
        <Card>
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
            <CardDescription>Basic details about the department</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={createDepartmentMutation.isPending || updateDepartmentMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {createDepartmentMutation.isPending || updateDepartmentMutation.isPending
                ? "Saving..."
                : "Save Department"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {!isNewDepartment && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Assigned Users</CardTitle>
                <CardDescription>Users assigned to this department</CardDescription>
              </div>
              <Button
                onClick={() => setAddUserDialogOpen(true)}
                className="gap-2"
                disabled={availableUsers.length === 0}
              >
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {departmentUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No users assigned to this department.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.displayName}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUserMutation.mutate(user.id)}
                          disabled={removeUserMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Department</DialogTitle>
            <DialogDescription>
              Select a user to add to this department
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-select">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No available users
                    </SelectItem>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddUserDialogOpen(false);
                setSelectedUserId("");
              }}
              disabled={addUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={addUserMutation.isPending || !selectedUserId}
            >
              {addUserMutation.isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

