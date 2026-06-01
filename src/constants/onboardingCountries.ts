import type { Currency, Language } from "@/contexts/PreferencesContext";

export type OnboardingCountryCode =
  | "BR"
  | "MX"
  | "CO"
  | "AR"
  | "CL"
  | "PE"
  | "UY"
  | "PY"
  | "BO"
  | "VE"
  | "EC"
  | "PA"
  | "PT"
  | "US"
  | "ES";

export interface OnboardingCountry {
  code: OnboardingCountryCode;
  name: string;
  flag: string;
  phoneCode: string;
  currency: Currency;
  symbol: string;
  language: Language;
  timezone: string;
}

/** Países LATAM (Colombia primero por defecto del producto). */
export const ONBOARDING_LATAM_COUNTRIES: OnboardingCountry[] = [
  { code: "CO", name: "Colombia", flag: "🇨🇴", phoneCode: "+57", currency: "COP", symbol: "$", language: "es", timezone: "America/Bogota" },
  { code: "BR", name: "Brasil", flag: "🇧🇷", phoneCode: "+55", currency: "BRL", symbol: "R$", language: "pt", timezone: "America/Sao_Paulo" },
  { code: "MX", name: "México", flag: "🇲🇽", phoneCode: "+52", currency: "MXN", symbol: "MX$", language: "es", timezone: "America/Mexico_City" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", phoneCode: "+54", currency: "ARS", symbol: "$", language: "es", timezone: "America/Argentina/Buenos_Aires" },
  { code: "CL", name: "Chile", flag: "🇨🇱", phoneCode: "+56", currency: "CLP", symbol: "$", language: "es", timezone: "America/Santiago" },
  { code: "PE", name: "Perú", flag: "🇵🇪", phoneCode: "+51", currency: "PEN", symbol: "S/", language: "es", timezone: "America/Lima" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", phoneCode: "+598", currency: "UYU", symbol: "$", language: "es", timezone: "America/Montevideo" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", phoneCode: "+595", currency: "PYG", symbol: "₲", language: "es", timezone: "America/Asuncion" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", phoneCode: "+591", currency: "BOB", symbol: "Bs.", language: "es", timezone: "America/La_Paz" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", phoneCode: "+58", currency: "VES", symbol: "Bs.", language: "es", timezone: "America/Caracas" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", phoneCode: "+593", currency: "USD", symbol: "$", language: "es", timezone: "America/Guayaquil" },
  { code: "PA", name: "Panamá", flag: "🇵🇦", phoneCode: "+507", currency: "USD", symbol: "$", language: "es", timezone: "America/Panama" },
];

export const ONBOARDING_OTHER_COUNTRIES: OnboardingCountry[] = [
  { code: "PT", name: "Portugal", flag: "🇵🇹", phoneCode: "+351", currency: "EUR", symbol: "€", language: "pt", timezone: "Europe/Lisbon" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", phoneCode: "+1", currency: "USD", symbol: "$", language: "en", timezone: "America/New_York" },
  { code: "ES", name: "España", flag: "🇪🇸", phoneCode: "+34", currency: "EUR", symbol: "€", language: "es", timezone: "Europe/Madrid" },
];

export const ALL_ONBOARDING_COUNTRIES: OnboardingCountry[] = [
  ...ONBOARDING_LATAM_COUNTRIES,
  ...ONBOARDING_OTHER_COUNTRIES,
];

export function getOnboardingCountry(code: string): OnboardingCountry | undefined {
  return ALL_ONBOARDING_COUNTRIES.find((c) => c.code === code);
}

export function normalizeWhatsAppDigits(
  rawPhone: string,
  country: OnboardingCountry
): string {
  const cc = country.phoneCode.replace(/\D/g, "");
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith(cc)) return digits;
  if (digits.length <= 11) return cc + digits;
  return digits;
}

export function whatsappDdiPrefix(country: OnboardingCountry): string {
  return `${country.phoneCode} `;
}
