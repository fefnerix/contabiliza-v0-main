import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { useBrandingConfig } from '@/hooks/useBrandingConfig';
import { BrandLogo } from '@/components/common/BrandLogo';
import { trackFacebookEvents } from '@/utils/facebookTracking';
import { usePreferences, Currency, Language } from '@/contexts/PreferencesContext';
import {
  ALL_ONBOARDING_COUNTRIES,
  getOnboardingCountry,
  normalizeWhatsAppDigits,
} from '@/constants/onboardingCountries';
import { clearOnboardingDone, getPostAuthPath, isActivationFormEnabled } from '@/utils/onboarding';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, PartyPopper } from 'lucide-react';

const MVP_DEFAULT_COUNTRY = 'CO';

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { companyName } = useBrandingConfig();
  const {
    setCountry,
    setTimezone,
    setLanguage,
    setCurrency,
  } = usePreferences();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [countryCode, setCountryCode] = useState(MVP_DEFAULT_COUNTRY);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);
  const [isValidatingWhatsapp, setIsValidatingWhatsapp] = useState(false);

  useEffect(() => {
    const meta = getOnboardingCountry(MVP_DEFAULT_COUNTRY);
    if (!meta) return;
    setCountry(meta.code);
    setTimezone(meta.timezone);
    setLanguage(meta.language);
    setCurrency(meta.currency);
    try {
      localStorage.setItem('currency', meta.currency);
      localStorage.setItem('userCurrency', meta.currency);
      localStorage.setItem('user_currency_symbol', meta.symbol);
    } catch {
      /* ignore */
    }
  }, [setCountry, setTimezone, setLanguage, setCurrency]);

  const waitForValidSession = async (maxRetries = 10, retryDelay = 1000): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);

      const { data: { session }, error: sessionError } = sessionResult;
      const { data: { user }, error: userError } = userResult;

      if (sessionError && attempt === maxRetries) throw sessionError;
      if (userError && attempt === maxRetries) throw userError;

      if (session?.access_token && session?.user?.id && user?.id) {
        return;
      }

      if (attempt > maxRetries - 2) {
        await supabase.auth.refreshSession();
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('No fue posible establecer una sesión válida.');
  };

  const handleWhatsappChange = (value: string) => {
    setWhatsapp(value);
    if (whatsappError) setWhatsappError(null);
  };

  const handleCountryChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    const onboarding = getOnboardingCountry(newCountryCode);
    if (onboarding) {
      setCountry(onboarding.code);
      setTimezone(onboarding.timezone);
      setLanguage(onboarding.language);
      setCurrency(onboarding.currency);
      try {
        localStorage.setItem('currency', onboarding.currency);
        localStorage.setItem('userCurrency', onboarding.currency);
        localStorage.setItem('user_currency_symbol', onboarding.symbol);
      } catch {
        /* ignore */
      }
      return;
    }
    const defaults = COUNTRY_DEFAULTS[newCountryCode] || FALLBACK_COUNTRY_DEFAULTS;
    setCountry(newCountryCode);
    setTimezone(defaults.timezone);
    setLanguage(defaults.language);
    setCurrency(defaults.currency);
  };

  const getMvpPhoneDigits = () => {
    const meta = getOnboardingCountry(countryCode) ?? getOnboardingCountry(MVP_DEFAULT_COUNTRY);
    if (!meta) return whatsapp.replace(/\D/g, '');
    return normalizeWhatsAppDigits(whatsapp, meta);
  };

  const selectedOnboardingCountry =
    getOnboardingCountry(countryCode) ?? getOnboardingCountry(MVP_DEFAULT_COUNTRY);

  const validateEmail = async (emailValue: string) => {
    if (!emailValue.trim()) {
      setEmailError(null);
      return;
    }

    setIsValidatingEmail(true);
    setEmailError(null);

    try {
      const { data: validationData, error: validationError } = await supabase.functions.invoke('validate-registration', {
        body: { email: emailValue.trim(), phone: null },
      });

      if (validationError) {
        setEmailError('Error de conexión. Intenta de nuevo.');
        return;
      }

      if (!validationData?.success) {
        const emailErrors = validationData?.errors?.filter((err: string) =>
          err.includes('email') || err.includes('Email'),
        ) || [];
        setEmailError(emailErrors[0] ?? 'Este correo ya está registrado en el sistema.');
      }
    } catch {
      setEmailError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsValidatingEmail(false);
    }
  };

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
        body: { email: null, phone: formattedPhone },
      });

      if (validationError) {
        setWhatsappError('Error de conexión. Intenta de nuevo.');
        return;
      }

      if (!validationData?.success) {
        const whatsappErrors = validationData?.errors?.filter((err: string) =>
          err.includes('WhatsApp') || err.includes('telefone') || err.includes('número'),
        ) || [];
        setWhatsappError(whatsappErrors[0] ?? 'Este WhatsApp ya está registrado en el sistema.');
      }
    } catch {
      setWhatsappError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsValidatingWhatsapp(false);
    }
  };

  const handleEmailBlur = () => {
    if (email.trim()) validateEmail(email);
  };

  const handleWhatsappBlur = () => {
    if (whatsapp.trim()) validateWhatsapp(getMvpPhoneDigits());
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formElement = document.getElementById('register-form');
    formElement?.classList.add('form-loading');

    if (emailError || whatsappError) {
      setError('Por favor corrige los errores en los campos antes de continuar.');
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
      return;
    }

    const countryMeta =
      getOnboardingCountry(countryCode) ?? getOnboardingCountry(MVP_DEFAULT_COUNTRY);
    if (!countryMeta) {
      setError('Selecciona un país válido.');
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
      return;
    }

    const phoneDigits = normalizeWhatsAppDigits(whatsapp, countryMeta);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
            phone: phoneDigits,
            whatsapp: phoneDigits,
            country: countryMeta.code,
            currency: countryMeta.currency,
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message ?? '';
        if (msg.includes('already registered') || msg.includes('User already registered')) {
          setError('Este correo ya está registrado. Inicia sesión en /login o recupera tu contraseña.');
        } else {
          setError(msg || 'No fue posible crear la cuenta.');
        }
        return;
      }

      if (!signUpData.user) {
        throw new Error('Usuario no retornado después del registro.');
      }

      await waitForValidSession().catch(async () => {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (loginError) throw loginError;
      });

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('poupeja_users').upsert({
          id: user.id,
          email: user.email!,
          name: fullName,
          phone: phoneDigits,
          country: countryMeta.code,
          currency: countryMeta.currency,
          currency_symbol: countryMeta.symbol,
        });
      }

      setCountry(countryMeta.code);
      setTimezone(countryMeta.timezone);
      setLanguage(countryMeta.language);
      setCurrency(countryMeta.currency);
      try {
        localStorage.setItem('currency', countryMeta.currency);
        localStorage.setItem('userCurrency', countryMeta.currency);
        localStorage.setItem('user_currency_symbol', countryMeta.symbol);
        localStorage.setItem('user_country', countryMeta.code);
      } catch {
        /* ignore */
      }

      clearOnboardingDone();
      trackFacebookEvents.completeRegistration('email');
      toast({
        title: '¡Cuenta creada!',
        description: isActivationFormEnabled()
          ? 'Completa la activación en los próximos pasos.'
          : 'Ya puedes usar Contabiliza.',
      });
      navigate(getPostAuthPath(), { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setIsLoading(false);
      formElement?.classList.remove('form-loading');
    }
  };

  const LoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Activando tu acceso gratuito...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex flex-col items-center justify-center p-4">
      {isLoading && <LoadingOverlay />}

      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <BrandLogo size="xl" />
          </div>
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <PartyPopper className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground leading-tight">
            ¡Felicidades! Ganaste acceso gratis a {companyName || 'Contabiliza'}
          </h1>
          <p className="text-muted-foreground text-center mt-3 text-sm sm:text-base">
            Completa tus datos para activar tu cuenta y empezar a registrar tus finanzas por WhatsApp.
          </p>
        </div>

        {error && <p className="text-sm text-center text-red-600 mb-4">{error}</p>}

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
            <Label htmlFor="country">País</Label>
            <Select value={countryCode} onValueChange={handleCountryChange} required>
              <SelectTrigger id="country" className="mt-1">
                <SelectValue placeholder="Selecciona tu país" />
              </SelectTrigger>
              <SelectContent>
                {ALL_ONBOARDING_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="text-muted-foreground text-xs">({c.phoneCode})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Teléfono / WhatsApp</Label>
            <div className="mt-1 flex rounded-md border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring">
              <span className="inline-flex items-center gap-1.5 border-r border-input bg-muted/50 px-3 text-sm text-muted-foreground shrink-0">
                <span aria-hidden>{selectedOnboardingCountry?.flag}</span>
                <span className="font-medium tabular-nums">
                  {selectedOnboardingCountry?.phoneCode ?? '+57'}
                </span>
              </span>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="300 1234567"
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                onBlur={handleWhatsappBlur}
                className="border-0 shadow-none focus-visible:ring-0 rounded-l-none"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Usaremos este número para activar tu asistente por WhatsApp.
            </p>
            {isValidatingWhatsapp && (
              <p className="text-sm text-blue-600 mt-1">Validando teléfono...</p>
            )}
            {whatsappError && <p className="text-sm text-red-600 mt-1">{whatsappError}</p>}
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
                if (emailError) setEmailError(null);
              }}
              onBlur={handleEmailBlur}
              className={`mt-1 ${emailError ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            {isValidatingEmail && (
              <p className="text-sm text-blue-600 mt-1">Validando email...</p>
            )}
            {emailError && <p className="text-sm text-red-600 mt-1">{emailError}</p>}
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Procesando...' : 'Activar mi acceso gratuito'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
