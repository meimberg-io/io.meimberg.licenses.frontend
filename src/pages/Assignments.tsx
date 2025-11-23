import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "@/integrations/api/users";
import * as variantsApi from "@/integrations/api/variants";
import * as assignmentsApi from "@/integrations/api/assignments";
import * as productsApi from "@/integrations/api/products";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Assignment, User, ProductVariant, Product } from "@/integrations/api/types";

interface AssignmentWithDetails extends Assignment {
  user?: User;
  variant?: ProductVariant;
  product?: Product;
}

export default function Assignments() {
  const [open, setOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState({
    userId: "",
    productVariantId: "",
    startsAt: "",
    note: "",
  });
  const queryClient = useQueryClient();

  const { data: usersPage } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return usersApi.listUsers();
    },
  });

  const { data: productsPage } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return productsApi.listProducts();
    },
  });

  const products = productsPage?.content || [];

  // Fetch all variants for all products
  const { data: allVariants } = useQuery({
    queryKey: ["all-variants-for-assignments", products.map(p => p.id).join(",")],
    queryFn: async () => {
      const variants: (ProductVariant & { product?: Product })[] = [];
      for (const product of products) {
        try {
          const productVariants = await variantsApi.listVariantsByProduct(product.id);
          productVariants.forEach(v => {
            variants.push({ ...v, product });
          });
        } catch (error) {
          console.error(`Failed to fetch variants for product ${product.id}:`, error);
        }
      }
      return variants;
    },
    enabled: products.length > 0,
  });

  const { data: assignmentsPage, isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      return assignmentsApi.listAssignments();
    },
  });

  const assignmentsWithDetails = useMemo<AssignmentWithDetails[]>(() => {
    if (!assignmentsPage?.content || !usersPage?.content || !allVariants) {
      return [];
    }
    const users = usersPage.content;
    return assignmentsPage.content.map(assignment => {
      const user = users.find(u => u.id === assignment.userId);
      const variant = allVariants.find(v => v.id === assignment.productVariantId);
      const product = variant?.product;
      return {
        ...assignment,
        user,
        variant,
        product,
      };
    });
  }, [assignmentsPage, usersPage, allVariants]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return assignmentsApi.createAssignment({
        userId: data.userId,
        productVariantId: data.productVariantId,
        startsAt: data.startsAt || null,
        note: data.note || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment created successfully");
      setOpen(false);
      setFormData({ userId: "", productVariantId: "", startsAt: "", note: "" });
    },
    onError: (error: any) => {
      console.error("Create assignment error:", error);
      toast.error(error?.message || "Failed to create assignment");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      return assignmentsApi.updateAssignment(id, {
        status: "REVOKED",
        endsAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment revoked successfully");
    },
    onError: (error: any) => {
      console.error("Revoke assignment error:", error);
      toast.error(error?.message || "Failed to revoke assignment");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      return assignmentsApi.updateAssignment(id, {
        status: "ACTIVE",
        endsAt: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment reactivated successfully");
    },
    onError: (error: any) => {
      console.error("Reactivate assignment error:", error);
      toast.error(error?.message || "Failed to reactivate assignment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleRevoke = (assignment: Assignment) => {
    if (confirm("Are you sure you want to revoke this assignment?")) {
      revokeMutation.mutate(assignment.id);
    }
  };

  const handleReactivate = (assignment: Assignment) => {
    reactivateMutation.mutate(assignment.id);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingAssignment(null);
      setFormData({ userId: "", productVariantId: "", startsAt: "", note: "" });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "ACTIVE") {
      return <Badge variant="default">Active</Badge>;
    } else if (status === "REVOKED") {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  const users = usersPage?.content || [];
  const assignments = assignmentsWithDetails;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">License Assignments</h2>
          <p className="text-muted-foreground mt-1">Assign product licenses to users</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Assign a license to a user
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="userId">User</Label>
                  <Select 
                    value={formData.userId} 
                    onValueChange={(value) => setFormData({ ...formData, userId: value })} 
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="productVariantId">Product Variant</Label>
                  <Select
                    value={formData.productVariantId}
                    onValueChange={(value) => setFormData({ ...formData, productVariantId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {allVariants?.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.product?.name} - {variant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startsAt">Start Date (optional)</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Starts</TableHead>
              <TableHead>Ends</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : assignments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No assignments found. Click "New Assignment" to create one.
                </TableCell>
              </TableRow>
            ) : (
              assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.user?.displayName || "-"}</div>
                      <div className="text-sm text-muted-foreground">{assignment.user?.email || "-"}</div>
                    </div>
                  </TableCell>
                  <TableCell>{assignment.product?.name || "-"}</TableCell>
                  <TableCell>{assignment.variant?.name || "-"}</TableCell>
                  <TableCell>
                    {assignment.startsAt ? format(new Date(assignment.startsAt), "PPp") : "-"}
                  </TableCell>
                  <TableCell>
                    {assignment.endsAt ? format(new Date(assignment.endsAt), "PPp") : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {assignment.status === "ACTIVE" ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRevoke(assignment)}
                          title="Revoke"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleReactivate(assignment)}
                          title="Reactivate"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
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


