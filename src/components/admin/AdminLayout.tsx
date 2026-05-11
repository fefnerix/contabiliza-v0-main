import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  Settings2,
  Shield,
  Users2,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppContext } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import { InfraStatusProvider, useInfraStatusContext } from "@/contexts/InfraStatusContext";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Clientes", href: "/admin/customers", icon: Users2 },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Planos", href: "/admin/plans", icon: CreditCard },
  { label: "Checkouts", href: "/admin/checkouts", icon: Webhook },
  { label: "Emails", href: "/admin/communications", icon: Mail },
  { label: "Conteúdo", href: "/admin/content", icon: FileText },
  { label: "Configurações", href: "/admin/settings", icon: Settings2 },
  { label: "Infraestrutura", href: "/admin/logs", icon: Activity },
  { label: "Auditoria", href: "/admin/audit", icon: Shield },
];

const AdminLayoutInner = () => {
  const location = useLocation();
  const { user, logout } = useAppContext();
  const [openMobile, setOpenMobile] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);
  const [companyName, setCompanyName] = useState("Contabiliza");
  const { summary } = useInfraStatusContext();

  useEffect(() => {
    const loadCritical = async () => {
      const { data } = await supabase.functions.invoke("get-health-scores");
      if (Array.isArray(data)) {
        setCriticalCount(data.filter((item: any) => item.category === "critical").length);
      }
    };
    loadCritical();
  }, []);

  useEffect(() => {
    const loadCompanyName = async () => {
      const { data } = await supabase
        .from("poupeja_settings")
        .select("value")
        .eq("category", "branding")
        .eq("key", "company_name")
        .maybeSingle();
      if (data?.value) setCompanyName(data.value);
    };
    loadCompanyName();
  }, []);

  const pageTitle = useMemo(() => {
    const found = navItems.find((item) => location.pathname.startsWith(item.href));
    return found?.label ?? "Admin";
  }, [location.pathname]);

  const initials = (user?.user_metadata?.name || user?.email || "AD")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const nav = (onClick?: () => void) => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const active = location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-primary/15 text-primary border border-primary/35" : "text-zinc-300 hover:bg-zinc-800",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
            {item.label === "Clientes" && criticalCount > 0 ? <Badge variant="destructive">{criticalCount}</Badge> : null}
            {item.href === "/admin/logs" && summary.error > 0 ? (
              <Badge variant="destructive" className="ml-auto">
                {summary.error}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <AdminCommandPalette />
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-60 border-r border-[#1f1f1f] bg-[#111111] p-4 flex-col">
          <div className="mb-6 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold tracking-wide text-[#e5e5e5]">{companyName}</span>
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">ADMIN</Badge>
          </div>
          {nav()}
          <Button variant="ghost" className="mt-auto justify-start text-zinc-300 hover:bg-zinc-800" onClick={logout}>
            Sair
          </Button>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-[#1f1f1f] bg-[#111111] px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sheet open={openMobile} onOpenChange={setOpenMobile}>
                <SheetTrigger asChild className="md:hidden">
                  <Button size="icon" variant="ghost">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-[#111111] border-[#1f1f1f] text-zinc-100">
                  <SheetHeader>
                    <SheetTitle className="text-zinc-100">Contabiliza Admin</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">{nav(() => setOpenMobile(false))}</div>
                </SheetContent>
              </Sheet>
              <h1 className="text-sm md:text-base font-medium">{pageTitle}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-[#1f1f1f] bg-transparent text-zinc-200">
                ⌘K
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export const AdminLayout = () => (
  <InfraStatusProvider>
    <AdminLayoutInner />
  </InfraStatusProvider>
);

export default AdminLayout;

