import { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Copy, CreditCard, Eye, EyeOff, Hand, Lock, ShoppingBag, Webhook } from "lucide-react";
import { GrantAccessModal } from "@/components/admin/GrantAccessModal";
import { useAdminCheckouts } from "@/hooks/useAdminCheckouts";
import { useAdminCustomers } from "@/hooks/useAdminCustomers";

type ProviderKey = "stripe" | "hotmart" | "manual" | "generic";

const relative = (iso: string | null) => {
  if (!iso) return "Nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "há instantes";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
};

const AdminCheckoutsPage = () => {
  const { toast } = useToast();
  const { providers, settings, toggleProvider, saveConfig, generateToken, webhookEvents, eventsLoading, eventsFilter, setEventsFilter, reprocessEvent, ignoreEvent } = useAdminCheckouts();
  const { grantAccess } = useAdminCustomers();
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [drawerEvent, setDrawerEvent] = useState<any>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [forms, setForms] = useState({
    stripe_secret_key: settings["stripe.stripe_secret_key"] || "",
    stripe_publishable_key: settings["stripe.stripe_publishable_key"] || "",
    stripe_webhook_secret: settings["stripe.stripe_webhook_secret"] || "",
    hotmart_client_id: settings["hotmart.hotmart_client_id"] || "",
    hotmart_client_secret: settings["hotmart.hotmart_client_secret"] || "",
    hotmart_webhook_secret: settings["hotmart.hotmart_webhook_secret"] || "",
    hotmart_product_id: settings["hotmart.hotmart_product_id"] || "",
    hotmart_offer_code_monthly: settings["hotmart.hotmart_offer_code_monthly"] || "",
    hotmart_offer_code_annual: settings["hotmart.hotmart_offer_code_annual"] || "",
    generic_webhook_token: settings["checkout.generic_webhook_token"] || "",
  });

  const activeCount = useMemo(() => [providers.stripe.enabled, providers.hotmart.enabled, providers.manual.enabled, providers.generic.enabled].filter(Boolean).length, [providers]);

  const syncForms = () => {
    setForms({
      stripe_secret_key: settings["stripe.stripe_secret_key"] || "",
      stripe_publishable_key: settings["stripe.stripe_publishable_key"] || "",
      stripe_webhook_secret: settings["stripe.stripe_webhook_secret"] || "",
      hotmart_client_id: settings["hotmart.hotmart_client_id"] || "",
      hotmart_client_secret: settings["hotmart.hotmart_client_secret"] || "",
      hotmart_webhook_secret: settings["hotmart.hotmart_webhook_secret"] || "",
      hotmart_product_id: settings["hotmart.hotmart_product_id"] || "",
      hotmart_offer_code_monthly: settings["hotmart.hotmart_offer_code_monthly"] || "",
      hotmart_offer_code_annual: settings["hotmart.hotmart_offer_code_annual"] || "",
      generic_webhook_token: settings["checkout.generic_webhook_token"] || "",
    });
  };

  useEffect(() => {
    syncForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const providerBadge = (provider: ProviderKey) => {
    if (!providers[provider].enabled && provider !== "manual") return <Badge variant="secondary">Desativado</Badge>;
    if (providers[provider].configured) return <Badge className="bg-emerald-500/20 text-emerald-300">Configurado ✅</Badge>;
    return <Badge className="bg-amber-500/20 text-amber-300">Chaves pendentes ⚠️</Badge>;
  };

  const copyText = async (value: string) => {
    await navigator.clipboard.writeText(value);
    toast({ title: "Copiado" });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Checkouts & Integrações</h2>
          <p className="text-zinc-400 text-sm">O sistema funciona normalmente com todos os provedores desativados.</p>
        </div>
        <Badge>{activeCount} provedores ativos</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex justify-between"><span className="flex items-center gap-2"><CreditCard className="text-emerald-500" />Stripe</span>{providerBadge("stripe")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>ATIVO / INATIVO</span>
              <Switch checked={providers.stripe.enabled} onCheckedChange={(v) => toggleProvider("stripe", v)} />
            </div>
            <p className="text-xs text-zinc-400">Último evento: {providers.stripe.lastEvent ? relative(providers.stripe.lastEvent) : "Nunca"}</p>
            <Accordion type="single" collapsible>
              <AccordionItem value="stripe">
                <AccordionTrigger>⚙️ Configurar</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <Label>stripe_secret_key</Label>
                  <div className="flex gap-2"><Input type={showSecret.stripe_secret_key ? "text" : "password"} value={forms.stripe_secret_key} onChange={(e) => setForms((f) => ({ ...f, stripe_secret_key: e.target.value }))} /><Button variant="outline" size="icon" onClick={() => setShowSecret((s) => ({ ...s, stripe_secret_key: !s.stripe_secret_key }))}>{showSecret.stripe_secret_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div>
                  <Label>stripe_publishable_key</Label>
                  <Input value={forms.stripe_publishable_key} onChange={(e) => setForms((f) => ({ ...f, stripe_publishable_key: e.target.value }))} />
                  <Label>stripe_webhook_secret</Label>
                  <div className="flex gap-2"><Input type={showSecret.stripe_webhook_secret ? "text" : "password"} value={forms.stripe_webhook_secret} onChange={(e) => setForms((f) => ({ ...f, stripe_webhook_secret: e.target.value }))} /><Button variant="outline" size="icon" onClick={() => setShowSecret((s) => ({ ...s, stripe_webhook_secret: !s.stripe_webhook_secret }))}>{showSecret.stripe_webhook_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div>
                  <div className="rounded border p-2 text-xs">
                    <p className="text-zinc-400">Webhook URL</p>
                    <div className="flex items-center justify-between gap-2"><code className="truncate">https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/stripe-webhook</code><Button size="sm" variant="outline" onClick={() => copyText("https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/stripe-webhook")}><Copy className="h-3.5 w-3.5" /></Button></div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">checkout.session.completed</Badge>
                    <Badge variant="outline">customer.subscription.*</Badge>
                    <Badge variant="outline">invoice.*</Badge>
                  </div>
                  <Button onClick={() => saveConfig("stripe", { stripe_secret_key: forms.stripe_secret_key, stripe_publishable_key: forms.stripe_publishable_key, stripe_webhook_secret: forms.stripe_webhook_secret })}>Salvar Stripe</Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex justify-between"><span className="flex items-center gap-2"><ShoppingBag className="text-orange-500" />Hotmart</span>{providerBadge("hotmart")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span>ATIVO / INATIVO</span><Switch checked={providers.hotmart.enabled} onCheckedChange={(v) => toggleProvider("hotmart", v)} /></div>
            <p className="text-xs text-zinc-400">Último evento: {providers.hotmart.lastEvent ? relative(providers.hotmart.lastEvent) : "Nunca"}</p>
            <Accordion type="single" collapsible>
              <AccordionItem value="hotmart">
                <AccordionTrigger>⚙️ Configurar</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  {[
                    "hotmart_client_id",
                    "hotmart_client_secret",
                    "hotmart_webhook_secret",
                    "hotmart_product_id",
                    "hotmart_offer_code_monthly",
                    "hotmart_offer_code_annual",
                  ].map((field) => (
                    <div key={field}>
                      <Label>{field}</Label>
                      <Input value={(forms as any)[field]} onChange={(e) => setForms((f) => ({ ...f, [field]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="rounded border p-2 text-xs">
                    <p className="text-zinc-400">Webhook URL</p>
                    <div className="flex items-center justify-between gap-2"><code className="truncate">https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/hotmart-webhook</code><Button size="sm" variant="outline" onClick={() => copyText("https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/hotmart-webhook")}><Copy className="h-3.5 w-3.5" /></Button></div>
                  </div>
                  <Button onClick={() => saveConfig("hotmart", {
                    hotmart_client_id: forms.hotmart_client_id,
                    hotmart_client_secret: forms.hotmart_client_secret,
                    hotmart_webhook_secret: forms.hotmart_webhook_secret,
                    hotmart_product_id: forms.hotmart_product_id,
                    hotmart_offer_code_monthly: forms.hotmart_offer_code_monthly,
                    hotmart_offer_code_annual: forms.hotmart_offer_code_annual,
                  })}>Salvar Hotmart</Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex justify-between"><span className="flex items-center gap-2"><Hand className="text-blue-500" />Manual</span><Badge className="bg-emerald-500/20 text-emerald-300">Sempre ativo</Badge></CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span className="flex items-center gap-1">Sempre disponível <Lock className="h-3.5 w-3.5" /></span><Switch checked disabled /></div>
            <Button onClick={() => setManualOpen(true)}>Ativar acesso para usuário</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex justify-between"><span className="flex items-center gap-2"><Webhook className="text-violet-500" />Webhook Genérico</span>{providerBadge("generic")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span>ATIVO / INATIVO</span><Switch checked={providers.generic.enabled} onCheckedChange={(v) => toggleProvider("generic", v)} /></div>
            <p className="text-xs text-zinc-400">Último evento: {providers.generic.lastEvent ? relative(providers.generic.lastEvent) : "Não configurado"}</p>
            <Accordion type="single" collapsible>
              <AccordionItem value="generic">
                <AccordionTrigger>⚙️ Configurar</AccordionTrigger>
                <AccordionContent className="space-y-2">
                  <Label>generic_webhook_token</Label>
                  <div className="flex gap-2">
                    <Input value={forms.generic_webhook_token} onChange={(e) => setForms((f) => ({ ...f, generic_webhook_token: e.target.value }))} />
                    <Button variant="outline" onClick={() => setForms((f) => ({ ...f, generic_webhook_token: generateToken() }))}>Gerar novo token</Button>
                  </div>
                  <div className="rounded border p-2 text-xs">
                    <p className="text-zinc-400">Webhook URL</p>
                    <div className="flex items-center justify-between gap-2"><code className="truncate">https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/generic-webhook</code><Button size="sm" variant="outline" onClick={() => copyText("https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/generic-webhook")}><Copy className="h-3.5 w-3.5" /></Button></div>
                  </div>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="docs">
                      <AccordionTrigger>Documentação do payload</AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs whitespace-pre-wrap">{`Ativar: { "event": "activate", "email": "user@email.com", "plan_type": "monthly" }\nRevogar: { "event": "revoke", "email": "user@email.com" }\nHeader: Authorization: Bearer {seu_token}`}</pre>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Button onClick={() => saveConfig("generic", { generic_webhook_token: forms.generic_webhook_token })}>Salvar Genérico</Button>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Eventos recentes de webhook</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Select value={eventsFilter.provider} onValueChange={(v: any) => setEventsFilter((f) => ({ ...f, provider: v }))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="hotmart">Hotmart</SelectItem>
                <SelectItem value="generic">Genérico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventsFilter.error} onValueChange={(v: any) => setEventsFilter((f) => ({ ...f, error: v }))}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_error">Com erro</SelectItem>
                <SelectItem value="without_error">Sem erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Provedor</TableHead><TableHead>Tipo</TableHead><TableHead>✅/❌</TableHead><TableHead>Erro</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {eventsLoading ? (
                <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
              ) : webhookEvents.map((evt) => (
                <TableRow key={evt.id} className="cursor-pointer" onClick={() => setDrawerEvent(evt)}>
                  <TableCell><Badge variant="outline">{evt.provider}</Badge></TableCell>
                  <TableCell>{evt.event_type}</TableCell>
                  <TableCell>{evt.error ? "❌" : "✅"}</TableCell>
                  <TableCell>{evt.error ? String(evt.error).slice(0, 50) : "—"}</TableCell>
                  <TableCell>{new Date(evt.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="space-x-2" onClick={(e) => e.stopPropagation()}>
                    {evt.error ? <Button size="sm" variant="outline" onClick={() => reprocessEvent(evt.id)}>🔄 Reprocessar</Button> : null}
                    <Button size="sm" variant="ghost" onClick={() => ignoreEvent(evt.id)}>✓ Ignorar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!drawerEvent} onOpenChange={(v) => !v && setDrawerEvent(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader><SheetTitle>Payload do evento</SheetTitle></SheetHeader>
          <pre className="text-xs mt-4 whitespace-pre-wrap">{drawerEvent ? JSON.stringify(drawerEvent.payload, null, 2) : ""}</pre>
        </SheetContent>
      </Sheet>

      <GrantAccessModal
        open={manualOpen}
        onOpenChange={setManualOpen}
        onConfirm={async (payload) => {
          const userId = prompt("Informe o user_id para ativação manual:");
          if (!userId) return;
          await grantAccess(userId, payload);
          toast({ title: "Acesso ativado" });
        }}
      />
    </div>
  );
};

export default AdminCheckoutsPage;

