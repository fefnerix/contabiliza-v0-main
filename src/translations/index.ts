import ptTranslations from './pt';
import enTranslations from './en';
import esTranslations from './es';

export type TranslationsMap = {
  pt: typeof ptTranslations;
  en: typeof enTranslations;
  es: typeof esTranslations;
};

const translations: TranslationsMap = {
  pt: ptTranslations,
  en: enTranslations,
  es: esTranslations,
};

export default translations;
