import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { isActivationFormEnabled, isActivationFormSubmittedInDb } from "@/utils/onboarding";

/** Aviso no dashboard quando o usuário entrou com assinatura mas ainda não enviou o formulário. */
export function ActivationFormReminder() {
  const { user } = useAppContext();
  const [needsForm, setNeedsForm] = useState(false);
  const formEnabled = isActivationFormEnabled();

  useEffect(() => {
    if (!formEnabled || !user?.id) {
      setNeedsForm(false);
      return;
    }
    void isActivationFormSubmittedInDb(user.id).then((submitted) => {
      setNeedsForm(!submitted);
    });
  }, [user?.id, formEnabled]);

  if (!formEnabled || !needsForm) return null;

  return (
    <div className="mb-4 flex gap-3 rounded-lg border border-amber-500/40 bg-amber-50/90 px-4 py-3 text-sm dark:bg-amber-950/30">
      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Completa tu formulario de activación
        </p>
        <p className="text-amber-800/90 dark:text-amber-200/80">
          Tu acceso ya está activo. Para el diagnóstico personalizado de 12 meses, envía el
          formulario cuando puedas.
        </p>
        <Link
          to="/onboarding"
          className="inline-block font-semibold text-primary underline-offset-2 hover:underline"
        >
          Ir al formulario
        </Link>
      </div>
    </div>
  );
}
