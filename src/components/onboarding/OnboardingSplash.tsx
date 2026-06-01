import { Link } from "react-router-dom";
import { MessageCircle, BarChart3, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBrandingConfig } from "@/hooks/useBrandingConfig";

const bullets = [
  { icon: MessageCircle, text: "Manda un mensaje, nosotros lo anotamos" },
  { icon: BarChart3, text: "Dashboard en tiempo real" },
  { icon: Bell, text: "Resumen diario automático" },
];

export function OnboardingSplash() {
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();
  const displayName = companyName || "Contabiliza";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center text-center">
        <img
          src={logoUrl || "/pwa-icons/icon-192x192.png"}
          alt={logoAltText || displayName}
          className="h-16 w-16 rounded-2xl object-contain mb-6"
        />
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Tus finanzas en WhatsApp
        </h1>
        <p className="text-muted-foreground mb-8">
          Registra gastos, ingresos y consulta tu saldo solo mandando un mensaje
        </p>

        <ul className="w-full space-y-4 mb-10 text-left">
          {bullets.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{text}</span>
            </li>
          ))}
        </ul>

        <Button asChild className="w-full mb-3" size="lg">
          <Link to="/register">Crear cuenta gratis</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link to="/login">Ya tengo cuenta</Link>
        </Button>
      </div>
    </div>
  );
}
