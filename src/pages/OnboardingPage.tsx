import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from "@/contexts/AppContext";
import { useContactConfig } from "@/hooks/useContactConfig";
import { markOnboardingDone } from "@/utils/onboarding";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink } from "lucide-react";

const FALLBACK_WHATSAPP_DIGITS = "5524981493204";

function displayNameFromUser(user: { user_metadata?: Record<string, unknown>; email?: string | null }) {
  const meta = user.user_metadata ?? {};
  const name =
    (meta.full_name as string) ||
    (meta.name as string) ||
    (meta.fullName as string) ||
    "";
  return name.trim() || user.email?.split("@")[0] || "ahí";
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAppContext();
  const { config, isLoading: contactLoading } = useContactConfig();
  const [step, setStep] = useState(1);
  const [sentWhatsApp, setSentWhatsApp] = useState(false);

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

  const progress = (step / 3) * 100;
  const name = user ? displayNameFromUser(user) : "";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-6">
      <div className="w-full max-w-md">
        <p className="text-sm text-muted-foreground mb-2 text-center">
          Paso {step} de 3
        </p>
        <Progress value={progress} className="mb-8 h-2" />

        {step === 1 && (
          <div className="text-center space-y-6">
            <h1 className="text-2xl font-bold">¡Bienvenido(a), {name}! 🎉</h1>
            <p className="text-muted-foreground">
              Contabiliza te ayuda a registrar gastos e ingresos por WhatsApp y ver todo en un
              dashboard claro.
            </p>
            <p className="text-muted-foreground text-sm">
              En los próximos pasos conectarás tu WhatsApp y podrás probar tu primer registro.
            </p>
            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
              Empecemos →
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
          <div className="space-y-6 text-center">
            <h1 className="text-2xl font-bold">Registra tu primer gasto</h1>
            <p className="text-muted-foreground text-sm">
              Envía un mensaje como este a WhatsApp:
            </p>
            <Card className="p-4 text-left space-y-2 bg-muted/50">
              <p className="text-sm font-medium">&quot;gasté 30 reales en el almuerzo&quot;</p>
              <p className="text-xs text-muted-foreground">o</p>
              <p className="text-sm font-medium">&quot;recibí 3000 de salario&quot;</p>
            </Card>
            <Button className="w-full" size="lg" onClick={finish}>
              Ir al dashboard →
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground underline"
              onClick={finish}
            >
              Omitir por ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
