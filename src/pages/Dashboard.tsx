import { useQuery } from "@tanstack/react-query";
import * as usersApi from "@/integrations/api/users";
import * as productsApi from "@/integrations/api/products";
import * as variantsApi from "@/integrations/api/variants";
import * as assignmentsApi from "@/integrations/api/assignments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Layers, FileText } from "lucide-react";

export default function Dashboard() {
  const { data: usersPage } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return usersApi.listUsers({ size: 1 });
    },
  });

  const { data: productsPage } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      return productsApi.listProducts({ size: 1 });
    },
  });

  const { data: assignmentsPage } = useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      return assignmentsApi.listAssignments({ size: 1 });
    },
  });

  // Calculate variants count by fetching all products and their variants in parallel
  const { data: variantsCount } = useQuery({
    queryKey: ["variants-count", productsPage?.content?.map(p => p.id).join(",")],
    queryFn: async () => {
      if (!productsPage?.content || productsPage.content.length === 0) return 0;
      try {
        const variantPromises = productsPage.content.map(product =>
          variantsApi.listVariantsByProduct(product.id).catch(() => [])
        );
        const variantArrays = await Promise.all(variantPromises);
        return variantArrays.reduce((sum, variants) => sum + variants.length, 0);
      } catch (error) {
        console.error("Failed to fetch variants count:", error);
        return 0;
      }
    },
    enabled: !!productsPage?.content && productsPage.content.length > 0,
  });

  const stats = [
    {
      title: "Total Users",
      value: usersPage?.totalElements ?? "...",
      icon: Users,
      description: "Registered users in the system",
    },
    {
      title: "Products",
      value: productsPage?.totalElements ?? "...",
      icon: Package,
      description: "Available products",
    },
    {
      title: "Variants",
      value: variantsCount ?? "...",
      icon: Layers,
      description: "Product variants configured",
    },
    {
      title: "Assignments",
      value: assignmentsPage?.totalElements ?? "...",
      icon: FileText,
      description: "Current license assignments",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of your license management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}




