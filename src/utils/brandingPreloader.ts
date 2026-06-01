import { withTimeout } from "@/utils/withTimeout";

interface CachedBranding {
  logoUrl: string;
  companyName: string;
  faviconUrl: string;
  logoAltText: string;
  timestamp: number;
}

const CACHE_KEY = 'app_branding_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const PUBLIC_SETTINGS_TIMEOUT_MS = 12_000;
const LOGO_PRELOAD_TIMEOUT_MS = 8_000;

export class BrandingPreloader {
  private static instance: BrandingPreloader;
  private cachedBranding: CachedBranding | null = null;
  private preloadPromise: Promise<CachedBranding | null> | null = null;

  static getInstance(): BrandingPreloader {
    if (!BrandingPreloader.instance) {
      BrandingPreloader.instance = new BrandingPreloader();
    }
    return BrandingPreloader.instance;
  }

  // Carregar branding do localStorage/cache primeiro
  private loadFromCache(): CachedBranding | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed: CachedBranding = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  // Salvar branding no cache
  private saveToCache(branding: CachedBranding): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(branding));
    } catch {
      // Ignore cache errors
    }
  }

  /** Evita await infinito se a URL da logo nunca dispara onload/onerror. */
  private preloadImage(url: string): Promise<void> {
    const trimmed = url?.trim();
    if (!trimmed) return Promise.resolve();
    return withTimeout(
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("logo preload failed"));
        img.src = trimmed;
      }),
      LOGO_PRELOAD_TIMEOUT_MS
    ).then(
      () => {},
      () => {}
    );
  }

  // Carregar branding de forma otimizada
  async loadBranding(): Promise<CachedBranding | null> {
    // Verificar cache primeiro
    const cached = this.loadFromCache();
    if (cached) {
      this.cachedBranding = cached;
      // Pre-carregar imagem em background
      this.preloadImage(cached.logoUrl).catch(() => {});
      return cached;
    }

    // Se não há cache, buscar do servidor
    if (!this.preloadPromise) {
      this.preloadPromise = this.fetchFromServer();
    }

    return this.preloadPromise;
  }

  private async fetchFromServer(): Promise<CachedBranding | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      let data: Awaited<ReturnType<typeof supabase.functions.invoke>>["data"];
      let error: Awaited<ReturnType<typeof supabase.functions.invoke>>["error"];
      try {
        const result = await withTimeout(
          supabase.functions.invoke("get-public-settings"),
          PUBLIC_SETTINGS_TIMEOUT_MS
        );
        data = result.data;
        error = result.error;
      } catch {
        return null;
      }

      if (error || !data?.success || !data?.settings) {
        return null;
      }

      const brandingSettings = data.settings.branding || {};
      const brandingData: any = {};
      
      Object.keys(brandingSettings).forEach(key => {
        brandingData[key] = brandingSettings[key].value;
      });

      const branding: CachedBranding = {
        logoUrl: brandingData.logo_url || '',
        companyName: brandingData.company_name || 'PoupeJá!',
        faviconUrl: brandingData.favicon_url || '/favicon.ico',
        logoAltText: brandingData.logo_alt_text || 'Logo',
        timestamp: Date.now()
      };

      // Pre-carregar imagem
      if (branding.logoUrl) {
        await this.preloadImage(branding.logoUrl);
      }

      // Salvar no cache
      this.saveToCache(branding);
      this.cachedBranding = branding;

      return branding;
    } catch {
      return null;
    }
  }

  // Invalidar cache (usado quando admin atualiza)
  invalidateCache(): void {
    localStorage.removeItem(CACHE_KEY);
    this.cachedBranding = null;
    this.preloadPromise = null;
  }

  // Obter branding em cache (síncrono)
  getCachedBranding(): CachedBranding | null {
    return this.cachedBranding || this.loadFromCache();
  }
}

export const brandingPreloader = BrandingPreloader.getInstance();
