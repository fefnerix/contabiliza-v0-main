import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContactConfig } from "@/hooks/useContactConfig";
import { formatWhatsappForDisplay, openWhatsAppChat } from "@/utils/whatsappContact";
import { cn } from "@/lib/utils";

const REGISTER_MESSAGE =
  "Hola Contabiliza AI, quiero registrar un gasto o ingreso.";

type WhatsAppRegisterTopbarProps = {
  className?: string;
  variant?: "mobile" | "desktop";
};

export function WhatsAppRegisterTopbar({
  className,
  variant = "mobile",
}: WhatsAppRegisterTopbarProps) {
  const { config, isLoading } = useContactConfig();
  const phone = config.whatsappBotPhone;
  const display = formatWhatsappForDisplay(phone);

  if (isLoading || !phone) return null;

  const isDesktop = variant === "desktop";

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b bg-emerald-50/90 dark:bg-emerald-950/40 px-3 py-2",
        isDesktop ? "rounded-xl border shadow-sm" : "min-h-10 rounded-lg",
        className
      )}
    >
      <MessageCircle
        className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-800/80 dark:text-emerald-300/80 leading-none">
          Registrar por WhatsApp
        </p>
        <p className="truncate text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-100">
          {display}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className="shrink-0 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5"
        onClick={() => openWhatsAppChat(phone, REGISTER_MESSAGE)}
      >
        Abrir
      </Button>
    </div>
  );
}
