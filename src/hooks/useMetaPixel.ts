import { useEffect } from 'react';

declare global {
  interface Window {
    fbq: any;
  }
}

export const useMetaPixel = () => {
  useEffect(() => {
    // Carregar o Meta Pixel se ainda não foi carregado
    if (!window.fbq) {
      // Meta Pixel Code
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      
      // Inicializar o pixel
      window.fbq('init', '1257963102739142');
      window.fbq('track', 'PageView');
    }
  }, []);

  const trackEvent = (eventName: string, parameters?: any) => {
    if (window.fbq) {
      window.fbq('track', eventName, parameters);
    }
  };

  const trackPurchase = (value: number, currency: string = 'USD', planType?: string) => {
    if (window.fbq) {
      const parameters: any = {
        value: value,
        currency: currency
      };
      
      // Adicionar informações do plano se disponível
      if (planType) {
        parameters.content_type = 'subscription';
        parameters.content_name = `Contabiliza ${planType} Plan`;
      }
      
      window.fbq('track', 'Purchase', parameters);
      console.log('Meta Pixel Purchase Event:', parameters);
    }
  };

  return { trackEvent, trackPurchase };
};
