import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FacebookPixelSettings {
  facebook_pixel_enabled: boolean;
  facebook_pixel_id: string;
}

// Cache local para evitar chamadas repetidas
let pixelCache: FacebookPixelSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Declaração global para TypeScript
declare global {
  interface Window {
    fbq: any;
  }
}

export function InjectFacebookPixel() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadAndInjectPixel();
  }, []);

  const loadAndInjectPixel = async () => {
    try {
      // Verificar cache primeiro
      if (pixelCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
        await injectPixelScript(pixelCache);
        return;
      }

      // Buscar configurações do Supabase
      const { data, error } = await supabase
        .from('poupeja_settings')
        .select('key, value')
        .in('key', ['facebook_pixel_enabled', 'facebook_pixel_id']);

      if (error) {
        return;
      }

      const settings: FacebookPixelSettings = {
        facebook_pixel_enabled: false,
        facebook_pixel_id: ''
      };

      data?.forEach(item => {
        if (item.key === 'facebook_pixel_enabled') {
          settings.facebook_pixel_enabled = item.value === 'true';
        } else if (item.key === 'facebook_pixel_id') {
          settings.facebook_pixel_id = item.value || '';
        }
      });

      // Atualizar cache
      pixelCache = settings;
      cacheTimestamp = Date.now();

      // Injetar script se necessário
      await injectPixelScript(settings);
    } catch (error) {
      // Silenciar erros em produção
    }
  };

  const injectPixelScript = async (settings: FacebookPixelSettings) => {
    // Verificar se deve injetar
    if (!shouldInjectPixel(settings)) {
      return;
    }

    // Verificar se já foi injetado
    if (window.fbq) {
      setIsLoaded(true);
      return;
    }

    try {
      // Verificar consentimento de cookies (se implementado)
      if (!hasMarketingConsent()) {
        return;
      }

      // Injetar script do Facebook Pixel
      await injectFacebookScript(settings.facebook_pixel_id);
      
      // Injetar noscript fallback
      injectNoscriptFallback(settings.facebook_pixel_id);
      
      setIsLoaded(true);
    } catch (error) {
      // Silenciar erros em produção
    }
  };

  const shouldInjectPixel = (settings: FacebookPixelSettings): boolean => {
    // Verificar se está ativo
    if (!settings.facebook_pixel_enabled) {
      return false;
    }

    // Verificar se tem ID válido
    if (!settings.facebook_pixel_id || !/^\d{15,20}$/.test(settings.facebook_pixel_id)) {
      return false;
    }

    // Verificar se está em produção
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname.includes('staging') || hostname.includes('dev') || hostname.includes('127.0.0.1')) {
      return false;
    }

    return true;
  };

  const hasMarketingConsent = (): boolean => {
    // Implementar verificação de consentimento de cookies aqui
    // Por enquanto, retorna true (aceita por padrão)
    // Pode ser integrado com sistemas como Cookiebot, OneTrust, etc.
    return true;
  };

  const injectFacebookScript = (pixelId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Inicializar fbq global antes de carregar o script (padrão oficial Facebook)
        window.fbq = window.fbq || function() {
          (window.fbq.q = window.fbq.q || []).push(arguments);
        };
        window.fbq.l = +new Date();
        
        // Definir propriedades necessárias
        if (!window.fbq.q) {
          window.fbq.q = [];
        }
        if (!window.fbq.callMethod) {
          window.fbq.callMethod = window.fbq;
        }
        
        // Verificar se já existe script
        if (document.querySelector(`script[src*="fbevents.js"]`)) {
          const existingScript = document.querySelector(`script[src*="fbevents.js"]`);
          existingScript?.remove();
        }

        // Criar script principal
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://connect.facebook.net/pt_BR/fbevents.js`;
        
        script.onload = () => {
          // Aguardar um pouco para garantir que o script foi processado
          setTimeout(() => {
            try {
              window.fbq('init', pixelId);
              window.fbq('track', 'PageView');
              resolve();
            } catch (error) {
              reject(error);
            }
          }, 200);
        };
        
        script.onerror = (error) => {
          reject(new Error('Falha ao carregar script do Facebook Pixel'));
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        reject(error);
      }
    });
  };

  const injectNoscriptFallback = (pixelId: string) => {
    // Verificar se já existe
    if (document.querySelector(`noscript[data-pixel-id="${pixelId}"]`)) {
      return;
    }

    const noscript = document.createElement('noscript');
    noscript.setAttribute('data-pixel-id', pixelId);
    
    const img = document.createElement('img');
    img.height = '1';
    img.width = '1';
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    
    noscript.appendChild(img);
    document.body.appendChild(noscript);
  };

  // Componente não renderiza nada visualmente
  return null;
}

// Helper para disparar eventos manualmente
export const fbTrack = (event: string, params?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    try {
      window.fbq('track', event, params);
    } catch (error) {
      // Silenciar erros em produção
    }
  }
};

// Helper para verificar se o Pixel está ativo
export const isFacebookPixelActive = (): boolean => {
  return typeof window !== 'undefined' && !!window.fbq;
};

// Helper para obter configurações do cache
export const getFacebookPixelSettings = (): FacebookPixelSettings | null => {
  if (pixelCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return pixelCache;
  }
  return null;
};
