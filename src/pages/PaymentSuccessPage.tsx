import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, Eye, EyeOff, ArrowRight, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useContactConfig } from '@/hooks/useContactConfig';
import { useAutoLogin } from '@/hooks/useAutoLogin';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useMetaPixel } from '@/hooks/useMetaPixel';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = usePreferences();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const [userPlanType, setUserPlanType] = useState<string>('premium');
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  
  const { config: contactConfig, isLoading: configLoading, formatMessage } = useContactConfig();
  const { performAutoLogin, isLoggingIn } = useAutoLogin();
  const { checkSubscription } = useSubscription();
  const { trackPurchase } = useMetaPixel();
  
  const sessionId = searchParams.get('session_id');
  const email = searchParams.get('email') || 'user@example.com';
  
  

  const checkSystemStatus = async () => {
    try {
      // Verificar se as funções estão respondendo
      const { error: syncError } = await supabase.functions.invoke('sync-subscriptions', {
        body: { test: true }
      });
      
      if (syncError && !syncError.message.includes('test')) {
        throw new Error('Função de sincronização não está respondendo');
      }
      
      setSystemStatus('ready');
      return true;
    } catch (error) {
      console.error('Erro ao verificar sistema:', error);
      setSystemStatus('error');
      return false;
    }
  };

  const checkUserCreation = async (attempt = 1) => {
    if (!email || email === 'user@example.com') {
      setIsCheckingUser(false);
      return;
    }
  
    try {
      // Chamar a função Edge com email no body
      const { data, error } = await supabase.functions.invoke('check-subscription-status', {
        body: { email: email }
      });
      
      if (error) {
        console.error('Erro ao verificar usuário:', error);
        throw new Error(error.message);
      }
      
      if (data.exists && data.hasActiveSubscription) {
        console.log('Usuário e assinatura encontrados!', data);
        setUserExists(true);
        
        // Capturar tipo de plano da assinatura
        if (data.subscription?.plan_type) {
          setUserPlanType(data.subscription.plan_type);
        }
        
        setIsCheckingUser(false);
        return;
      }
      
      // Se não encontrou o usuário ou assinatura e ainda temos tentativas
      if (attempt < 5) {
        const delay = Math.min(2000 * attempt, 8000); // Max 8 segundos
        setTimeout(() => {
          setCheckAttempts(attempt);
          checkUserCreation(attempt + 1);
        }, delay);
      } else {
        setIsCheckingUser(false);
        console.log('Usuário não foi encontrado após 5 tentativas');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      if (attempt < 5) {
        setTimeout(() => checkUserCreation(attempt + 1), 5000);
      } else {
        setIsCheckingUser(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      // Primeiro verificar se o sistema está funcionando
      const systemOk = await checkSystemStatus();
      
      if (systemOk) {
        // Sincronização mais rápida - sem delays desnecessários
        try {
          const { data, error } = await supabase.functions.invoke('sync-subscriptions', {
            body: { 
              email: email
            }
          });
          
          if (error) {
            console.error("Erro ao sincronizar assinatura específica:", error);
          } else {
            console.log("Assinatura sincronizada com sucesso:", data);
            // Atualizar contexto imediatamente após sincronização
            await checkSubscription();
          }
        } catch (error) {
          console.error("Erro ao sincronizar assinatura:", error);
        }
        
        // Verificação imediata sem delay
        checkUserCreation();
      } else {
        setIsCheckingUser(false);
      }
    };

    init();
  }, [email, sessionId]);

  // Meta Pixel - Track Purchase Event
  useEffect(() => {
    if (sessionId || email) {
      // Aguardar um pouco para que o userPlanType seja detectado
      const timer = setTimeout(() => {
        // Usar o userPlanType detectado ou fallback para anual
        const planType = userPlanType || 'annual';
        
        // Determinar valor baseado no tipo de plano
        let purchaseValue = 20; // Padrão para plano anual
        
        if (planType === 'monthly') {
          purchaseValue = 2; // Plano mensal
        } else if (planType === 'annual') {
          purchaseValue = 20; // Plano anual
        }
        
        // Track purchase event with correct value and plan type
        trackPurchase(purchaseValue, 'USD', planType);
        console.log(`Meta Pixel: Tracking purchase of $${purchaseValue} for plan type: ${planType}`);
        console.log(`Meta Pixel: Session ID: ${sessionId}, Email: ${email}`);
      }, 2000); // Aguardar 2 segundos para detectar o tipo de plano
      
      return () => clearTimeout(timer);
    }
  }, [sessionId, email, trackPurchase, userPlanType]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "¡Copiado!",
      description: `${label} copiado al portapapeles.`,
    });
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleSyncSubscriptions = async () => {
    try {
      setIsCheckingUser(true);
      
      const { data, error } = await supabase.functions.invoke('sync-subscriptions');
      
      if (error) {
        toast({
          title: "Erro na sincronização",
          description: "Não foi possível sincronizar as assinaturas. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sincronização concluída",
        description: `${data.createdUsersCount || 0} usuários criados, ${data.syncedCount || 0} assinaturas sincronizadas.`,
      });

      // Verificar novamente se o usuário foi criado e atualizar contexto
      await checkSubscription();
      checkUserCreation();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setIsCheckingUser(false);
    }
  };

  const renderSystemStatus = () => {
    if (systemStatus === 'error') {
      return (
        <div className="bg-destructive/10 border border-destructive/25 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h4 className="font-medium">Sistema Temporalmente Indisponible</h4>
          </div>
          <p className="text-sm text-destructive/90 mb-3">
            El sistema de creación automática de usuarios está con problemas. 
            Tu pago fue procesado con éxito, pero la cuenta puede necesitar ser creada manualmente.
          </p>
          <Button 
            onClick={() => window.open(`https://wa.me/${contactConfig.contactPhone}?text=Necesito%20ayuda%20con%20mi%20cuenta%20después%20del%20pago`, '_blank')}
            className="w-full"
            variant="outline"
          >
            Contactar Soporte
          </Button>
        </div>
      );
    }
    return null;
  };

  const handleWhatsAppActivation = () => {
    if (configLoading) {
      toast({
        title: t('errors.loadingSettings'),
        description: t('errors.waitMoment'),
      });
      return;
    }

    const userEmail = email !== 'user@example.com' ? email : '';
    
    // Usar tipo de plano da assinatura se disponível, senão usar fallback
    const planType = userPlanType || searchParams.get('plan_type') || 'premium';
    
    const message = encodeURIComponent(formatMessage(userEmail, planType));
    
    window.open(`https://wa.me/${contactConfig.contactPhone}?text=${message}`, '_blank');
  };

  const handleAccessApp = () => {
    if (email && email !== 'user@example.com') {
      performAutoLogin(email);
    } else {
      navigate('/login');
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/[0.06] via-background to-primary/[0.06] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <CardTitle className="text-2xl text-primary mb-2">
              ¡Pago Confirmado!
            </CardTitle>
            <p className="text-muted-foreground">
              Tu suscripción fue activada con éxito.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h4 className="font-medium text-foreground mb-2">Próximos pasos:</h4>
              <p className="text-sm text-muted-foreground">
                Ahora puedes activar tu número en WhatsApp o acceder directamente a tu área de usuario.
              </p>
            </div>

            {/* Status da verificação */}
            {isCheckingUser && (
              <div className="bg-muted/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 text-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">
                    Verificando activación de la cuenta... (Intento {checkAttempts + 1})
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Espera mientras sincronizamos tu pago.
                </p>
              </div>
            )}

            {/* Resultado da verificação */}
            {!isCheckingUser && userExists && (
              <div className="bg-primary/10 border border-primary/25 rounded-lg p-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">¡Cuenta activada con éxito!</span>
                </div>
                <p className="text-sm text-primary/90 mt-1">
                  Tu cuenta fue creada y tu suscripción está activa.
                </p>
              </div>
            )}

            {!isCheckingUser && !userExists && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Activación en proceso</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu pago fue procesado, pero la cuenta aún se está creando. Usa WhatsApp para una activación rápida.
                </p>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button 
                onClick={handleWhatsAppActivation}
                className="w-full"
                size="lg"
                disabled={configLoading}
              >
                {configLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 w-4 h-4" />
                    Activar Mi Número vía WhatsApp
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleAccessApp}
                variant="secondary"
                className="w-full"
                size="lg"
                disabled={isLoggingIn || (!userExists && !isCheckingUser)}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 w-4 h-4" />
                    {userExists ? 'Acceder a la App' : 'Esperar Activación'}
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleSyncSubscriptions}
                className="w-full"
                disabled={isCheckingUser}
              >
                <Loader2 className={`mr-2 w-4 h-4 ${isCheckingUser ? 'animate-spin' : ''}`} />
                Intentar Sincronizar Nuevamente
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleGoToHome}
                className="w-full"
              >
                Volver al Inicio
              </Button>
            </div>

            {/* Informações Adicionais */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p className="mt-1">
                ¿Necesitas ayuda? Ponte en contacto con nuestro soporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Meta Pixel Noscript */}
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1257963102739142&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </div>
  );
};

export default PaymentSuccessPage;
