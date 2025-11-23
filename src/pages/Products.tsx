import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as productsApi from "@/integrations/api/products";
import * as manufacturersApi from "@/integrations/api/manufacturers";
import * as productCategoriesApi from "@/integrations/api/productCategories";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");

  const { data: manufacturersPage, isLoading: manufacturersLoading } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: async () => {
      return manufacturersApi.listManufacturers();
    },
    retry: 1,
  });

  const { data: categoriesPage } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      return productCategoriesApi.listProductCategories();
    },
  });

  const { data: productsPage, isLoading, error } = useQuery({
    queryKey: ["products", selectedManufacturerId === "all" ? null : selectedManufacturerId, selectedCategoryId === "all" ? null : selectedCategoryId],
    queryFn: async () => {
      return productsApi.listProducts({
        manufacturerId: selectedManufacturerId === "all" ? undefined : selectedManufacturerId,
        categoryId: selectedCategoryId === "all" ? undefined : selectedCategoryId,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return productsApi.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete product error:", error);
      toast.error(error?.message || "Failed to delete product");
    },
  });

  const products = productsPage?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Products</h2>
          <p className="text-muted-foreground mt-1">Manage software products and licenses</p>
        </div>
        <Button onClick={() => navigate("/products/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex gap-4 items-end">
        <div className="grid gap-2 flex-1 max-w-xs">
          <Label htmlFor="manufacturer-filter">Filter by Manufacturer</Label>
          <Select value={selectedManufacturerId} onValueChange={setSelectedManufacturerId}>
            <SelectTrigger id="manufacturer-filter">
              <SelectValue placeholder="All manufacturers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All manufacturers</SelectItem>
              {manufacturersLoading ? (
                <SelectItem value="loading" disabled>Loading manufacturers...</SelectItem>
              ) : (
                manufacturersPage?.content?.map((manufacturer) => (
                  <SelectItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 flex-1 max-w-xs">
          <Label htmlFor="category-filter">Filter by Category</Label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoriesPage?.content?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
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
              <TableHead>Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {error ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-destructive">
                  Error loading products: {error instanceof Error ? error.message : "Unknown error"}
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No products found. Click "Add Product" to create one.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const manufacturer = manufacturersPage?.content?.find(m => m.id === product.manufacturerId);
                return (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <TableCell className="font-medium">{product.key}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{manufacturer?.name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/products/${product.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteMutation.mutate(product.id)}
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
    </div>
  );
}




