
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';

const ManageSubscriptionButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { hasActiveSubscription } = useSubscription();

  // Só mostra o botão se houver assinatura ativa
  if (!hasActiveSubscription) {
    return null;
  }

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Error creating customer portal session:', error);
        
        // Mensagem de erro mais específica baseada no tipo de erro
        let errorMessage = "No fue posible abrir el portal de gestión.";
        
        if (error.message?.includes("No active subscription")) {
          errorMessage = "Suscripción no encontrada. Verifica si tu suscripción está activa.";
        } else if (error.message?.includes("Payment system not configured")) {
          errorMessage = "Sistema de pagos temporalmente indisponible. Contacta al soporte.";
        } else if (error.message?.includes("Database error")) {
          errorMessage = "Error de conexión. Intenta nuevamente en unos instantes.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Éxito",
          description: "Portal de gestión abierto en una nueva pestaña.",
        });
      }
    } catch (error) {
      console.error('Customer portal error:', error);
      toast({
        title: "Error",
        description: "Error inesperado. Intenta nuevamente o contacta al soporte.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleManageSubscription}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando...
        </>
      ) : (
        <>
          <Settings className="mr-2 h-4 w-4" />
          Gestionar Suscripción
        </>
      )}
    </Button>
  );
};

export default ManageSubscriptionButton;
