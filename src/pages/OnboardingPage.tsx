import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from "@/contexts/AppContext";
import { useContactConfig } from "@/hooks/useContactConfig";
import { markOnboardingDone } from "@/utils/onboarding";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, ExternalLink, Lock } from "lucide-react";

const FALLBACK_WHATSAPP_DIGITS = "5524981493204";
const TOTAL_STEPS = 4;

const FINANCIAL_REQUIRED_MSG =
  "Por favor completa al menos: ingreso mensual, objetivo y mayor desafío para continuar";

type FinancialForm = {
  monthlyIncome: string;
  fixedExpenses: string;
  variableExpenses: string;
  totalDebt: string;
  monthlySavings: string;
  goal12m: string;
  goalAmount: string;
  biggestChallenge: string;
};

const emptyFinancialForm = (): FinancialForm => ({
  monthlyIncome: "",
  fixedExpenses: "",
  variableExpenses: "",
  totalDebt: "",
  monthlySavings: "",
  goal12m: "",
  goalAmount: "",
  biggestChallenge: "",
});

function displayNameFromUser(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const meta = user.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.fullName as string) ||
    "";
  return name.trim() || user.email?.split("@")[0] || "ahí";
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

function isFinancialProfileComplete(form: FinancialForm): boolean {
  return (
    parseOptionalNumber(form.monthlyIncome) !== null &&
    form.goal12m.trim().length > 0 &&
    form.biggestChallenge.trim().length > 0
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppContext();
  const { config, isLoading: contactLoading } = useContactConfig();
  const [step, setStep] = useState(1);
  const [sentWhatsApp, setSentWhatsApp] = useState(false);
  const [financialForm, setFinancialForm] = useState<FinancialForm>(emptyFinancialForm);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileValidationError, setProfileValidationError] = useState<string | null>(null);

  const phoneDigits = (config.contactPhone || FALLBACK_WHATSAPP_DIGITS).replace(/\D/g, "");
  const displayPhone = phoneDigits.startsWith("55")
    ? `+${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2, 4)} ${phoneDigits.slice(4, 9)}-${phoneDigits.slice(9)}`
    : `+${phoneDigits}`;
  const waLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent("Hola")}`;

  const finish = () => {
    markOnboardingDone();
    navigate("/dashboard", { replace: true });
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(`+${phoneDigits}`);
      toast({ title: "Número copiado" });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const updateFinancialField = (field: keyof FinancialForm, value: string) => {
    setFinancialForm((prev) => {
      const next = { ...prev, [field]: value };
      if (profileValidationError && isFinancialProfileComplete(next)) {
        setProfileValidationError(null);
      }
      return next;
    });
  };

  const saveFinancialProfile = async () => {
    if (!isFinancialProfileComplete(financialForm)) {
      setProfileValidationError(FINANCIAL_REQUIRED_MSG);
      return;
    }

    if (!user?.id) {
      toast({
        title: "Sesión no encontrada",
        description: "Inicia sesión de nuevo para continuar.",
        variant: "destructive",
      });
      return;
    }

    setProfileValidationError(null);
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("poupeja_financial_profile").upsert(
        {
          user_id: user.id,
          monthly_income: parseOptionalNumber(financialForm.monthlyIncome),
          fixed_expenses: parseOptionalNumber(financialForm.fixedExpenses),
          variable_expenses: parseOptionalNumber(financialForm.variableExpenses),
          total_debt: parseOptionalNumber(financialForm.totalDebt),
          monthly_savings: parseOptionalNumber(financialForm.monthlySavings),
          goal_12m: financialForm.goal12m.trim() || null,
          goal_amount: parseOptionalNumber(financialForm.goalAmount),
          biggest_challenge: financialForm.biggestChallenge.trim() || null,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) throw error;
      setStep(4);
    } catch (err) {
      console.error("Financial profile save error:", err);
      toast({
        title: "No se pudo guardar",
        description: "Intenta de nuevo en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const progress = (step / TOTAL_STEPS) * 100;
  const name = user ? displayNameFromUser(user) : "";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6">
      <div className="w-full max-w-md">
        <p className="text-sm text-muted-foreground mb-2 text-center">
          Paso {step} de {TOTAL_STEPS}
        </p>
        <Progress value={progress} className="mb-8 h-2" />

        {step === 1 && (
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-bold">¡Bienvenido(a), {name}! 🎉</h1>
            <p className="text-muted-foreground">
              Soy tu asistente financiero personal. Estoy aquí para ayudarte a controlar tus
              finanzas de forma simple, directo desde WhatsApp.
            </p>
            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
              ¡Empecemos! →
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-center">Conecta tu WhatsApp</h1>
            <p className="text-muted-foreground text-center text-sm">
              Agrega este número a tus contactos y envía un &quot;Hola&quot; para activar tu
              asistente:
            </p>
            <Card className="p-4 text-center">
              <p className="text-2xl font-semibold tracking-wide">{displayPhone}</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button type="button" variant="outline" size="sm" onClick={copyNumber}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button type="button" size="sm" asChild disabled={contactLoading}>
                  <a href={waLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Abrir WhatsApp
                  </a>
                </Button>
              </div>
            </Card>
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={sentWhatsApp}
                onCheckedChange={(v) => setSentWhatsApp(v === true)}
              />
              <span className="text-sm">Ya envié el mensaje</span>
            </label>
            <Button
              className="w-full"
              disabled={!sentWhatsApp}
              onClick={() => setStep(3)}
            >
              Siguiente →
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold leading-snug">
                Cuéntame tu situación financiera
              </h1>
              <p className="text-muted-foreground text-sm flex items-start gap-2 text-left">
                <Lock className="h-4 w-4 shrink-0 mt-0.5 text-primary" aria-hidden />
                <span>
                  Esta información es 100% confidencial y se usa para generar tus reportes mensuales
                  personalizados según tu objetivo.
                </span>
              </p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              <div>
                <Label htmlFor="monthlyIncome">
                  Ingreso mensual <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  required
                  className="mt-1"
                  value={financialForm.monthlyIncome}
                  onChange={(e) => updateFinancialField("monthlyIncome", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="fixedExpenses">Gastos fijos mensuales</Label>
                <p className="text-xs text-muted-foreground mb-1">Alquiler, cuotas, etc.</p>
                <Input
                  id="fixedExpenses"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={financialForm.fixedExpenses}
                  onChange={(e) => updateFinancialField("fixedExpenses", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="variableExpenses">Gastos variables mensuales</Label>
                <p className="text-xs text-muted-foreground mb-1">Estimación</p>
                <Input
                  id="variableExpenses"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={financialForm.variableExpenses}
                  onChange={(e) => updateFinancialField("variableExpenses", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="totalDebt">Deudas totales actuales</Label>
                <p className="text-xs text-muted-foreground mb-1">Tarjeta, préstamos, etc.</p>
                <Input
                  id="totalDebt"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={financialForm.totalDebt}
                  onChange={(e) => updateFinancialField("totalDebt", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="monthlySavings">¿Cuánto logras ahorrar por mes?</Label>
                <Input
                  id="monthlySavings"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={financialForm.monthlySavings}
                  onChange={(e) => updateFinancialField("monthlySavings", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="goal12m">
                  Objetivo principal en 12 meses <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="goal12m"
                  rows={2}
                  required
                  placeholder="Ej: saldar deudas, ahorrar para viaje, comprar auto"
                  value={financialForm.goal12m}
                  onChange={(e) => updateFinancialField("goal12m", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="goalAmount">Monto necesario para el objetivo</Label>
                <Input
                  id="goalAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={financialForm.goalAmount}
                  onChange={(e) => updateFinancialField("goalAmount", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="biggestChallenge">
                  Mayor desafío financiero hoy <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="biggestChallenge"
                  rows={2}
                  required
                  placeholder="Ej: controlar gastos en tarjeta, aumentar ingresos"
                  value={financialForm.biggestChallenge}
                  onChange={(e) => updateFinancialField("biggestChallenge", e.target.value)}
                />
              </div>
            </div>

            {profileValidationError && (
              <p className="text-sm text-destructive text-center" role="alert">
                {profileValidationError}
              </p>
            )}

            <Button
              className="w-full"
              disabled={savingProfile || !isFinancialProfileComplete(financialForm)}
              onClick={() => void saveFinancialProfile()}
            >
              {savingProfile ? "Guardando..." : "Guardar y continuar →"}
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center">
            <h1 className="text-2xl font-bold">Registra tu primer gasto</h1>
            <p className="text-muted-foreground text-sm">
              Envía un mensaje como este a WhatsApp:
            </p>
            <Card className="p-4 text-left space-y-2 bg-muted/50">
              <p className="text-sm font-medium">&quot;gasté 30 en el almuerzo&quot;</p>
              <p className="text-xs text-muted-foreground">o</p>
              <p className="text-sm font-medium">&quot;recibí 3000 de salario&quot;</p>
            </Card>
            <Button className="w-full" size="lg" onClick={finish}>
              Ir al dashboard →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
