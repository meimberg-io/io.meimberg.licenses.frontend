import {LayoutDashboard, Users, Package, FileText, Grid3x3, Building2, Building, Tag} from "lucide-react";
import {NavLink} from "@/components/NavLink";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
    {title: "Dashboard", url: "/", icon: LayoutDashboard},
    {title: "Products", url: "/products", icon: Package},
    {title: "Assignments", url: "/matrix", icon: Grid3x3},
    {title: "Users", url: "/users", icon: Users},
];

const itemsAfterSeparator = [
    {title: "Manufacturers", url: "/manufacturers", icon: Building2},
    {title: "Product Categories", url: "/product-categories", icon: Tag},
    {title: "Departments", url: "/departments", icon: Building},
];

export function AppSidebar() {
    const {state} = useSidebar();
    const collapsed = state === "collapsed";

    return (
        <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-2 py-2`}>
                        <SidebarGroupLabel className={collapsed ? "px-0 justify-center" : ""}>
                            {collapsed ? "LM" : "License Manager"}
                        </SidebarGroupLabel>
                        {!collapsed && <SidebarTrigger className="h-7 w-7"/>}
                    </div>
                    {collapsed && (
                        <div className="flex justify-center px-2 pb-2">
                            <SidebarTrigger className="h-7 w-7"/>
                        </div>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            end
                                            className="hover:bg-sidebar-accent transition-colors"
                                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        >
                                            <item.icon className="h-4 w-4"/>
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                        <SidebarSeparator />
                        <SidebarMenu>
                            {itemsAfterSeparator.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <NavLink
                                            to={item.url}
                                            end
                                            className="hover:bg-sidebar-accent transition-colors"
                                            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                        >
                                            <item.icon className="h-4 w-4"/>
                                            {!collapsed && <span>{item.title}</span>}
                                        </NavLink>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}




