import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ContactConfig {
  /** Número do bot Contabiliza AI (registrar transações) — contact_phone */
  whatsappBotPhone: string;
  /** WhatsApp de soporte humano — contact_whatsapp */
  whatsappSupportPhone: string;
  whatsappMessage: string;
  supportEmail: string;
  /** @deprecated use whatsappBotPhone */
  contactPhone: string;
}

export const useContactConfig = () => {
  const [config, setConfig] = useState<ContactConfig>({
    whatsappBotPhone: "",
    whatsappSupportPhone: "",
    contactPhone: "",
    whatsappMessage:
      "¡Hola! Acabo de suscribirme al plan {planType} de Contabiliza! 🎉\n\nMi correo electrónico es: {email}\n\nPor favor, activa mi cuenta. ¡Gracias!",
    supportEmail: "suporte@poupeja.com",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactConfig = async () => {
      try {
        const { data, error: fetchError } = await supabase.functions.invoke(
          "get-public-settings",
          { body: { category: "contact" } }
        );

        if (fetchError) {
          console.error("Error al buscar configuraciones:", fetchError);
          setError("Error al cargar configuraciones");
          return;
        }

        if (data?.success && data?.settings) {
          const contactSettings = data.settings.contact || {};
          const botPhone = contactSettings.contact_phone?.value || "";
          const supportPhone = contactSettings.contact_whatsapp?.value || "";

          setConfig((prev) => ({
            whatsappBotPhone: botPhone,
            whatsappSupportPhone: supportPhone,
            contactPhone: botPhone,
            whatsappMessage:
              contactSettings.whatsapp_message?.value || prev.whatsappMessage,
            supportEmail:
              contactSettings.support_email?.value || prev.supportEmail,
          }));
        }
      } catch (err) {
        console.error("Error al buscar configuraciones:", err);
        setError("Error al cargar configuraciones");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactConfig();
  }, []);

  const formatMessage = (email: string, planType: string) => {
    return config.whatsappMessage
      .replace(/\{email\}/g, email)
      .replace(/\{planType\}/g, planType);
  };

  return { config, isLoading, error, formatMessage };
};
