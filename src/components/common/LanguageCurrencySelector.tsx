import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePreferences, CountryCode, Language } from '@/contexts/PreferencesContext';
import { Flag, Globe, MapPin } from 'lucide-react';
import { COUNTRIES, getCountryTimezone } from '@/data/countries';

const LanguageCurrencySelector: React.FC = () => {
  const { currency, setCurrency, language, setLanguage, country, setCountry, timezone, setTimezone, t } = usePreferences();

  const latinAmericaCountryCodes: CountryCode[] = [
    'BR', 'AR', 'CO', 'MX', 'CL', 'PY', 'PE', 'VE', 'UY', 'EC',
    'BO', 'CU', 'DO', 'PA', 'CR', 'GT', 'SV', 'HN', 'NI',
  ];

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    setTimezone(getCountryTimezone(newCountry));
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* País */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="country-select" className="text-sm font-medium">
          {t('settings.country', 'País')}
        </label>
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger id="country-select" className="w-[220px]">
            <MapPin className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('settings.country', 'País')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {latinAmericaCountryCodes.map((code) => (
                <SelectItem key={code} value={code}>
                  {COUNTRIES[code]?.name || code}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t('settings.countryHelp', 'Sua zona horária atualiza automaticamente')} ({timezone})
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

      {/* Moeda */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="currency-select" className="text-sm font-medium">
          {t('settings.currency')}
        </label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger id="currency-select" className="w-[220px]">
            <Flag className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t('settings.currency')} />
          </SelectTrigger>
          <SelectContent>
            {/* Global (deixe USD visível no topo) */}
            <SelectGroup>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectGroup>

            {/* América Latina */}
            <SelectGroup>
              <SelectItem value="MXN">MXN ($)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="ARS">ARS ($)</SelectItem>
              <SelectItem value="CLP">CLP ($)</SelectItem>
              <SelectItem value="COP">COP ($)</SelectItem>
              <SelectItem value="PEN">PEN (S/.)</SelectItem>
              <SelectItem value="UYU">UYU ($)</SelectItem>
              <SelectItem value="PYG">PYG (₲)</SelectItem>
              <SelectItem value="BOB">BOB (Bs.)</SelectItem>
              <SelectItem value="CRC">CRC (₡)</SelectItem>
              <SelectItem value="GTQ">GTQ (Q)</SelectItem>
              <SelectItem value="DOP">DOP (RD$)</SelectItem>
              <SelectItem value="PAB">PAB (B/.)</SelectItem>
              <SelectItem value="NIO">NIO (C$)</SelectItem>
              <SelectItem value="HNL">HNL (L)</SelectItem>
              <SelectItem value="SVC">SVC ($)</SelectItem>
            </SelectGroup>

            {/* Europa */}
            <SelectGroup>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="CHF">CHF (CHF)</SelectItem>
              <SelectItem value="SEK">SEK (kr)</SelectItem>
              <SelectItem value="NOK">NOK (kr)</SelectItem>
              <SelectItem value="DKK">DKK (kr)</SelectItem>
              <SelectItem value="PLN">PLN (zł)</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LanguageCurrencySelector;
