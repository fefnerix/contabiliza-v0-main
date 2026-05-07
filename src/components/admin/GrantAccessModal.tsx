import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface GrantAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { plan_type: string; days?: number; notes?: string }) => Promise<void>;
}

const planOptions = [
  { value: "monthly", label: "Mensal (30 dias)" },
  { value: "annual", label: "Anual (365 dias)" },
  { value: "lifetime", label: "Lifetime" },
  { value: "trial", label: "Trial" },
  { value: "custom", label: "Personalizado" },
];

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({ open, onOpenChange, onConfirm }) => {
  const { toast } = useToast();
  const [planType, setPlanType] = useState("monthly");
  const [days, setDays] = useState<number>(7);
  const [customDate, setCustomDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const previewText = useMemo(() => {
    const now = new Date();
    if (planType === "lifetime") return "Acesso ativo até 31/12/2099";
    if (planType === "monthly") now.setDate(now.getDate() + 30);
    if (planType === "annual") now.setFullYear(now.getFullYear() + 1);
    if (planType === "trial") now.setDate(now.getDate() + (days || 7));
    if (planType === "custom") {
      if (!customDate) return "Selecione a data de término";
      return `Acesso ativo até ${new Date(customDate).toLocaleDateString("pt-BR")}`;
    }
    return `Acesso ativo até ${now.toLocaleDateString("pt-BR")}`;
  }, [customDate, days, planType]);

  const handleConfirm = async () => {
    try {
      setSaving(true);
      const payload: { plan_type: string; days?: number; notes?: string } = {
        plan_type: planType,
        notes: notes || undefined,
      };

      if (planType === "trial") payload.days = days || 7;
      if (planType === "custom") {
        if (!customDate) throw new Error("Selecione a data de término.");
        const end = new Date(customDate);
        const now = new Date();
        const computedDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (computedDays <= 0) throw new Error("Data de término deve ser futura.");
        payload.days = computedDays;
      }

      await onConfirm(payload);
      onOpenChange(false);
      toast({ title: "Acesso atualizado", description: "Operação executada com sucesso." });
    } catch (error) {
      toast({
        title: "Erro ao ativar acesso",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ativar acesso manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de acesso</Label>
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {planOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {planType === "trial" && (
            <div className="space-y-2">
              <Label>Dias de trial</Label>
              <Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value || 7))} min={1} />
            </div>
          )}

          {planType === "custom" && (
            <div className="space-y-2">
              <Label>Data de término</Label>
              <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo da ativação manual"
            />
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">{previewText}</div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={saving}>
              Confirmar ativação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

