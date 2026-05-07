import { getIntlLocale } from '@/utils/locale';
import type { Language } from '@/contexts/PreferencesContext';

export const formatCurrency = (
  value: number,
  lang: Language,
  currency: string
) =>
  new Intl.NumberFormat(getIntlLocale(lang), {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

export function formatMoney(
  value: number,
  {
    currency = 'USD',
    locale = 'es-419',
    onlySymbol = true, // true → "$ 9.90"; false → "US$ 9.90"
  }: { currency?: string; locale?: string; onlySymbol?: boolean } = {}
) {
  const out = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return onlySymbol ? out.replace(/^US\$\s?/, '$') : out;
}
