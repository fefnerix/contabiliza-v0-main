import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import translations from '@/translations';

// Idiomas disponíveis
export type Language = 'pt' | 'en' | 'es';

// Mesmas moedas exibidas no seletor
export type Currency =
  | 'USD' | 'BRL' | 'MXN' | 'ARS' | 'CLP' | 'COP' | 'PEN' | 'UYU' | 'PYG'
  | 'BOB' | 'CRC' | 'GTQ' | 'DOP' | 'PAB' | 'NIO' | 'HNL' | 'SVC'
  | 'EUR' | 'GBP' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN';

interface PreferencesContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, fallback?: string) => string;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const PreferencesContext = createContext<PreferencesContextProps>({
  language: 'es',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
  currency: 'USD',
  setCurrency: () => {},
});

interface PreferencesProviderProps {
  children: React.ReactNode;
}

// Helpers de inicialização (evitam erro no SSR)
const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'es';
  const saved = localStorage.getItem('language') as Language | null;
  return saved === 'pt' || saved === 'en' || saved === 'es' ? saved : 'es';
};

const getInitialCurrency = (): Currency => {
  if (typeof window === 'undefined') return 'USD';
  const saved = localStorage.getItem('currency') as Currency | null;
  return (saved as Currency) || 'USD';
};

const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  // Estados iniciais (SSR-safe)
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [currency, setCurrency] = useState<Currency>(getInitialCurrency);

  // Flag para não sobrescrever o localStorage na 1ª montagem
  const didMount = useRef(false);

  // Na montagem do cliente: sincroniza com o localStorage sem sobrescrever
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('language') as Language | null;
      if (savedLang && savedLang !== language) setLanguage(savedLang);

      const savedCur = localStorage.getItem('currency') as Currency | null;
      if (savedCur && savedCur !== currency) setCurrency(savedCur);
    } catch {}
    didMount.current = true;
  }, []); // somente 1x

  // Persistência — só depois da montagem (evita escrever o default por cima do salvo)
  useEffect(() => {
    if (!didMount.current) return;
    try { localStorage.setItem('language', language); } catch {}
  }, [language]);

  useEffect(() => {
    if (!didMount.current) return;
    try { localStorage.setItem('currency', currency); } catch {}
  }, [currency]);

  // t(): idioma atual -> ES -> PT -> EN -> fallback
  const t = (key: string, fallback?: string) => {
    const parts = key.split('.');
    const dig = (obj: any) =>
      parts.reduce<any>((acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), obj);

    const cur = dig(translations[language]); if (typeof cur === 'string') return cur;
    const es  = dig((translations as any).es); if (typeof es  === 'string') return es;
    const pt  = dig((translations as any).pt); if (typeof pt  === 'string') return pt;
    const en  = dig((translations as any).en); if (typeof en  === 'string') return en;

    return fallback ?? key;
  };

  return (
    <PreferencesContext.Provider value={{ language, setLanguage, t, currency, setCurrency }}>
      {children}
    </PreferencesContext.Provider>
  );
};

const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within a PreferencesProvider');
  return context;
};

export { PreferencesProvider, usePreferences };
