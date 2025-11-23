import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as manufacturersApi from "@/integrations/api/manufacturers";
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

export default function Manufacturers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: manufacturersPage, isLoading } = useQuery({
    queryKey: ["manufacturers"],
    queryFn: async () => {
      return manufacturersApi.listManufacturers();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return manufacturersApi.deleteManufacturer(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturers"] });
      toast.success("Manufacturer deleted successfully");
    },
    onError: (error: any) => {
      console.error("Delete manufacturer error:", error);
      toast.error(error?.message || "Failed to delete manufacturer");
    },
  });

  const manufacturers = manufacturersPage?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Manufacturers</h2>
          <p className="text-muted-foreground mt-1">Manage product manufacturers</p>
        </div>
        <Button onClick={() => navigate("/manufacturers/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Manufacturer
        </Button>
      </div>

      <div className="border border-border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
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
            ) : manufacturers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No manufacturers found. Click "Add Manufacturer" to create one.
                </TableCell>
              </TableRow>
            ) : (
              manufacturers.map((manufacturer) => (
                <TableRow 
                  key={manufacturer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/manufacturers/${manufacturer.id}`)}
                >
                  <TableCell className="font-medium">{manufacturer.name}</TableCell>
                  <TableCell>
                    {manufacturer.url ? (
                      <a 
                        href={manufacturer.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:underline"
                      >
                        {manufacturer.url}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {manufacturer.description ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: manufacturer.description }}
                        className="line-clamp-2"
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`/manufacturers/${manufacturer.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(manufacturer.id)}
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

