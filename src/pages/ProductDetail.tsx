import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as productsApi from "@/integrations/api/products";
import * as variantsApi from "@/integrations/api/variants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Plus, Pencil, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product, ProductVariant } from "@/integrations/api/types";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewProduct = id === "new";

  const [productForm, setProductForm] = useState({
    key: "",
    name: "",
    description: "",
  });

  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [variantForm, setVariantForm] = useState({
    key: "",
    name: "",
    capacity: "",
    attributes: "",
  });

  // Fetch product data
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (isNewProduct) return null;
      return productsApi.getProduct(id!);
    },
    enabled: !isNewProduct && !!id,
  });

  // Fetch variants for this product
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ["product-variants", id],
    queryFn: async () => {
      if (isNewProduct || !id) return [];
      return variantsApi.listVariantsByProduct(id);
    },
    enabled: !isNewProduct && !!id,
  });

  // Update form when product data loads
  useEffect(() => {
    if (product) {
      setProductForm({
        key: product.key,
        name: product.name,
        description: product.description || "",
      });
    }
  }, [product]);

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      return productsApi.createProduct(data);
    },
    onSuccess: async (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
      navigate(`/products/${newProduct.id}`);
    },
    onError: (error: any) => {
      console.error("Create product error:", error);
      toast.error(error?.message || "Failed to create product");
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      if (!id) throw new Error("Product ID is required");
      return productsApi.updateProduct(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated successfully");
    },
    onError: (error: any) => {
      console.error("Update product error:", error);
      toast.error(error?.message || "Failed to update product");
    },
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (data: typeof variantForm) => {
      if (!id) throw new Error("Product ID is required");
      let attributes: Record<string, any> | null = null;
      if (data.attributes.trim()) {
        try {
          attributes = JSON.parse(data.attributes);
        } catch {
          throw new Error("Invalid JSON in attributes field");
        }
      }
      const capacityStr = String(data.capacity || "").trim();
      const capacity = capacityStr ? parseInt(capacityStr, 10) : null;
      if (capacityStr && isNaN(capacity!)) {
        throw new Error("Capacity must be a valid number");
      }
      return variantsApi.createVariant(id, {
        key: data.key,
        name: data.name,
        capacity,
        attributes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", id] });
      toast.success("Variant created successfully");
      handleCloseVariantDialog();
    },
    onError: (error: any) => {
      console.error("Create variant error:", error);
      toast.error(error?.message || "Failed to create variant");
    },
  });

  // Update variant mutation
  const updateVariantMutation = useMutation({
    mutationFn: async ({ variantId, data }: { variantId: string; data: typeof variantForm }) => {
      let attributes: Record<string, any> | null = null;
      if (data.attributes.trim()) {
        try {
          attributes = JSON.parse(data.attributes);
        } catch {
          throw new Error("Invalid JSON in attributes field");
        }
      }
      const capacityStr = String(data.capacity || "").trim();
      const capacity = capacityStr ? parseInt(capacityStr, 10) : null;
      if (capacityStr && isNaN(capacity!)) {
        throw new Error("Capacity must be a valid number");
      }
      return variantsApi.updateVariant(variantId, {
        key: data.key,
        name: data.name,
        capacity,
        attributes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", id] });
      toast.success("Variant updated successfully");
      handleCloseVariantDialog();
    },
    onError: (error: any) => {
      console.error("Update variant error:", error);
      toast.error(error?.message || "Failed to update variant");
    },
  });

  // Delete variant mutation
  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: string) => {
      return variantsApi.deleteVariant(variantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-variants", id] });
      toast.success("Variant deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete variant error:", error);
      toast.error(error?.message || "Failed to delete variant");
    },
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewProduct) {
      createProductMutation.mutate(productForm);
    } else {
      updateProductMutation.mutate(productForm);
    }
  };

  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVariant) {
      updateVariantMutation.mutate({ variantId: editingVariant.id, data: variantForm });
    } else {
      createVariantMutation.mutate(variantForm);
    }
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    
    let capacityValue: number | null | undefined = null;
    if (typeof variant.capacity === 'number') {
      capacityValue = variant.capacity;
    } else if (typeof variant.capacity === 'object' && variant.capacity !== null) {
      const cap = variant.capacity as any;
      if (cap.present === true && typeof cap.value === 'number') {
        capacityValue = cap.value;
      }
    }
    
    let attributesValue: Record<string, any> | null = null;
    if (variant.attributes && typeof variant.attributes === 'object') {
      const attrs = variant.attributes as any;
      if (attrs.present === true && attrs.value) {
        attributesValue = attrs.value;
      } else if (!('present' in attrs)) {
        attributesValue = attrs;
      }
    }
    
    setVariantForm({
      key: variant.key,
      name: variant.name,
      capacity: capacityValue?.toString() || "",
      attributes: attributesValue ? JSON.stringify(attributesValue, null, 2) : "",
    });
    setVariantDialogOpen(true);
  };

  const handleCloseVariantDialog = () => {
    setVariantDialogOpen(false);
    setEditingVariant(null);
    setVariantForm({ key: "", name: "", capacity: "", attributes: "" });
  };

  const handleOpenVariantDialog = () => {
    setEditingVariant(null);
    setVariantForm({ key: "", name: "", capacity: "", attributes: "" });
    setVariantDialogOpen(true);
  };

  if (productLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/products")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {isNewProduct ? "New Product" : "Edit Product"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isNewProduct
              ? "Create a new product"
              : "Manage product details and variants"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProduct}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Basic details about the product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="key">Product Key</Label>
              <Input
                id="key"
                value={productForm.key}
                onChange={(e) => setProductForm({ ...productForm, key: e.target.value })}
                required
                placeholder="e.g., office-365"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {createProductMutation.isPending || updateProductMutation.isPending
                  ? "Saving..."
                  : "Save Product"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {!isNewProduct && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Product Variants</CardTitle>
                <CardDescription>Manage different versions and license types</CardDescription>
              </div>
              <Button onClick={handleOpenVariantDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variantsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        Loading variants...
                      </TableCell>
                    </TableRow>
                  ) : !variants || variants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No variants found. Click "Add Variant" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    variants.map((variant) => {
                      let capacityDisplay: string | number = "Unlimited";
                      if (typeof variant.capacity === 'number') {
                        capacityDisplay = variant.capacity;
                      } else if (typeof variant.capacity === 'object' && variant.capacity !== null) {
                        const cap = variant.capacity as any;
                        if (cap.present === true) {
                          if (typeof cap.value === 'number') {
                            capacityDisplay = cap.value;
                          } else {
                            capacityDisplay = "Unlimited";
                          }
                        } else if (cap.present === false) {
                          capacityDisplay = "Unlimited";
                        } else if ('value' in cap && typeof cap.value === 'number') {
                          capacityDisplay = cap.value;
                        }
                      }
                      return (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">{variant.key}</TableCell>
                          <TableCell>{variant.name}</TableCell>
                          <TableCell>{capacityDisplay}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditVariant(variant)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteVariantMutation.mutate(variant.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSaveVariant}>
            <DialogHeader>
              <DialogTitle>{editingVariant ? "Edit Variant" : "Create New Variant"}</DialogTitle>
              <DialogDescription>
                {editingVariant ? "Update variant information" : "Add a new variant to this product"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="variant-key">Variant Key</Label>
                <Input
                  id="variant-key"
                  value={variantForm.key}
                  onChange={(e) => setVariantForm({ ...variantForm, key: e.target.value })}
                  required
                  placeholder="e.g., standard"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="variant-name">Variant Name</Label>
                <Input
                  id="variant-name"
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={typeof variantForm.capacity === 'string' ? variantForm.capacity : String(variantForm.capacity || '')}
                  onChange={(e) => setVariantForm({ ...variantForm, capacity: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="attributes">Attributes (JSON)</Label>
                <Textarea
                  id="attributes"
                  value={variantForm.attributes}
                  onChange={(e) => setVariantForm({ ...variantForm, attributes: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createVariantMutation.isPending || updateVariantMutation.isPending}
              >
                {createVariantMutation.isPending || updateVariantMutation.isPending
                  ? "Saving..."
                  : editingVariant
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


