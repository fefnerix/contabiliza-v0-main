import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePreferences, CountryCode, Currency, Language } from '@/contexts/PreferencesContext';
import { Flag, Globe, MapPin } from 'lucide-react';
import { COUNTRIES } from '@/data/countries';

const CURRENCY_DISPLAY: Partial<Record<Currency, string>> = {
  USD: 'USD ($)',
  MXN: 'MXN ($)',
  ARS: 'ARS ($)',
  CLP: 'CLP ($)',
  COP: 'COP ($)',
  PEN: 'PEN (S/.)',
  UYU: 'UYU ($)',
  PYG: 'PYG (₲)',
  BOB: 'BOB (Bs.)',
  CRC: 'CRC (₡)',
  GTQ: 'GTQ (Q)',
  DOP: 'DOP (RD$)',
  PAB: 'PAB (B/.)',
  NIO: 'NIO (C$)',
  HNL: 'HNL (L)',
  SVC: 'SVC ($)',
  EUR: 'EUR (€)',
  GBP: 'GBP (£)',
  CHF: 'CHF (CHF)',
  SEK: 'SEK (kr)',
  NOK: 'NOK (kr)',
  DKK: 'DKK (kr)',
  PLN: 'PLN (zł)',
  BRL: 'BRL (R$)',
};

const LanguageCurrencySelector: React.FC = () => {
  const { currency, language, setLanguage, country, timezone, t } = usePreferences();
  const currencyLabel = CURRENCY_DISPLAY[currency] ?? currency;
  const countryLabel = COUNTRIES[country as CountryCode]?.name || country;

  return (
    <div className="flex flex-col space-y-4">
      {/* País — bloqueado após cadastro */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="country-display" className="text-sm font-medium">
          {t('settings.country', 'País')}
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative w-[220px]">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="country-display"
                readOnly
                disabled
                value={countryLabel}
                className="pl-9 cursor-not-allowed bg-muted/60"
                aria-describedby="country-locked-hint"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('settings.countryLocked', 'El país no puede cambiarse después del registro')}</p>
          </TooltipContent>
        </Tooltip>
        <p id="country-locked-hint" className="text-xs text-muted-foreground">
          {t('settings.countryHelp', 'La zona horaria se configura según tu país de registro')} ({timezone})
        </p>
      </div>

      {/* Idioma */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="language-select" className="text-sm font-medium">
          {t('settings.language')}
        </label>
        <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
          <SelectTrigger id="language-select" className="w-[220px]">
            <Globe className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('settings.language')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="pt">Português</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Moeda — bloqueada após cadastro */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="currency-display" className="text-sm font-medium">
          {t('settings.currency')}
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative w-[220px]">
              <Flag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="currency-display"
                readOnly
                disabled
                value={currencyLabel}
                className="pl-9 cursor-not-allowed bg-muted/60"
                aria-describedby="currency-locked-hint"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('settings.currencyLocked', 'La moneda no puede cambiarse después del registro')}</p>
          </TooltipContent>
        </Tooltip>
        <p id="currency-locked-hint" className="text-xs text-muted-foreground">
          {t('settings.currencyLocked', 'La moneda no puede cambiarse después del registro')}
        </p>
      </div>
    </div>
  );
};

export default LanguageCurrencySelector;
