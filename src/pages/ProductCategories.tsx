import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as productCategoriesApi from "@/integrations/api/productCategories";
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

export default function ProductCategories() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "" });

  const { data: categoriesPage, isLoading, error } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      return productCategoriesApi.listProductCategories({ size: 200 });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return productCategoriesApi.createProductCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Product category created successfully");
      setIsDialogOpen(false);
      setFormData({ name: "" });
    },
    onError: (error: any) => {
      console.error("Create product category error:", error);
      toast.error(error?.message || "Failed to create product category");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string } }) => {
      return productCategoriesApi.updateProductCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Product category updated successfully");
      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: "" });
    },
    onError: (error: any) => {
      console.error("Update product category error:", error);
      toast.error(error?.message || "Failed to update product category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return productCategoriesApi.deleteProductCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      toast.success("Product category deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete product category error:", error);
      toast.error(error?.message || "Failed to delete product category");
    },
  });

  const categories = categoriesPage?.content || [];

  const handleOpenDialog = (categoryId?: string) => {
    if (categoryId) {
      const category = categories.find((c) => c.id === categoryId);
      if (category) {
        setEditingCategory(categoryId);
        setFormData({ name: category.name });
      }
    } else {
      setEditingCategory(null);
      setFormData({ name: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory, data: { name: formData.name } });
    } else {
      createMutation.mutate({ name: formData.name });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Product Categories</h2>
          <p className="text-muted-foreground mt-1">Manage product categories</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
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
                  Error loading categories: {error instanceof Error ? error.message : "Unknown error"}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No categories found. Click "Add Category" to create one.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(category.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(category.id)}
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
              {editingCategory ? "Edit Product Category" : "Create Product Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the product category information."
                : "Enter the details for the new product category."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
                placeholder="Category name"
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
                : editingCategory
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

