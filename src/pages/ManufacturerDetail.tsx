import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as manufacturersApi from "@/integrations/api/manufacturers";
import * as productsApi from "@/integrations/api/products";
import * as variantsApi from "@/integrations/api/variants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
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
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import type { Manufacturer, Product, ProductVariant } from "@/integrations/api/types";

export default function ManufacturerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewManufacturer = id === "new";

  const [manufacturerForm, setManufacturerForm] = useState({
    name: "",
    url: "",
    description: "",
  });

  // Fetch manufacturer data
  const { data: manufacturer, isLoading: manufacturerLoading } = useQuery({
    queryKey: ["manufacturer", id],
    queryFn: async () => {
      if (isNewManufacturer) return null;
      return manufacturersApi.getManufacturer(id!);
    },
    enabled: !isNewManufacturer && !!id,
  });

  // Fetch products for this manufacturer
  const { data: productsPage } = useQuery({
    queryKey: ["products", "manufacturer", id],
    queryFn: async () => {
      if (isNewManufacturer || !id) return { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 };
      return productsApi.listProducts({ manufacturerId: id, size: 200 });
    },
    enabled: !isNewManufacturer && !!id,
  });

  const products = productsPage?.content || [];

  // Fetch variants for all products
  const { data: allVariants } = useQuery({
    queryKey: ["all-variants-manufacturer", products.map(p => p.id).join(",")],
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

  // Update form when manufacturer data loads
  useEffect(() => {
    if (manufacturer) {
      setManufacturerForm({
        name: manufacturer.name,
        url: manufacturer.url || "",
        description: manufacturer.description || "",
      });
    }
  }, [manufacturer]);

  // Create manufacturer mutation
  const createManufacturerMutation = useMutation({
    mutationFn: async (data: typeof manufacturerForm) => {
      return manufacturersApi.createManufacturer(data);
    },
    onSuccess: async (newManufacturer) => {
      queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
      toast.success("Manufacturer created successfully");
      navigate(`/manufacturers/${newManufacturer.id}`);
    },
    onError: (error: any) => {
      console.error("Create manufacturer error:", error);
      toast.error(error?.message || "Failed to create manufacturer");
    },
  });

  // Update manufacturer mutation
  const updateManufacturerMutation = useMutation({
    mutationFn: async (data: typeof manufacturerForm) => {
      if (!id) throw new Error("Manufacturer ID is required");
      return manufacturersApi.updateManufacturer(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturer", id] });
      queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
      toast.success("Manufacturer updated successfully");
    },
    onError: (error: any) => {
      console.error("Update manufacturer error:", error);
      toast.error(error?.message || "Failed to update manufacturer");
    },
  });

  const handleSaveManufacturer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewManufacturer) {
      createManufacturerMutation.mutate(manufacturerForm);
    } else {
      updateManufacturerMutation.mutate(manufacturerForm);
    }
  };

  if (manufacturerLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/manufacturers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <h2 className="text-3xl font-bold tracking-tight text-foreground text-right">
          {isNewManufacturer ? "New Manufacturer" : (manufacturer?.name || manufacturerForm?.name || "Manufacturer")}
        </h2>
      </div>

      <form onSubmit={handleSaveManufacturer}>
        <Card>
          <CardHeader>
            <CardTitle>Manufacturer Information</CardTitle>
            <CardDescription>Basic details about the manufacturer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={manufacturerForm.name}
                onChange={(e) => setManufacturerForm({ ...manufacturerForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={manufacturerForm.url}
                onChange={(e) => setManufacturerForm({ ...manufacturerForm, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={manufacturerForm.description}
                onChange={(value) => setManufacturerForm({ ...manufacturerForm, description: value })}
                placeholder="Enter manufacturer description..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={createManufacturerMutation.isPending || updateManufacturerMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {createManufacturerMutation.isPending || updateManufacturerMutation.isPending
                ? "Saving..."
                : "Save Manufacturer"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {!isNewManufacturer && (
        <Card>
          <CardHeader>
            <CardTitle>Products & Variants</CardTitle>
            <CardDescription>Products and variants for this manufacturer</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No products found for this manufacturer.
              </p>
            ) : (
              <div className="space-y-6">
                {products.map((product) => {
                  const productVariants = allVariants?.filter(v => v.productId === product.id) || [];
                  return (
                    <div key={product.id} className="border border-border rounded-lg p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.key}</p>
                      </div>
                      {productVariants.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Variants:</h4>
                          <div className="space-y-1">
                            {productVariants.map((variant) => (
                              <div key={variant.id} className="text-sm text-muted-foreground pl-4">
                                • {variant.name} ({variant.key})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

