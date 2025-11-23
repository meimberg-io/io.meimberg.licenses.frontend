import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: productsPage, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return productsApi.listProducts();
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

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No products found. Click "Add Product" to create one.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow 
                  key={product.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <TableCell className="font-medium">{product.key}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="max-w-md truncate">{product.description || "-"}</TableCell>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}



