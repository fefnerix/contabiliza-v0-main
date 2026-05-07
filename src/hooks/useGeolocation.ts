import { useState, useEffect } from 'react';
import { getCountryByCode, getDefaultCountry, Country } from '@/data/countries';

interface GeolocationState {
  country: Country;
  isLoading: boolean;
  error: string | null;
}

export const useGeolocation = (): GeolocationState => {
  const [state, setState] = useState<GeolocationState>({
    country: getDefaultCountry(),
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const detectCountry = async () => {
      try {
        // Primeiro, tenta usar a API de Intl para detectar o locale
        const locale = navigator.language || navigator.languages?.[0];
        if (locale) {
          const countryCode = locale.split('-')[1]?.toUpperCase();
          if (countryCode) {
            const detectedCountry = getCountryByCode(countryCode);
            if (detectedCountry) {
              setState({
                country: detectedCountry,
                isLoading: false,
                error: null
              });
              return;
            }
          }
        }

        // Se não conseguir detectar pelo locale, tenta usar a API de geolocalização
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords;
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`
                );
                
                if (response.ok) {
                  const data = await response.json();
                  const countryCode = data.countryCode;
                  const detectedCountry = getCountryByCode(countryCode);
                  
                  if (detectedCountry) {
                    setState({
                      country: detectedCountry,
                      isLoading: false,
                      error: null
                    });
                    return;
                  }
                }
              } catch (error) {
                console.warn('Erro ao detectar país por geolocalização:', error);
              }
              
              // Fallback para país padrão
              setState({
                country: getDefaultCountry(),
                isLoading: false,
                error: null
              });
            },
            (error) => {
              console.warn('Erro de geolocalização:', error);
              setState({
                country: getDefaultCountry(),
                isLoading: false,
                error: null
              });
            },
            {
              timeout: 5000,
              enableHighAccuracy: false
            }
          );
        } else {
          // Se não houver suporte à geolocalização, usa o país padrão
          setState({
            country: getDefaultCountry(),
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Erro ao detectar país:', error);
        setState({
          country: getDefaultCountry(),
          isLoading: false,
          error: 'Error al detectar ubicación'
        });
      }
    };

    detectCountry();
  }, []);

  return state;
};
