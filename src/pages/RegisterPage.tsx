import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { getPlanTypeFromPriceId } from '@/utils/subscriptionUtils';
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { toE164WhatsApp } from '@/utils/phone';
import CountryPhoneInput from '@/components/common/CountryPhoneInput';
import { trackFacebookEvents } from '@/utils/facebookTracking';
import { usePreferences, Currency, Language } from '@/contexts/PreferencesContext';
import { COUNTRIES, getCountryTimezone } from '@/data/countries';

const COUNTRY_DEFAULTS: Record<string, { timezone: string; language: Language; currency: Currency }> = {
  BR: { timezone: 'America/Sao_Paulo', language: 'pt', currency: 'BRL' },
  MX: { timezone: 'America/Mexico_City', language: 'es', currency: 'MXN' },
  CO: { timezone: 'America/Bogota', language: 'es', currency: 'COP' },
  AR: { timezone: 'America/Argentina/Buenos_Aires', language: 'es', currency: 'ARS' },
  CL: { timezone: 'America/Santiago', language: 'es', currency: 'CLP' },
  PE: { timezone: 'America/Lima', language: 'es', currency: 'PEN' },
  US: { timezone: 'America/New_York', language: 'en', currency: 'USD' },
};

const FALLBACK_COUNTRY_DEFAULTS: { timezone: string; language: Language; currency: Currency } = {
  timezone: 'UTC',
  language: 'es',
  currency: 'USD',
};

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { companyName, logoUrl, logoAltText } = useBrandingConfig();
  const {
    setCountry,
    setTimezone,
    setLanguage,
    setCurrency,
  } = usePreferences();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [countryCode, setCountryCode] = useState('BR');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para validação
  const [emailError, setEmailError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [isValidatingWhatsapp, setIsValidatingWhatsapp] = useState(false);

  const priceId = searchParams.get('priceId');

  // Função para aguardar uma sessão válida ser estabelecida
  const waitForValidSession = async (maxRetries = 20, retryDelay = 1500): Promise<any> => {
    console.log(`[waitForValidSession] Iniciando com ${maxRetries} tentativas a cada ${retryDelay}ms`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[waitForValidSession] Tentativa ${attempt}/${maxRetries} - Verificando sessão...`);
      
      try {
        // Verificação dupla: getSession E getUser
        const [sessionResult, userResult] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser()
        ]);
        
        const { data: { session }, error: sessionError } = sessionResult;
        const { data: { user }, error: userError } = userResult;
        
        if (sessionError) {
          console.error(`[waitForValidSession] Erro de sessão na tentativa ${attempt}:`, sessionError);
          if (attempt === maxRetries) throw sessionError;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        if (userError) {
          console.error(`[waitForValidSession] Erro de usuário na tentativa ${attempt}:`, userError);
          if (attempt === maxRetries) throw userError;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // Verificar se temos sessão E usuário válidos
        if (session?.access_token && session?.user?.id && user?.id) {
          console.log(`[waitForValidSession] ✅ Sessão e usuário válidos encontrados na tentativa ${attempt}:`, {
            sessionUserId: session.user.id,
            userDataId: user.id,
            email: session.user.email,
            tokenLength: session.access_token.length,
            userConfirmed: user.email_confirmed_at ? 'Sim' : 'Não'
          });
          return session;
        }
        
        console.log(`[waitForValidSession] ⏳ Tentativa ${attempt}: Aguardando sessão e usuário serem estabelecidos`, {
          hasSession: !!session,
          hasToken: !!session?.access_token,
          hasSessionUser: !!session?.user?.id,
          hasUser: !!user?.id
        });
        
        // Tentar refresh da sessão nas últimas tentativas
        if (attempt > maxRetries - 3) {
          console.log(`[waitForValidSession] 🔄 Tentativa ${attempt}: Fazendo refresh da sessão`);
          await supabase.auth.refreshSession();
        }
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.error(`[waitForValidSession] Erro inesperado na tentativa ${attempt}:`, error);
        if (attempt === maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw new Error('Timeout: No fue posible establecer una sesión válida después de 30 segundos');
  };

  // Função para lidar com a mudança no campo de WhatsApp
  const handleWhatsappChange = (value: string) => {
    setWhatsapp(value);
    // Limpar erro quando usuário começar a digitar
    if (whatsappError) {
      setWhatsappError(null);
    }
  };

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    const defaults = COUNTRY_DEFAULTS[newCountryCode] || FALLBACK_COUNTRY_DEFAULTS;
    setCountry(newCountryCode);
    setTimezone(defaults.timezone);
    setLanguage(defaults.language);
    setCurrency(defaults.currency);
  };

  // Função para validar email em tempo real
  const validateEmail = async (emailValue: string) => {
    if (!emailValue.trim()) {
      setEmailError(null);
      return;
    }

    setIsValidatingEmail(true);
    setEmailError(null);

    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-registration', {
        body: {
          email: emailValue.trim(),
          phone: null // Só validar email
        }
      });

      if (validationError) {
        console.error('Erro na validação de email:', validationError);
        setEmailError('Erro de conexão. Tente novamente.');
        return;
      }

      if (!validationData?.success) {
        const emailErrors = validationData?.errors?.filter((error: string) => 
          error.includes('email') || error.includes('Email')
        ) || [];
        
        if (emailErrors.length > 0) {
          setEmailError(emailErrors[0]);
        } else {
          setEmailError('Este e-mail já possui cadastro no sistema.');
        }
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error('Erro na validação de email:', error);
      setEmailError('Erro de conexão. Tente novamente.');
    } finally {
      setIsValidatingEmail(false);
    }
  };

  // Função para validar WhatsApp em tempo real
  const validateWhatsapp = async (whatsappValue: string) => {
    const formattedPhone = whatsappValue.replace(/\D/g, '');
    
    if (!formattedPhone) {
      setWhatsappError(null);
      return;
    }

    setIsValidatingWhatsapp(true);
    setWhatsappError(null);

    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-registration', {
        body: {
          email: null, // Só validar WhatsApp
          phone: formattedPhone
        }
      });

      if (validationError) {
        console.error('Erro na validação de WhatsApp:', validationError);
        setWhatsappError('Erro de conexão. Tente novamente.');
        return;
      }

      if (!validationData?.success) {
        const whatsappErrors = validationData?.errors?.filter((error: string) => 
          error.includes('WhatsApp') || error.includes('telefone') || error.includes('número')
        ) || [];
        
        if (whatsappErrors.length > 0) {
          setWhatsappError(whatsappErrors[0]);
        } else {
          setWhatsappError('Este WhatsApp já possui cadastro no sistema.');
        }
      } else {
        setWhatsappError(null);
      }
    } catch (error) {
      console.error('Erro na validação de WhatsApp:', error);
      setWhatsappError('Erro de conexão. Tente novamente.');
    } finally {
      setIsValidatingWhatsapp(false);
    }
  };

  // Handlers para onBlur
  const handleEmailBlur = () => {
    if (email.trim()) {
      validateEmail(email);
    }
  };

  const handleWhatsappBlur = () => {
    if (whatsapp.trim()) {
      validateWhatsapp(whatsapp);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Verificar se há erros de validação em tempo real
    if (emailError || whatsappError) {
      setError('Por favor, corrija os erros nos campos antes de continuar.');
      setIsLoading(false);
      return;
    }
    
    // Adicionar classe de loading ao formulário
    const formElement = document.getElementById('register-form');
    if (formElement) {
      formElement.classList.add('form-loading');
    }
  
    if (!priceId) {
      setError("Price ID no encontrado en la URL. Por favor, selecciona un plan.");
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
      navigate('/plans');
      return;
    }
  
    try {
      // Normaliza o número de telefone para E.164
      const formattedPhone = whatsapp ? toE164WhatsApp(whatsapp) : '';
  
      console.log('Iniciando processo de registro...');

      // Sugere preferências padrão com base no país escolhido no cadastro.
      const countryInfo = COUNTRIES[countryCode];
      const defaults = COUNTRY_DEFAULTS[countryCode] || FALLBACK_COUNTRY_DEFAULTS;
      const suggestedLanguage = defaults.language || (countryInfo?.language as Language) || FALLBACK_COUNTRY_DEFAULTS.language;
      const suggestedCurrency = defaults.currency || (countryInfo?.currency as Currency) || FALLBACK_COUNTRY_DEFAULTS.currency;
      const suggestedTimezone = defaults.timezone || getCountryTimezone(countryCode) || FALLBACK_COUNTRY_DEFAULTS.timezone;
      setCountry(countryCode);
      setTimezone(suggestedTimezone);
      setLanguage(suggestedLanguage);
      setCurrency(suggestedCurrency);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            full_name: fullName,
            phone: formattedPhone,
            country: countryCode,
            timezone: suggestedTimezone,
            language: suggestedLanguage,
            currency: suggestedCurrency,
          },
        },
      });
  
      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Usuario no retornado después del registro.');
      }

      console.log('Usuário criado com sucesso');
      
      // Rastrear evento de registro no Facebook Pixel
      trackFacebookEvents.completeRegistration('email');
      
      // Mostrar feedback de progresso
      toast({
        title: "¡Cuenta creada con éxito!",
        description: "Esperando establecer sesión...",
      });

      // Aguardar que a sessão seja estabelecida
      console.log('🚀 Aguardando estabelecer sessão após registro...');
      let validSession;
      try {
        validSession = await waitForValidSession(20, 1500);
        console.log('✅ Sessão estabelecida com sucesso!');
      } catch (sessionError) {
        console.error('❌ Erro ao aguardar sessão:', sessionError);
        
        // FALLBACK: Tentar login automático
        console.log('🔄 Tentando fallback com login automático...');
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (loginError) throw loginError;
          
          if (loginData.session) {
            console.log('✅ Login automático bem-sucedido!');
            validSession = loginData.session;
            
            toast({
              title: "¡Cuenta creada e inicio de sesión realizado!",
              description: "Procediendo al checkout...",
            });
          } else {
            throw new Error('Inicio de sesión automático falló');
          }
        } catch (loginError) {
          console.error('❌ Fallback de login também falhou:', loginError);
          
          // Último recurso: redirecionar para login manual
          toast({
            title: "¡Cuenta creada con éxito!",
            description: "Redirigiendo para iniciar sesión...",
          });
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                email, 
                message: "¡Tu cuenta fue creada! Inicia sesión para continuar con el pago." 
              } 
            });
          }, 2000);
          return;
        }
      }

      // Verificar se temos uma sessão válida
      if (!validSession?.access_token || !validSession?.user?.id) {
        throw new Error('Sesión inválida después del registro. Intenta iniciar sesión manualmente.');
      }

      console.log('Sessão estabelecida com sucesso, preparando checkout...');
      
      // Converter priceId para planType
      const planType = await getPlanTypeFromPriceId(priceId);
      
      if (!planType) {
        throw new Error("Tipo de plan inválido. Verifica la configuración.");
      }
      
      // Atualizar feedback de progresso
      toast({
        title: "¡Sesión establecida!",
        description: "Preparando checkout...",
      });
      
      // Chamar a Supabase Function para criar a sessão de checkout do Stripe
      console.log('Chamando create-checkout-session com sessão válida...');
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planType,
          successUrl: `${window.location.origin}/payment-success?email=${encodeURIComponent(validSession.user.email || '')}`,
          cancelUrl: `${window.location.origin}/register?canceled=true`
        },
        headers: {
          Authorization: `Bearer ${validSession.access_token}`,
        }
      });
      
      if (functionError) {
        console.error('Erro na função de checkout:', functionError);
        throw new Error(`Error en el checkout: ${functionError.message}`);
      }

      console.log('Dados retornados pela função create-checkout-session:', functionData);

      if (functionData && functionData.url) {
        console.log('Redirecionando para:', functionData.url);
        
        // Garantir que o overlay de carregamento permaneça visível
        document.body.classList.add('overflow-hidden');
        
        // Adicionar um pequeno atraso antes do redirecionamento para garantir que o overlay seja exibido
        setTimeout(() => {
          window.location.href = functionData.url;
        }, 500);
        
        return;
      } else {
        throw new Error('No fue posible obtener la URL de checkout.');
      }
    } catch (err: any) {
      console.error('Erro no processo de registro ou checkout:', err);
      setError(err.message || 'Ocurrió un error desconocido.');
      setIsLoading(false);
      
      // Remover classe de loading em caso de erro
      const formElement = document.getElementById('register-form');
      if (formElement) {
        formElement.classList.remove('form-loading');
      }
    }
  };

  // Adicione este componente dentro do RegisterPage, antes do return
  const LoadingOverlay = () => {
    if (!isLoading) return null;
    
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium">
            {isLoading && error ? 'Procesando...' : 'Creando cuenta y preparando checkout...'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-4">
      {/* Renderizar o LoadingOverlay fora do container do formulário */}
      {isLoading && <LoadingOverlay />}
      
      {/* Container do formulário com largura máxima e sombra */}
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl relative">
        {/* Logo e Título Centralizados */}
        <div className="flex flex-col items-center mb-8">
          {/* Logo */}
          <div className="flex items-center space-x-2 mb-4">
            <img 
              src={logoUrl} 
              alt={logoAltText}
              className="h-12 w-auto"
            />
            <span className="text-2xl font-bold text-primary">{companyName}</span>
          </div>
          <h1 className="text-3xl font-bold text-center text-foreground">Crear Cuenta</h1>
          <p className="text-muted-foreground text-center mt-2">
            Completa los campos a continuación para crear tu cuenta.
          </p>
        </div>

        {error && (
          <p className="text-sm text-center text-red-600 mb-4">{error}</p>
        )}

        <form id="register-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="fullName">Nombre Completo</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              placeholder="Escribe tu nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tuemail@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Limpar erro quando usuário começar a digitar
                if (emailError) {
                  setEmailError(null);
                }
              }}
              onBlur={handleEmailBlur}
              className={`mt-1 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {isValidatingEmail && (
              <p className="text-sm text-blue-600 mt-1">Validando email...</p>
            )}
            {emailError && (
              <p className="text-sm text-red-600 mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <CountryPhoneInput
              value={whatsapp}
              onChange={handleWhatsappChange}
              onCountryChange={handleCountryChange}
              placeholder="(DDD) número — ej.: 11 1234-5678"
              required
              error={whatsappError || error}
            />
            <p className="mt-2 text-xs text-gray-500">
              Este número será utilizado para enviar mensagens e notificações importantes via WhatsApp.
            </p>
            {isValidatingWhatsapp && (
              <p className="text-sm text-blue-600 mt-1">Validando WhatsApp...</p>
            )}
            {whatsappError && (
              <p className="text-sm text-red-600 mt-1">{whatsappError}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Registra tu contraseña de acceso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta e Ir a Pago'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
