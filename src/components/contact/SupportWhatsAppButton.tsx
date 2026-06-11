import { Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContactConfig } from "@/hooks/useContactConfig";
import { openWhatsAppChat } from "@/utils/whatsappContact";
import { cn } from "@/lib/utils";

const SUPPORT_MESSAGE = "Hola, necesito ayuda con mi cuenta en Contabiliza.";

type SupportWhatsAppButtonProps = {
  className?: string;
  fullWidth?: boolean;
};

export function SupportWhatsAppButton({
  className,
  fullWidth = true,
}: SupportWhatsAppButtonProps) {
  const { config, isLoading } = useContactConfig();
  const phone = config.whatsappSupportPhone;

  if (isLoading || !phone) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "gap-3 border-emerald-200/80 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/50",
        fullWidth && "w-full justify-start px-4 py-3 h-auto",
        className
      )}
      onClick={() => openWhatsAppChat(phone, SUPPORT_MESSAGE)}
    >
      <Headphones className="h-5 w-5 shrink-0" />
      <span className="text-sm font-medium">Hablar con soporte</span>
    </Button>
  );
}
