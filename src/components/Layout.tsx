import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <header className="h-14 bg-[#000066] flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-20">
        <img src="/logo_trans.png" alt="Logo" width={84} height={20} />
        <h1 className="text-lg font-semibold text-white">License Management System</h1>
      </header>
      <div className="min-h-screen flex w-full bg-background flex-col pt-14">
        <div className="flex flex-1">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}




