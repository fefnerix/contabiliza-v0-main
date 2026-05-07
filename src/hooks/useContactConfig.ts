
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContactConfig {
  contactPhone: string;
  whatsappMessage: string;
  supportEmail: string;
}

export const useContactConfig = () => {
  const [config, setConfig] = useState<ContactConfig>({
    contactPhone: '', // será carregado do banco
    whatsappMessage: '¡Hola! Acabo de suscribirme al plan {planType} de Contabiliza! 🎉\n\nMi correo electrónico es: {email}\n\nPor favor, activa mi cuenta. ¡Gracias!',
    supportEmail: 'suporte@poupeja.com'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-public-settings', {
          body: { category: 'contact' }
        });
        
        if (error) {
          console.error('Error al buscar configuraciones:', error);
          setError('Error al cargar configuraciones');
          return;
        }
        
        if (data?.success && data?.settings) {
          // Extraer configuraciones de contacto
          const contactSettings = data.settings.contact || {};
          
          // Usar configuraciones cargadas de la base de datos
          console.log('Configuraciones cargadas:', contactSettings);
          setConfig(prev => ({
            contactPhone: contactSettings.contact_phone?.value || '',
            whatsappMessage: contactSettings.whatsapp_message?.value || prev.whatsappMessage,
            supportEmail: contactSettings.support_email?.value || prev.supportEmail
          }));
        }
      } catch (err) {
        console.error('Error al buscar configuraciones:', err);
                  setError('Error al cargar configuraciones');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactConfig();
  }, []);

  // Função para formatar mensagem com placeholders dinâmicos
  const formatMessage = (email: string, planType: string) => {
    return config.whatsappMessage
      .replace(/\{email\}/g, email)
      .replace(/\{planType\}/g, planType);
  };

  return { config, isLoading, error, formatMessage };
};
