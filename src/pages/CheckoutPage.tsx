
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { usePlanConfig } from '@/hooks/usePlanConfig';
import { trackFacebookEvents } from '@/utils/facebookTracking';

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { config, isLoading: configLoading } = usePlanConfig();

  const plan = searchParams.get('plan');
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    if (success === 'true') {
      toast({
        title: "¡Pago realizado con éxito!",
        description: "Tu suscripción fue activada. ¡Bienvenido a Contabiliza!",
      });
      navigate('/dashboard');
    } else if (canceled === 'true') {
      toast({
        title: "Pago cancelado",
        description: "Puedes intentarlo nuevamente cuando quieras.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [success, canceled, navigate, toast]);
  
  const handleCheckout = async (priceId: string, planType: string) => {
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error de autenticación",
          description: "Necesitas iniciar sesión para realizar una suscripción.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      // Rastrear evento de início de checkout no Facebook Pixel
      const planName = planType === 'monthly' ? 'Plano Mensal' : 'Plano Anual';
      const planPrice = planType === 'monthly' ? 2 : 20; // Valores em USD
      trackFacebookEvents.initiateCheckout(planName, planPrice, 'USD');
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planType,
          priceId, // Passando o priceId diretamente também
          successUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(user.email || '')}`,
          cancelUrl: `${window.location.origin}/checkout?canceled=true`
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        toast({
          title: "Error en el checkout",
          description: `Error: ${error.message}. Verifica si tus claves de Stripe están configuradas.`,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        // Redirecionar na mesma aba em vez de abrir uma nova
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout no retornada');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error en el checkout",
        description: "Algo salió mal. Verifica tu configuración de Stripe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (configLoading || !config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const plans = [
    {
      name: "Mensual",
      price: config.prices.monthly.displayPrice,
      period: "/mes",
      priceId: config.prices.monthly.priceId,
      planType: "monthly",
      description: "Para uso personal completo",
      features: ["Movimientos ilimitados", "Panel completo", "Todos los informes", "Metas ilimitadas", "Programaciones", "Soporte prioritario"],
    },
    {
      name: "Anual",
      price: config.prices.annual.displayPrice,
      period: "/año",
      priceId: config.prices.annual.priceId,
      planType: "annual",
      originalPrice: config.prices.annual.displayOriginalPrice,
      savings: config.prices.annual.displaySavings,
      description: "Mejor costo-beneficio",
      features: ["Movimientos ilimitados", "Panel completo", "Todos los informes", "Metas ilimitadas", "Programaciones", "Soporte VIP", "Copia de seguridad automática", "Análisis avanzados"],
      popular: true
    }
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Elige tu plan</h1>
          <p className="text-muted-foreground">Selecciona el plan que mejor se adapta a tus necesidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((planItem) => (
            <Card key={planItem.name} className={`relative ${planItem.popular ? 'border-primary shadow-xl' : ''}`}>
              {planItem.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{planItem.name}</CardTitle>
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold">{planItem.price}</span>
                    <span className="text-muted-foreground">{planItem.period}</span>
                  </div>
                  {planItem.originalPrice && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground line-through">{planItem.originalPrice}</span>
                      <span className="ml-2 text-sm font-medium text-green-600">{planItem.savings}</span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">{planItem.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {planItem.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleCheckout(planItem.priceId, planItem.planType)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Suscribirse Ahora'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate('/')}> 
            Volver
          </Button>
        </div>

        {/* Debug info - remover em produção */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Plan: {plan}</p>
            <p>Success: {success}</p>
            <p>Canceled: {canceled}</p>
            <p>URL: {window.location.href}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
