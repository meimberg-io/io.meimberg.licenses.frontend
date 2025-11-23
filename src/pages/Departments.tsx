import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as departmentsApi from "@/integrations/api/departments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Departments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { data: departmentsPage, isLoading, error } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      return departmentsApi.listDepartments();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return departmentsApi.createDepartment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setIsDialogOpen(false);
      setFormData({ name: "" });
    },
    onError: (error: any) => {
      console.error("Create department error:", error);
      toast.error(error?.message || "Failed to create department");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string } }) => {
      return departmentsApi.updateDepartment(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setIsDialogOpen(false);
      setEditingDepartment(null);
      setFormData({ name: "" });
    },
    onError: (error: any) => {
      console.error("Update department error:", error);
      toast.error(error?.message || "Failed to update department");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return departmentsApi.deleteDepartment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete department error:", error);
      toast.error(error?.message || "Failed to delete department");
    },
  });

  const departments = departmentsPage?.content || [];

  const handleOpenDialog = (departmentId?: string) => {
    if (departmentId) {
      const department = departments.find((d) => d.id === departmentId);
      if (department) {
        setEditingDepartment(departmentId);
        setFormData({ name: department.name });
      }
    } else {
      setEditingDepartment(null);
      setFormData({ name: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment, data: { name: formData.name } });
    } else {
      createMutation.mutate({ name: formData.name });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Departments</h2>
          <p className="text-muted-foreground mt-1">Manage user departments</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-destructive">
                  Error loading departments: {error instanceof Error ? error.message : "Unknown error"}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No departments found. Click "Add Department" to create one.
                </TableCell>
              </TableRow>
            ) : (
              departments.map((department) => (
                <TableRow 
                  key={department.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/departments/${department.id}`)}
                >
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(department.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(department.id)}
                      >
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "Create Department"}
            </DialogTitle>
            <DialogDescription>
              {editingDepartment
                ? "Update the department information."
                : "Enter the details for the new department."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Department name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingDepartment
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

