import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

export const AdminCommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const actions = useMemo(
    () => ({
      go: (path: string) => {
        navigate(path);
        setOpen(false);
      },
      async toggleMaintenance() {
        const { data } = await supabase
          .from("poupeja_settings")
          .select("value")
          .eq("category", "system")
          .eq("key", "maintenance_mode")
          .maybeSingle();
        const next = data?.value === "true" ? "false" : "true";
        await supabase
          .from("poupeja_settings")
          .upsert({ category: "system", key: "maintenance_mode", value: next }, { onConflict: "category,key" });
        toast({ title: `Modo manutenção ${next === "true" ? "ativado" : "desativado"}` });
        setOpen(false);
      },
      focusCustomerSearch() {
        window.dispatchEvent(new CustomEvent("admin:focus-customer-search"));
      },
      exportCsv() {
        window.dispatchEvent(new CustomEvent("admin:export-customers"));
        setOpen(false);
      },
    }),
    [navigate, toast],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput value={search} onValueChange={setSearch} placeholder="Busque páginas e ações..." />
      <CommandList>
        <CommandEmpty>Nenhum comando encontrado.</CommandEmpty>

        <CommandGroup heading="Navegar">
          <CommandItem onSelect={() => actions.go("/admin/dashboard")}>Dashboard</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/customers")}>Clientes</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/analytics")}>Analytics</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/plans")}>Planos</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/checkouts")}>Checkouts</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/communications")}>Emails</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/content")}>Conteúdo</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/settings")}>Configurações</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/logs")}>Infraestrutura</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/audit")}>Auditoria</CommandItem>
        </CommandGroup>

        <CommandGroup heading="Clientes">
          <CommandItem
            onSelect={() => {
              actions.go("/admin/customers");
              setTimeout(() => actions.focusCustomerSearch(), 50);
            }}
          >
            Buscar cliente...
          </CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/customers?filter=critical")}>Clientes em risco</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/customers?filter=expiring_today")}>Expirando hoje</CommandItem>
        </CommandGroup>

        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => actions.toggleMaintenance()}>Modo manutenção</CommandItem>
          <CommandItem onSelect={() => actions.go("/admin/logs?tab=webhooks&filter=errors")}>Ver erros de webhook</CommandItem>
          <CommandItem onSelect={() => actions.exportCsv()}>
            Exportar clientes CSV
            <CommandShortcut>CSV</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

