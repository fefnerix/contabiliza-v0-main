import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Settings2, Hand, PlugZap } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileNavBar from "@/components/layout/MobileNavBar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppContext } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";

type ProviderKey = "stripe" | "hotmart" | "manual" | "generic";

interface SettingRow {
  category: string;
  key: string;
  value: string;
}

const AdminCheckoutsPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { hideValues, toggleHideValues } = useAppContext();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Map<string, string>>(new Map());
  const [events, setEvents] = useState<any[]>([]);
  const [providerFilter, setProviderFilter] = useState<"all" | "stripe" | "hotmart" | "generic">("all");
  const [openCards, setOpenCards] = useState<Record<ProviderKey, boolean>>({
    stripe: false,
    hotmart: false,
    manual: false,
    generic: false,
  });
  const [eventsPage, setEventsPage] = useState(0);

  const load = async () => {
    const adminDb = supabase as any;
    const [{ data: settingsData }, { data: eventData }] = await Promise.all([
      adminDb.from("poupeja_settings").select("category,key,value").in("category", ["checkout", "stripe", "hotmart"]),
      adminDb.from("poupeja_webhook_events").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    setSettings(
      new Map((settingsData as SettingRow[] | null | undefined)?.map((s) => [`${s.category}.${s.key}`, s.value]) ?? []),
    );
    setEvents(eventData ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const setSetting = async (category: string, key: string, value: string) => {
    const adminDb = supabase as any;
    const { error } = await adminDb.from("poupeja_settings").upsert({ category, key, value }, { onConflict: "category,key" });
    if (error) throw error;
    await load();
  };

  const toggleProvider = async (provider: ProviderKey, enabled: boolean) => {
    if (provider === "manual") return;
    await setSetting("checkout", `${provider}_enabled`, enabled ? "true" : "false");
    toast({ title: `${provider} ${enabled ? "ativado" : "desativado"}` });
  };

  const filteredEvents = useMemo(
    () => events.filter((event) => providerFilter === "all" || event.provider === providerFilter),
    [events, providerFilter],
  );
  const pagedEvents = useMemo(() => filteredEvents.slice(eventsPage * 10, eventsPage * 10 + 10), [eventsPage, filteredEvents]);
  const eventTotalPages = Math.max(1, Math.ceil(filteredEvents.length / 10));

  const renderProviderCard = (
    provider: ProviderKey,
    title: string,
    icon: React.ReactNode,
    description: string,
    fields: Array<{ category: string; key: string; label: string; placeholder?: string }>,
    webhookUrl?: string,
  ) => {
    const enabled = provider === "manual" ? true : settings.get(`checkout.${provider}_enabled`) === "true";
    const configured = fields.every((f) => (settings.get(`${f.category}.${f.key}`) ?? "").trim().length > 0 || provider === "manual");
    const lastEvent = events.find((event) => event.provider === provider);

    const opened = openCards[provider];

    return (
      <Card key={provider}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {icon} {title}
            </span>
            <div className="flex items-center gap-2">
              <Badge className={configured ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                {configured ? "Configurado" : "Chaves faltando"}
              </Badge>
              <Switch checked={enabled} onCheckedChange={(v) => toggleProvider(provider, v)} disabled={provider === "manual"} />
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Último evento: {lastEvent ? new Date(lastEvent.created_at).toLocaleString("pt-BR") : "Nenhum evento ainda"}
            </p>
            <Button size="sm" variant="outline" onClick={() => setOpenCards((prev) => ({ ...prev, [provider]: !prev[provider] }))}>
              {opened ? "Fechar" : "Configurar"}
            </Button>
          </div>

          {opened && (
            <div className="space-y-3 rounded-md border p-3">
              {fields.map((field) => (
                <div key={`${field.category}.${field.key}`} className="space-y-1">
                  <Label>{field.label}</Label>
                  <Input
                    value={settings.get(`${field.category}.${field.key}`) ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => {
                      const next = new Map(settings);
                      next.set(`${field.category}.${field.key}`, e.target.value);
                      setSettings(next);
                    }}
                  />
                </div>
              ))}

              {provider === "generic" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const token = crypto.randomUUID();
                    const next = new Map(settings);
                    next.set("checkout.generic_webhook_token", token);
                    setSettings(next);
                    setSetting("checkout", "generic_webhook_token", token);
                  }}
                >
                  Gerar token UUID
                </Button>
              )}

              {webhookUrl && (
                <div className="rounded-md border p-2 text-sm">
                  <p className="text-muted-foreground mb-1">Webhook URL</p>
                  <div className="flex items-center gap-2">
                    <code className="truncate">{webhookUrl}</code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        toast({ title: "URL copiada" });
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

              {provider === "generic" && (
                <div className="text-xs text-muted-foreground rounded-md border p-2">
                  Payload exemplo:
                  <pre>{`{"event":"activate","email":"user@email.com","plan_type":"monthly","days":30}`}</pre>
                  <pre>{`{"event":"revoke","email":"user@email.com"}`}</pre>
                </div>
              )}

              {fields.length > 0 && (
                <Button
                  onClick={async () => {
                    try {
                      for (const field of fields) {
                        const value = settings.get(`${field.category}.${field.key}`) ?? "";
                        await setSetting(field.category, field.key, value);
                      }
                      toast({ title: "Configurações salvas" });
                    } catch (error) {
                      toast({
                        title: "Erro ao salvar configuração",
                        description: error instanceof Error ? error.message : "Tente novamente.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Salvar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const content = (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Checkouts & Integrações</h1>
        <p className="text-sm text-muted-foreground">
          Ative ou desative provedores de pagamento. O sistema funciona normalmente com todos desativados.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {renderProviderCard(
          "stripe",
          "Stripe",
          <CreditCard className="h-4 w-4" />,
          "Checkout e assinaturas via Stripe",
          [
            { category: "stripe", key: "stripe_secret_key", label: "stripe_secret_key", placeholder: "sk_live_..." },
            { category: "stripe", key: "stripe_publishable_key", label: "stripe_publishable_key", placeholder: "pk_live_..." },
            { category: "stripe", key: "stripe_webhook_secret", label: "stripe_webhook_secret", placeholder: "whsec_..." },
          ],
          "https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/stripe-webhook",
        )}

        {renderProviderCard(
          "hotmart",
          "Hotmart",
          <Settings2 className="h-4 w-4" />,
          "Recebimento de assinaturas e compras via Hotmart",
          [
            { category: "hotmart", key: "hotmart_client_id", label: "hotmart_client_id" },
            { category: "hotmart", key: "hotmart_client_secret", label: "hotmart_client_secret" },
            { category: "hotmart", key: "hotmart_webhook_secret", label: "hotmart_webhook_secret (hottok)" },
            { category: "hotmart", key: "hotmart_product_id", label: "hotmart_product_id" },
            { category: "hotmart", key: "hotmart_offer_code_monthly", label: "hotmart_offer_code_monthly" },
            { category: "hotmart", key: "hotmart_offer_code_annual", label: "hotmart_offer_code_annual" },
          ],
          "https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/hotmart-webhook",
        )}

        {renderProviderCard(
          "manual",
          "Ativação Manual",
          <Hand className="h-4 w-4" />,
          "Acesso manual pelo time de operação",
          [],
        )}

        {renderProviderCard(
          "generic",
          "Webhook Genérico",
          <PlugZap className="h-4 w-4" />,
          "Integração com provedores customizados",
          [{ category: "checkout", key: "generic_webhook_token", label: "generic_webhook_token" }],
          "https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/generic-webhook",
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de webhooks</CardTitle>
          <div className="flex gap-2">
            <Button variant={providerFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setProviderFilter("all")}>Todos</Button>
            <Button variant={providerFilter === "stripe" ? "default" : "outline"} size="sm" onClick={() => setProviderFilter("stripe")}>Stripe</Button>
            <Button variant={providerFilter === "hotmart" ? "default" : "outline"} size="sm" onClick={() => setProviderFilter("hotmart")}>Hotmart</Button>
            <Button variant={providerFilter === "generic" ? "default" : "outline"} size="sm" onClick={() => setProviderFilter("generic")}>Genérico</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Processado</TableHead>
                <TableHead>Erro</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.provider}</TableCell>
                  <TableCell>{event.event_type}</TableCell>
                  <TableCell>{event.processed ? "✅" : "❌"}</TableCell>
                  <TableCell>{event.error || "—"}</TableCell>
                  <TableCell>{new Date(event.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!event.error}
                      onClick={async () => {
                        const adminDb = supabase as any;
                        await adminDb.from("poupeja_webhook_events").update({ processed: false }).eq("id", event.id);
                        await load();
                      }}
                    >
                      Reprocessar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" size="sm" disabled={eventsPage <= 0} onClick={() => setEventsPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={eventsPage + 1 >= eventTotalPages}
              onClick={() => setEventsPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen">
        <MobileHeader hideValues={hideValues} toggleHideValues={toggleHideValues} />
        <main className="flex-1 overflow-auto p-4 pb-20">{content}</main>
        <MobileNavBar />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{content}</main>
    </div>
  );
};

export default AdminCheckoutsPage;

