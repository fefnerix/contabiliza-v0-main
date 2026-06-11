/** Dígitos E.164 sem + (ex.: 5511936235098) */
export function normalizeWhatsappDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function formatWhatsappForDisplay(phone: string): string {
  const d = normalizeWhatsappDigits(phone);
  if (!d) return "";

  if (d.startsWith("55") && d.length >= 12) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    if (rest.length === 9) {
      return `+55 ${ddd} ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    if (rest.length === 8) {
      return `+55 ${ddd} ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }

  return `+${d}`;
}

export function openWhatsAppChat(phone: string, message?: string): void {
  const digits = normalizeWhatsappDigits(phone);
  if (!digits) return;

  const base = `https://wa.me/${digits}`;
  const url = message?.trim()
    ? `${base}?text=${encodeURIComponent(message.trim())}`
    : base;

  window.open(url, "_blank", "noopener,noreferrer");
}
