import { usePreferences } from '@/contexts/PreferencesContext';

/**
 * Traducciones por idioma (`PreferencesContext`). Con idioma `es`, las cadenas salen de `@/i18n/es` → `@/translations/es`.
 *
 * @returns `{ t }` — `t('clave.anidada')` con fallback es → pt → en.
 */
export const useTranslations = () => {
  const { t } = usePreferences();

  return { t };
};
