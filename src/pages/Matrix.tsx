import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "@/integrations/api/users";
import * as variantsApi from "@/integrations/api/variants";
import * as assignmentsApi from "@/integrations/api/assignments";
import * as productsApi from "@/integrations/api/products";
import * as manufacturersApi from "@/integrations/api/manufacturers";
import * as departmentsApi from "@/integrations/api/departments";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, PlusCircle, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Assignment, User, ProductVariant, Product } from "@/integrations/api/types";

interface VariantWithProduct extends ProductVariant {
  product?: Product;
}

export default function Matrix() {
  const queryClient = useQueryClient();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedCell, setSelectedCell] = useState<{
    userId: string;
    productId: string;
    assignment?: Assignment;
  } | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    variantId: "",
    note: "",
  });

  // Fetch users
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

  const { data: manufacturersPage } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: async () => {
      return manufacturersApi.listManufacturers();
    },
  });

  const { data: departmentsPage } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      return departmentsApi.listDepartments();
    },
  });

  const { data: categoriesPage } = useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      return productCategoriesApi.listProductCategories();
    },
  });

  const allProducts = productsPage?.content || [];
  
  // Filter products by selected category
  const products = useMemo(() => {
    if (selectedCategoryId === "all") {
      return allProducts;
    }
    return allProducts.filter((product) => product.categoryId === selectedCategoryId);
  }, [allProducts, selectedCategoryId]);
  
  // Create manufacturer map for quick lookup
  const manufacturerMap = useMemo(() => {
    const map = new Map<string, string>();
    manufacturersPage?.content?.forEach((manufacturer) => {
      map.set(manufacturer.id, manufacturer.name);
    });
    return map;
  }, [manufacturersPage]);

  // Fetch all variants for all products
  const { data: allVariants } = useQuery({
    queryKey: ["all-variants-matrix", products.map(p => p.id).join(",")],
    queryFn: async () => {
      const variants: VariantWithProduct[] = [];
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

  // Fetch all assignments
  const { data: assignmentsPage } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      return assignmentsApi.listAssignments();
    },
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: { userId: string; productVariantId: string; note?: string | null }) => {
      return assignmentsApi.createAssignment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("License assigned successfully");
      setSelectedCell(null);
      setAssignmentForm({ variantId: "", note: "" });
    },
    onError: (error: any) => {
      console.error("Create assignment error:", error);
      toast.error(error?.message || "Failed to assign license");
    },
  });

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return assignmentsApi.deleteAssignment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment deleted successfully");
      setSelectedCell(null);
      setAssignmentForm({ variantId: "", note: "" });
    },
    onError: (error: any) => {
      console.error("Delete assignment error:", error);
      toast.error(error?.message || "Failed to delete assignment");
    },
  });

  // Create assignment map for quick lookup: userId-productId -> Assignment
  // Also create variant map for quick lookup: variantId -> Variant
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignmentsPage?.content?.forEach((assignment) => {
      // Find the product for this variant
      const variant = allVariants?.find(v => v.id === assignment.productVariantId);
      if (variant?.product?.id) {
        const key = `${assignment.userId}-${variant.product.id}`;
        map.set(key, assignment);
      }
    });
    return map;
  }, [assignmentsPage, allVariants]);

  const variantMap = useMemo(() => {
    const map = new Map<string, VariantWithProduct>();
    allVariants?.forEach((variant) => {
      map.set(variant.id, variant);
    });
    return map;
  }, [allVariants]);

  const handleCellClick = (userId: string, productId: string) => {
    const key = `${userId}-${productId}`;
    const assignment = assignmentMap.get(key);
    
    setSelectedCell({ userId, productId, assignment });
    
    if (assignment) {
      setAssignmentForm({
        variantId: assignment.productVariantId,
        note: assignment.note || "",
      });
    } else {
      // If empty cell, check if there's only one variant for this product
      const availableVariants = allVariants?.filter((v) => v.product?.id === productId) || [];
      const preselectedVariantId = availableVariants.length === 1 ? availableVariants[0].id : "";
      setAssignmentForm({ variantId: preselectedVariantId, note: "" });
    }
  };

  const handleSave = () => {
    if (!selectedCell || !assignmentForm.variantId) return;

    const saveAssignment = () => {
      createAssignmentMutation.mutate({
        userId: selectedCell.userId,
        productVariantId: assignmentForm.variantId,
        note: assignmentForm.note || null,
      });
    };

    // If there's an existing assignment, delete it first (to handle variant change or note update)
    if (selectedCell.assignment) {
      deleteAssignmentMutation.mutate(selectedCell.assignment.id, {
        onSuccess: () => {
          // After deletion, create the new assignment
          saveAssignment();
        },
      });
    } else {
      // Create new assignment
      saveAssignment();
    }
  };

  const handleDelete = () => {
    if (selectedCell?.assignment) {
      deleteAssignmentMutation.mutate(selectedCell.assignment.id);
    }
  };


  const allUsers = usersPage?.content || [];
  const variants = allVariants || [];

  // Filter users by selected department
  const users = useMemo(() => {
    if (selectedDepartmentId === "all") {
      return allUsers;
    }
    return allUsers.filter((user) => user.departmentId === selectedDepartmentId);
  }, [allUsers, selectedDepartmentId]);

  // Calculate totals (sum of prices)
  const productTotals = useMemo(() => {
    const totals = new Map<string, number>();
    products.forEach((product) => {
      let sum = 0;
      users.forEach((user) => {
        const key = `${user.id}-${product.id}`;
        const assignment = assignmentMap.get(key);
        if (assignment) {
          const variant = variantMap.get(assignment.productVariantId);
          if (variant?.price) {
            sum += variant.price;
          }
        }
      });
      totals.set(product.id, sum);
    });
    return totals;
  }, [products, users, assignmentMap, variantMap]);

  const userTotals = useMemo(() => {
    const totals = new Map<string, number>();
    users.forEach((user) => {
      let sum = 0;
      products.forEach((product) => {
        const key = `${user.id}-${product.id}`;
        const assignment = assignmentMap.get(key);
        if (assignment) {
          const variant = variantMap.get(assignment.productVariantId);
          if (variant?.price) {
            sum += variant.price;
          }
        }
      });
      totals.set(user.id, sum);
    });
    return totals;
  }, [products, users, assignmentMap, variantMap]);

  const grandTotal = useMemo(() => {
    let sum = 0;
    // Only sum assignments for filtered users
    const filteredUserIds = new Set(users.map(u => u.id));
    assignmentMap.forEach((assignment) => {
      // Only include assignments for users in the filtered list
      if (filteredUserIds.has(assignment.userId)) {
        const variant = variantMap.get(assignment.productVariantId);
        if (variant?.price) {
          sum += variant.price;
        }
      }
    });
    return sum;
  }, [assignmentMap, variantMap, users]);

  if (!usersPage || (products.length > 0 && !allVariants)) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">License Matrix</h2>
        <p className="text-muted-foreground mt-1">
          Interactive overview of all license assignments
        </p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="grid gap-2 flex-1 max-w-xs">
          <Label htmlFor="department-filter">Filter by Department</Label>
          <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
            <SelectTrigger id="department-filter">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentsPage?.content?.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
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

      <div className="border border-border rounded-lg bg-card overflow-auto">
        {products.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No products found for the selected filters.
          </div>
        ) : (
          <div className="min-w-max">
            <div className="grid gap-0" style={{ gridTemplateColumns: `200px repeat(${products.length}, 140px) 140px` }}>
            {/* Header row */}
            <div className="sticky left-0 z-20 bg-muted/50 backdrop-blur border-b border-r border-border p-3 font-semibold">
              User / Product
            </div>
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-muted/30 border-b border-r border-border p-2 text-xs"
              >
                <div className="font-semibold truncate" title={product.name}>
                  {product.name || "-"}
                </div>
                {product.manufacturerId && (
                  <div className="text-muted-foreground truncate text-[10px] mt-0.5" title={manufacturerMap.get(product.manufacturerId) || ""}>
                    {manufacturerMap.get(product.manufacturerId) || "-"}
                  </div>
                )}
              </div>
            ))}
            {/* Header for user totals column */}
            <div className="bg-muted/30 border-b border-r border-border p-2 text-xs font-semibold">
              Total
            </div>

            {/* Data rows */}
            {users.map((user) => (
              <div key={user.id} className="contents">
                <div className="sticky left-0 z-10 bg-card backdrop-blur border-b border-r border-border p-3">
                  <div className="font-medium truncate" title={user.displayName}>
                    {user.displayName}
                  </div>
                  <div className="text-xs text-muted-foreground truncate" title={user.email}>
                    {user.email}
                  </div>
                </div>
                {products.map((product) => {
                  const key = `${user.id}-${product.id}`;
                  const assignment = assignmentMap.get(key);
                  const assignedVariant = assignment ? variantMap.get(assignment.productVariantId) : null;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleCellClick(user.id, product.id)}
                      className={cn(
                        "border-b border-r border-border p-2 transition-all duration-200 hover:scale-105 relative group",
                        assignment
                          ? "bg-green-500/20 hover:bg-green-500/30 border-green-500/50"
                          : "hover:bg-muted/50"
                      )}
                    >
                      {assignment && assignedVariant ? (
                        <div className="flex flex-col items-center justify-center gap-1 h-full">
                          <div className="text-xs font-medium text-center truncate w-full" title={assignedVariant.name}>
                            {assignedVariant.name}
                          </div>
                          {assignedVariant.price && (
                            <div className="text-[10px] text-muted-foreground">
                              €{assignedVariant.price.toFixed(2)}
                            </div>
                          )}
                          {assignment.note && (
                            <StickyNote className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlusCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
                {/* User total column */}
                <div className="sticky right-0 z-10 bg-muted/50 backdrop-blur border-b border-r text-sm border-border p-3 font-semibold text-center">
                  {userTotals.get(user.id) ? `€${userTotals.get(user.id)!.toFixed(2)}` : "€0.00"}
                </div>
              </div>
            ))}
            
            {/* Footer row - Product totals */}
            <div className="contents">
              <div className="sticky left-0 z-20 bg-muted/50 backdrop-blur border-b border-r border-border p-3 font-semibold">
                Total
              </div>
              {products.map((product) => (
                <div
                  key={`total-${product.id}`}
                  className="bg-muted/50 border-b text-sm border-r border-border p-3 font-semibold text-center"
                >
                  {productTotals.get(product.id) ? `€${productTotals.get(product.id)!.toFixed(2)}` : "€0.00"}
                </div>
              ))}
              {/* Grand total cell (bottom right) */}
              <div className="sticky text-sm right-0 z-20 bg-muted/70 backdrop-blur border-b border-r border-border p-3 font-bold text-center">
                €{grandTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
          <span className="text-muted-foreground">Active</span>
        </div>
      </div>

      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.assignment ? "Change Variant" : "Assign Variant"}
            </DialogTitle>
            <DialogDescription>
              {selectedCell && users && products && (
                <>
                  Select variant for{" "}
                  <span className="font-semibold">
                    {products.find((p) => p.id === selectedCell.productId)?.name}
                  </span>{" "}
                  for user{" "}
                  <span className="font-semibold">
                    {users.find((u) => u.id === selectedCell.userId)?.displayName}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="variantId">Variant *</Label>
              <Select
                value={assignmentForm.variantId}
                onValueChange={(value) => setAssignmentForm({ ...assignmentForm, variantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a variant" />
                </SelectTrigger>
                <SelectContent>
                  {allVariants
                    ?.filter((v) => v.product?.id === selectedCell?.productId)
                    .map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                value={assignmentForm.note}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, note: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {selectedCell?.assignment && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteAssignmentMutation.isPending}
              >
                {deleteAssignmentMutation.isPending ? "Deleting..." : "Delete Assignment"}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!assignmentForm.variantId || createAssignmentMutation.isPending || deleteAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending || deleteAssignmentMutation.isPending
                ? "Saving..."
                : selectedCell?.assignment
                ? "Change Variant"
                : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


