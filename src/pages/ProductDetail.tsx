import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as productsApi from "@/integrations/api/products";
import * as variantsApi from "@/integrations/api/variants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import * as manufacturersApi from "@/integrations/api/manufacturers";
import { CreateManufacturerDialog } from "@/components/CreateManufacturerDialog";
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
import { ArrowLeft, Plus, Pencil, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    manufacturerId: "none",
  });

  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [manufacturerDialogOpen, setManufacturerDialogOpen] = useState(false);
  const [variantForm, setVariantForm] = useState({
    key: "",
    name: "",
    description: "",
    price: "",
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

  // Fetch manufacturers
  const { data: manufacturersPage } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: async () => {
      return manufacturersApi.listManufacturers();
    },
  });

  // Update form when product data loads
  useEffect(() => {
    if (product) {
      setProductForm({
        key: product.key,
        name: product.name,
        description: product.description || "",
        manufacturerId: product.manufacturerId || "none",
      });
    }
  }, [product]);

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: typeof productForm) => {
      return productsApi.createProduct({
        ...data,
        manufacturerId: data.manufacturerId === "none" ? null : data.manufacturerId,
      });
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
      return productsApi.updateProduct(id, {
        ...data,
        manufacturerId: data.manufacturerId === "none" ? null : data.manufacturerId,
      });
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
      return variantsApi.createVariant(id, {
        key: data.key,
        name: data.name,
        description: data.description || null,
        price: data.price ? parseFloat(data.price) : null,
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
      return variantsApi.updateVariant(variantId, {
        key: data.key,
        name: data.name,
        description: data.description || null,
        price: data.price ? parseFloat(data.price) : null,
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
    setVariantForm({
      key: variant.key,
      name: variant.name,
      description: variant.description || "",
      price: variant.price?.toString() || "",
    });
    setVariantDialogOpen(true);
  };

  const handleCloseVariantDialog = () => {
    setVariantDialogOpen(false);
    setEditingVariant(null);
    setVariantForm({ key: "", name: "", description: "", price: "" });
  };

  const handleOpenVariantDialog = () => {
    setEditingVariant(null);
    setVariantForm({ key: "", name: "", description: "", price: "" });
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
        <div className="flex-1" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-right">
          {isNewProduct ? "New Product" : (product?.name || productForm?.name || "Product")}
        </h2>
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
              <RichTextEditor
                value={productForm.description}
                onChange={(value) => setProductForm({ ...productForm, description: value })}
                placeholder="Enter product description..."
              />
              <div className="grid gap-2">
                <Label htmlFor="manufacturerId">Manufacturer</Label>
                <div className="flex gap-2">
                  <Select
                    value={productForm.manufacturerId}
                    onValueChange={(value) => setProductForm({ ...productForm, manufacturerId: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a manufacturer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {manufacturersPage?.content?.map((manufacturer) => (
                        <SelectItem key={manufacturer.id} value={manufacturer.id}>
                          {manufacturer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setManufacturerDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
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
          </CardFooter>
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
                    <TableHead className="text-right">Price (EUR)</TableHead>
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
                        No variants found. A default variant is created automatically.
                      </TableCell>
                    </TableRow>
                  ) : (
                    variants.map((variant) => (
                      <TableRow key={variant.id}>
                        <TableCell className="font-medium">{variant.key}</TableCell>
                        <TableCell>{variant.name}</TableCell>
                        <TableCell className="text-right">{variant.price ? `€${variant.price.toFixed(2)}` : "-"}</TableCell>
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
                    ))
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
            <DialogHeader className="bg-muted/50 -mx-6 -mt-6 px-6 py-4 rounded-t-lg">
              <DialogTitle>{editingVariant ? "Edit Variant" : "Create New Variant"}</DialogTitle>
              <DialogDescription>
                {product?.name || "Product"}
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
                <Label htmlFor="variant-description">Description</Label>
                <RichTextEditor
                  value={variantForm.description}
                  onChange={(value) => setVariantForm({ ...variantForm, description: value })}
                  placeholder="Enter variant description..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="variant-price">Price (EUR)</Label>
                <Input
                  id="variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                  placeholder="0.00"
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

      <CreateManufacturerDialog
        open={manufacturerDialogOpen}
        onOpenChange={setManufacturerDialogOpen}
        onManufacturerCreated={(manufacturer) => {
          setProductForm({ ...productForm, manufacturerId: manufacturer.id });
          queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
        }}
      />
    </div>
  );
}


