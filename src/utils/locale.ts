import { ptBR, enUS, es as esLocale } from 'date-fns/locale';
import type { Language } from '@/contexts/PreferencesContext';

export const getDateFnsLocale = (lang: Language) =>
  lang === 'pt' ? ptBR : lang === 'en' ? enUS : esLocale;

export const getIntlLocale = (lang: Language) =>
  lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-419';
