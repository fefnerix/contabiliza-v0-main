export function sanitizePhone(input: string) {
  return input.replace(/[^\d+]/g, '');
}

export function isLikelyPhone(input: string) {
  const digits = input.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/** Converte para E.164.
 * Requer DDI explícito quando não há '+'.
 * NÃO aplica +55 por padrão.
 */
export function toE164WhatsApp(input: string) {
  const raw = input.trim();
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return `+${digits}`;
  // se não tiver '+', obrigar o usuário a informar DDI
  throw new Error('Incluya el DDI, por ejemplo: +54 11 1234-5678');
}
