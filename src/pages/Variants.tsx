import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as productsApi from "@/integrations/api/products";
import * as variantsApi from "@/integrations/api/variants";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductVariant } from "@/integrations/api/types";

interface VariantWithProduct extends ProductVariant {
  product?: Product;
}

export default function Variants() {
  const [open, setOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantWithProduct | null>(null);
  const [formData, setFormData] = useState({
    product_id: "",
    key: "",
    name: "",
    capacity: "",
    attributes: "",
  });
  const queryClient = useQueryClient();

  const { data: productsPage } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return productsApi.listProducts();
    },
  });

  const products = productsPage?.content || [];

  // Fetch variants for all products
  const { data: allVariants, isLoading } = useQuery({
    queryKey: ["all-variants", products.map(p => p.id).join(",")],
    queryFn: async () => {
      const variantsWithProducts: VariantWithProduct[] = [];
      for (const product of products) {
        try {
          const variants = await variantsApi.listVariantsByProduct(product.id);
          variants.forEach(v => {
            variantsWithProducts.push({ ...v, product });
          });
        } catch (error) {
          console.error(`Failed to fetch variants for product ${product.id}:`, error);
        }
      }
      return variantsWithProducts;
    },
    enabled: products.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let attributes: Record<string, any> | null = null;
      if (data.attributes.trim()) {
        try {
          attributes = JSON.parse(data.attributes);
        } catch {
          throw new Error("Invalid JSON in attributes field");
        }
      }
      return variantsApi.createVariant(data.product_id, {
        key: data.key,
        name: data.name,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        attributes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-variants"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      toast.success("Variant created successfully");
      setOpen(false);
      setFormData({ product_id: "", key: "", name: "", capacity: "", attributes: "" });
    },
    onError: (error: any) => {
      console.error("Create variant error:", error);
      toast.error(error?.message || "Failed to create variant");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      let attributes: Record<string, any> | null = null;
      if (data.attributes.trim()) {
        try {
          attributes = JSON.parse(data.attributes);
        } catch {
          throw new Error("Invalid JSON in attributes field");
        }
      }
      return variantsApi.updateVariant(id, {
        key: data.key,
        name: data.name,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        attributes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-variants"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      toast.success("Variant updated successfully");
      setOpen(false);
      setEditingVariant(null);
      setFormData({ product_id: "", key: "", name: "", capacity: "", attributes: "" });
    },
    onError: (error: any) => {
      console.error("Update variant error:", error);
      toast.error(error?.message || "Failed to update variant");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return variantsApi.deleteVariant(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-variants"] });
      queryClient.invalidateQueries({ queryKey: ["product-variants"] });
      toast.success("Variant deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete variant error:", error);
      toast.error(error?.message || "Failed to delete variant");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVariant) {
      updateMutation.mutate({ id: editingVariant.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (variant: VariantWithProduct) => {
    setEditingVariant(variant);
    setFormData({
      product_id: variant.product_id,
      key: variant.key,
      name: variant.name,
      capacity: variant.capacity?.toString() || "",
      attributes: variant.attributes ? JSON.stringify(variant.attributes, null, 2) : "",
    });
    setOpen(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingVariant(null);
      setFormData({ product_id: "", key: "", name: "", capacity: "", attributes: "" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Product Variants</h2>
          <p className="text-muted-foreground mt-1">Manage different versions and license types</p>
        </div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Variant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingVariant ? "Edit Variant" : "Create New Variant"}</DialogTitle>
                <DialogDescription>
                  {editingVariant ? "Update variant details" : "Add a new product variant"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="product_id">Product</Label>
                  <Select 
                    value={formData.product_id} 
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })} 
                    required
                    disabled={!!editingVariant}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="key">Variant Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    required
                    placeholder="e.g., standard"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Variant Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="attributes">Attributes (JSON)</Label>
                  <Textarea
                    id="attributes"
                    value={formData.attributes}
                    onChange={(e) => setFormData({ ...formData, attributes: e.target.value })}
                    placeholder='{"key": "value"}'
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingVariant ? "Update" : "Create"}
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
              <TableHead>Product</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : allVariants?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No variants found. Click "Add Variant" to create one.
                </TableCell>
              </TableRow>
            ) : (
              allVariants?.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{variant.product?.name || "-"}</TableCell>
                  <TableCell>{variant.key}</TableCell>
                  <TableCell>{variant.name}</TableCell>
                  <TableCell>{variant.capacity ?? "Unlimited"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(variant)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(variant.id)}>
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


