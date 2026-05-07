import { useEffect, useMemo, useState } from "react";
import { Copy, CreditCard, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { CouponItem, PlanItem, useAdminPlans } from "@/hooks/useAdminPlans";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const AdminPlansPage = () => {
  const { toast } = useToast();
  const { plans, coupons, loading, refresh, createPlan, updatePlan, deletePlan, togglePlan, createCoupon, updateCoupon, deleteCoupon, generateCouponCode } =
    useAdminPlans();

  const [planOpen, setPlanOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deleteCouponId, setDeleteCouponId] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [planForm, setPlanForm] = useState<Partial<PlanItem> & { id?: string }>({
    name: "",
    slug: "",
    price_monthly: 0,
    price_annual: 0,
    duration_days: 30,
    trial_days: 0,
    max_transactions: 0,
    features: [],
    is_active: true,
    sort_order: 0,
  });
  const [couponForm, setCouponForm] = useState<Partial<CouponItem> & { id?: string; discountType: "percent" | "days" }>({
    code: "",
    discountType: "percent",
    discount_pct: 10,
    discount_days: 0,
    max_uses: 0,
    valid_until: "",
    is_active: true,
    used_count: 0,
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sortedPlans = useMemo(() => [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)), [plans]);

  const openCreatePlan = () => {
    setPlanForm({
      name: "",
      slug: "",
      price_monthly: 0,
      price_annual: 0,
      duration_days: 30,
      trial_days: 0,
      max_transactions: 0,
      features: [],
      is_active: true,
      sort_order: plans.length,
    });
    setFeatureInput("");
    setPlanOpen(true);
  };

  const openEditPlan = (plan: PlanItem) => {
    setPlanForm({ ...plan, features: [...(plan.features ?? [])] });
    setFeatureInput("");
    setPlanOpen(true);
  };

  const savePlan = async () => {
    const payload = {
      ...planForm,
      slug: planForm.id ? planForm.slug : slugify(planForm.slug || planForm.name || ""),
      features: planForm.features ?? [],
    };
    if (!payload.slug) {
      toast({ title: "Slug inválido", variant: "destructive" });
      return;
    }
    if (planForm.id) await updatePlan(planForm.id, payload);
    else await createPlan(payload);
    setPlanOpen(false);
  };

  const addFeature = () => {
    const value = featureInput.trim();
    if (!value) return;
    setPlanForm((prev) => ({ ...prev, features: [...(prev.features ?? []), value] }));
    setFeatureInput("");
  };

  const openCreateCoupon = () => {
    setCouponForm({
      code: "",
      discountType: "percent",
      discount_pct: 10,
      discount_days: 0,
      max_uses: 0,
      valid_until: "",
      is_active: true,
      used_count: 0,
    });
    setCouponOpen(true);
  };

  const openEditCoupon = (coupon: CouponItem) => {
    setCouponForm({
      ...coupon,
      discountType: coupon.discount_pct ? "percent" : "days",
    });
    setCouponOpen(true);
  };

  const saveCoupon = async () => {
    const payload = {
      code: (couponForm.code || "").toUpperCase(),
      discount_pct: couponForm.discountType === "percent" ? couponForm.discount_pct : null,
      discount_days: couponForm.discountType === "days" ? couponForm.discount_days : 0,
      max_uses: Number(couponForm.max_uses ?? 0),
      valid_until: couponForm.valid_until || null,
      is_active: !!couponForm.is_active,
    };
    if (couponForm.id) await updateCoupon(couponForm.id, payload);
    else await createCoupon({ ...payload, used_count: 0 });
    setCouponOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Planos de Assinatura</h2>
          <Button onClick={openCreatePlan}><Plus className="h-4 w-4 mr-2" />Novo Plano</Button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  <Switch checked={!!plan.is_active} onCheckedChange={(v) => togglePlan(plan.id, v)} />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-zinc-300">
                  <strong>R$ {Number(plan.price_monthly ?? 0).toFixed(2)}</strong>/mês ·{" "}
                  <strong>R$ {Number(plan.price_annual ?? 0).toFixed(2)}</strong>/ano
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{plan.duration_days} dias</Badge>
                  <Badge variant="secondary">trial {plan.trial_days}d</Badge>
                  <Badge variant="secondary">máx {plan.max_transactions || "ilimitado"}</Badge>
                </div>
                <ul className="list-disc list-inside text-sm text-zinc-300">
                  {(plan.features ?? []).map((feature, idx) => <li key={`${plan.id}-${idx}`}>{feature}</li>)}
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditPlan(plan)}><Pencil className="h-4 w-4 mr-1" />Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeletePlanId(plan.id)}><Trash2 className="h-4 w-4 mr-1" />Deletar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Cupons de Desconto</h2>
          <Button onClick={openCreateCoupon}><Plus className="h-4 w-4 mr-2" />Novo Cupom</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Válido até</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        {coupon.code}
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(coupon.code)}><Copy className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                    <TableCell>{coupon.discount_pct ? `${coupon.discount_pct}%` : `${coupon.discount_days} dias`}</TableCell>
                    <TableCell>{coupon.used_count}/{coupon.max_uses || "∞"}</TableCell>
                    <TableCell>{coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell><Badge variant={coupon.is_active ? "default" : "secondary"}>{coupon.is_active ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEditCoupon(coupon)}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteCouponId(coupon.id)}>Deletar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{planForm.id ? "Editar plano" : "Novo plano"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Label>Nome</Label>
            <Input value={planForm.name || ""} onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) }))} />
            <Label>Slug</Label>
            <Input value={planForm.slug || ""} readOnly={!!planForm.id} onChange={(e) => setPlanForm((p) => ({ ...p, slug: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Preço mensal</Label><Input type="number" value={planForm.price_monthly ?? 0} onChange={(e) => setPlanForm((p) => ({ ...p, price_monthly: Number(e.target.value) }))} /></div>
              <div><Label>Preço anual</Label><Input type="number" value={planForm.price_annual ?? 0} onChange={(e) => setPlanForm((p) => ({ ...p, price_annual: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>Duração (dias)</Label><Input type="number" value={planForm.duration_days ?? 30} onChange={(e) => setPlanForm((p) => ({ ...p, duration_days: Number(e.target.value) }))} /></div>
              <div><Label>Trial (dias)</Label><Input type="number" value={planForm.trial_days ?? 0} onChange={(e) => setPlanForm((p) => ({ ...p, trial_days: Number(e.target.value) }))} /></div>
              <div><Label>Máx transações</Label><Input type="number" value={planForm.max_transactions ?? 0} onChange={(e) => setPlanForm((p) => ({ ...p, max_transactions: Number(e.target.value) }))} /></div>
            </div>
            <Label>Features</Label>
            <div className="flex gap-2">
              <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} />
              <Button variant="outline" onClick={addFeature}>Adicionar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(planForm.features ?? []).map((feature, idx) => (
                <Badge key={`${feature}-${idx}`} className="gap-1">
                  {feature}
                  <button onClick={() => setPlanForm((p) => ({ ...p, features: (p.features ?? []).filter((_, i) => i !== idx) }))}>×</button>
                </Badge>
              ))}
            </div>
            <Label>Stripe Price ID mensal</Label>
            <Input value={planForm.stripe_price_id_monthly ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, stripe_price_id_monthly: e.target.value }))} />
            <Label>Stripe Price ID anual</Label>
            <Input value={planForm.stripe_price_id_annual ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, stripe_price_id_annual: e.target.value }))} />
            <Label>Hotmart Offer mensal</Label>
            <Input value={planForm.hotmart_offer_code_monthly ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, hotmart_offer_code_monthly: e.target.value }))} />
            <Label>Hotmart Offer anual</Label>
            <Input value={planForm.hotmart_offer_code_annual ?? ""} onChange={(e) => setPlanForm((p) => ({ ...p, hotmart_offer_code_annual: e.target.value }))} />
            <div className="flex items-center justify-between">
              <Label>Status ativo</Label>
              <Switch checked={!!planForm.is_active} onCheckedChange={(v) => setPlanForm((p) => ({ ...p, is_active: v }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancelar</Button>
              <Button onClick={savePlan}>Salvar Plano</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{couponForm.id ? "Editar cupom" : "Novo cupom"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Código</Label>
            <div className="flex gap-2">
              <Input value={(couponForm.code || "").toUpperCase()} onChange={(e) => setCouponForm((c) => ({ ...c, code: e.target.value.toUpperCase() }))} />
              <Button variant="outline" onClick={() => setCouponForm((c) => ({ ...c, code: generateCouponCode() }))}>Gerar</Button>
            </div>
            <Label>Tipo de desconto</Label>
            <div className="flex gap-2">
              <Button variant={couponForm.discountType === "percent" ? "default" : "outline"} onClick={() => setCouponForm((c) => ({ ...c, discountType: "percent" }))}>Percentual</Button>
              <Button variant={couponForm.discountType === "days" ? "default" : "outline"} onClick={() => setCouponForm((c) => ({ ...c, discountType: "days" }))}>Dias extras</Button>
            </div>
            {couponForm.discountType === "percent" ? (
              <div className="space-y-2">
                <Slider min={5} max={100} step={1} value={[Number(couponForm.discount_pct ?? 10)]} onValueChange={(v) => setCouponForm((c) => ({ ...c, discount_pct: v[0] }))} />
                <Input type="number" min={5} max={100} value={couponForm.discount_pct ?? 10} onChange={(e) => setCouponForm((c) => ({ ...c, discount_pct: Number(e.target.value) }))} />
              </div>
            ) : (
              <Input type="number" value={couponForm.discount_days ?? 0} onChange={(e) => setCouponForm((c) => ({ ...c, discount_days: Number(e.target.value) }))} />
            )}
            <Label>Uso máximo (0 = ilimitado)</Label>
            <Input type="number" value={couponForm.max_uses ?? 0} onChange={(e) => setCouponForm((c) => ({ ...c, max_uses: Number(e.target.value) }))} />
            <Label>Válido até (opcional)</Label>
            <Input type="date" value={couponForm.valid_until ? String(couponForm.valid_until).slice(0, 10) : ""} onChange={(e) => setCouponForm((c) => ({ ...c, valid_until: e.target.value }))} />
            <div className="flex items-center justify-between">
              <Label>Status ativo</Label>
              <Switch checked={!!couponForm.is_active} onCheckedChange={(v) => setCouponForm((c) => ({ ...c, is_active: v }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCouponOpen(false)}>Cancelar</Button>
              <Button onClick={saveCoupon}>Salvar Cupom</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePlanId} onOpenChange={(o) => !o && setDeletePlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deletar plano?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!deletePlanId) return; await deletePlan(deletePlanId); setDeletePlanId(null); }}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteCouponId} onOpenChange={(o) => !o && setDeleteCouponId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deletar cupom?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (!deleteCouponId) return; await deleteCoupon(deleteCouponId); setDeleteCouponId(null); }}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPlansPage;

