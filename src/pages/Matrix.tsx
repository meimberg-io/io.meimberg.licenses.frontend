import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "@/integrations/api/users";
import * as variantsApi from "@/integrations/api/variants";
import * as assignmentsApi from "@/integrations/api/assignments";
import * as productsApi from "@/integrations/api/products";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle2, XCircle, Calendar, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Assignment, User, ProductVariant, Product } from "@/integrations/api/types";

interface VariantWithProduct extends ProductVariant {
  product?: Product;
}

export default function Matrix() {
  const queryClient = useQueryClient();
  const [selectedCell, setSelectedCell] = useState<{
    userId: string;
    variantId: string;
    assignment?: Assignment;
  } | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    starts_at: "",
    ends_at: "",
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

  const products = productsPage?.content || [];

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
    mutationFn: async (data: { user_id: string; product_variant_id: string; starts_at?: string | null; note?: string | null }) => {
      return assignmentsApi.createAssignment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("License assigned successfully");
      setSelectedCell(null);
      setAssignmentForm({ starts_at: "", ends_at: "", note: "" });
    },
    onError: (error: any) => {
      console.error("Create assignment error:", error);
      toast.error(error?.message || "Failed to assign license");
    },
  });

  // Update assignment mutation (revoke/reactivate)
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status?: "ACTIVE" | "REVOKED"; ends_at?: string | null } }) => {
      return assignmentsApi.updateAssignment(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment updated successfully");
      setSelectedCell(null);
      setAssignmentForm({ starts_at: "", ends_at: "", note: "" });
    },
    onError: (error: any) => {
      console.error("Update assignment error:", error);
      toast.error(error?.message || "Failed to update assignment");
    },
  });

  // Create assignment map for quick lookup
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignmentsPage?.content?.forEach((assignment) => {
      const key = `${assignment.user_id}-${assignment.product_variant_id}`;
      map.set(key, assignment);
    });
    return map;
  }, [assignmentsPage]);

  const handleCellClick = (userId: string, variantId: string) => {
    const key = `${userId}-${variantId}`;
    const assignment = assignmentMap.get(key);
    
    setSelectedCell({ userId, variantId, assignment });
    
    if (assignment) {
      setAssignmentForm({
        starts_at: assignment.starts_at ? assignment.starts_at.split("T")[0] : "",
        ends_at: assignment.ends_at ? assignment.ends_at.split("T")[0] : "",
        note: assignment.note || "",
      });
    } else {
      setAssignmentForm({ starts_at: "", ends_at: "", note: "" });
    }
  };

  const handleSave = () => {
    if (!selectedCell) return;

    if (selectedCell.assignment) {
      // Update existing assignment (revoke/reactivate)
      const isActive = selectedCell.assignment.status === "ACTIVE";
      updateAssignmentMutation.mutate({
        id: selectedCell.assignment.id,
        data: {
          status: isActive ? "REVOKED" : "ACTIVE",
          ends_at: isActive ? (assignmentForm.ends_at || new Date().toISOString()) : null,
        },
      });
    } else {
      // Create new assignment
      createAssignmentMutation.mutate({
        user_id: selectedCell.userId,
        product_variant_id: selectedCell.variantId,
        starts_at: assignmentForm.starts_at || null,
        note: assignmentForm.note || null,
      });
    }
  };

  const handleRevoke = () => {
    if (selectedCell?.assignment && selectedCell.assignment.status === "ACTIVE") {
      updateAssignmentMutation.mutate({
        id: selectedCell.assignment.id,
        data: {
          status: "REVOKED",
          ends_at: new Date().toISOString(),
        },
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 hover:bg-green-500/30 border-green-500/50";
      case "REVOKED":
        return "bg-red-500/20 hover:bg-red-500/30 border-red-500/50";
      default:
        return "bg-primary/20 hover:bg-primary/30 border-primary/50";
    }
  };

  const users = usersPage?.content || [];
  const variants = allVariants || [];

  if (!usersPage || !allVariants) {
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

      <div className="border border-border rounded-lg bg-card overflow-auto">
        <div className="min-w-max">
          <div className="grid gap-0" style={{ gridTemplateColumns: `200px repeat(${variants.length}, 140px)` }}>
            {/* Header row */}
            <div className="sticky left-0 z-20 bg-muted/50 backdrop-blur border-b border-r border-border p-3 font-semibold">
              User / License
            </div>
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="bg-muted/30 border-b border-r border-border p-2 text-xs"
              >
                <div className="font-semibold truncate" title={variant.product?.name}>
                  {variant.product?.name || "-"}
                </div>
                <div className="text-muted-foreground truncate" title={variant.name}>
                  {variant.name}
                </div>
                {variant.capacity && (
                  <div className="text-muted-foreground text-[10px]">Cap: {variant.capacity}</div>
                )}
              </div>
            ))}

            {/* Data rows */}
            {users.map((user) => (
              <div key={user.id} className="contents">
                <div className="sticky left-0 z-10 bg-card backdrop-blur border-b border-r border-border p-3">
                  <div className="font-medium truncate" title={user.display_name}>
                    {user.display_name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate" title={user.email}>
                    {user.email}
                  </div>
                </div>
                {variants.map((variant) => {
                  const key = `${user.id}-${variant.id}`;
                  const assignment = assignmentMap.get(key);
                  
                  return (
                    <button
                      key={key}
                      onClick={() => handleCellClick(user.id, variant.id)}
                      className={cn(
                        "border-b border-r border-border p-2 transition-all duration-200 hover:scale-105 relative group",
                        assignment
                          ? getStatusColor(assignment.status)
                          : "hover:bg-muted/50"
                      )}
                    >
                      {assignment ? (
                        <div className="flex flex-col items-center justify-center gap-1 h-full">
                          <CheckCircle2 className="h-5 w-5 text-foreground" />
                          <Badge
                            variant={assignment.status === "ACTIVE" ? "default" : "destructive"}
                            className="text-[10px] px-1 py-0"
                          >
                            {assignment.status}
                          </Badge>
                          {assignment.ends_at && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(assignment.ends_at).toLocaleDateString()}
                            </div>
                          )}
                          {assignment.note && (
                            <StickyNote className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <XCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
          <span className="text-muted-foreground">Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/50" />
          <span className="text-muted-foreground">Revoked</span>
        </div>
      </div>

      <Dialog open={!!selectedCell} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCell?.assignment ? "Edit Assignment" : "Create Assignment"}
            </DialogTitle>
            <DialogDescription>
              {selectedCell && users && variants && (
                <>
                  Assign{" "}
                  <span className="font-semibold">
                    {variants.find((v) => v.id === selectedCell.variantId)?.product?.name} -{" "}
                    {variants.find((v) => v.id === selectedCell.variantId)?.name}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {users.find((u) => u.id === selectedCell.userId)?.display_name}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedCell?.assignment && (
              <div className="grid gap-2">
                <Label>Current Status</Label>
                <Badge variant={selectedCell.assignment.status === "ACTIVE" ? "default" : "destructive"}>
                  {selectedCell.assignment.status}
                </Badge>
              </div>
            )}
            {!selectedCell?.assignment && (
              <div className="grid gap-2">
                <Label htmlFor="starts_at">Start Date (Optional)</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={assignmentForm.starts_at}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, starts_at: e.target.value })}
                />
              </div>
            )}
            {selectedCell?.assignment && selectedCell.assignment.status === "ACTIVE" && (
              <div className="grid gap-2">
                <Label htmlFor="ends_at">End Date (Optional)</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={assignmentForm.ends_at}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, ends_at: e.target.value })}
                />
              </div>
            )}
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
            {selectedCell?.assignment && selectedCell.assignment.status === "ACTIVE" && (
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={updateAssignmentMutation.isPending}
              >
                {updateAssignmentMutation.isPending ? "Revoking..." : "Revoke Assignment"}
              </Button>
            )}
            {selectedCell?.assignment && selectedCell.assignment.status === "REVOKED" && (
              <Button
                onClick={() => {
                  updateAssignmentMutation.mutate({
                    id: selectedCell.assignment!.id,
                    data: {
                      status: "ACTIVE",
                      ends_at: null,
                    },
                  });
                }}
                disabled={updateAssignmentMutation.isPending}
              >
                {updateAssignmentMutation.isPending ? "Reactivating..." : "Reactivate"}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
            >
              {createAssignmentMutation.isPending || updateAssignmentMutation.isPending
                ? "Saving..."
                : selectedCell?.assignment
                ? "Update"
                : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


