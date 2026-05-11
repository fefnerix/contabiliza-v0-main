import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries, Country, getCountryByCode } from '@/data/countries';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (countryCode: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  error?: string;
}

const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  onCountryChange,
  label = 'WhatsApp',
  placeholder = 'Digite su número',
  required = false,
  className,
  error
}) => {
  const { country: detectedCountry, isLoading: isDetecting } = useGeolocation();
  const [selectedCountry, setSelectedCountry] = useState<Country>(detectedCountry);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  // Atualiza o país selecionado quando a detecção termina
  useEffect(() => {
    if (!isDetecting && detectedCountry) {
      setSelectedCountry(detectedCountry);
      onCountryChange?.(detectedCountry.code);
    }
  }, [isDetecting, detectedCountry, onCountryChange]);

  // Filtra países baseado no termo de busca
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.phoneCode.includes(searchTerm) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (countryCode: string) => {
    const country = getCountryByCode(countryCode);
    if (country) {
      setSelectedCountry(country);
      onCountryChange?.(country.code);
      setIsOpen(false);
      setSearchTerm('');
      
      // Foca no input de telefone após selecionar o país
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value;
    
    // Remove o código do país se o usuário digitou
    let cleanPhone = phoneValue;
    if (phoneValue.startsWith(selectedCountry.phoneCode)) {
      cleanPhone = phoneValue.substring(selectedCountry.phoneCode.length);
    }
    
    // Remove caracteres não numéricos exceto +, espaços, parênteses e hífens
    cleanPhone = cleanPhone.replace(/[^\d\s\(\)\-\+]/g, '');
    
    // Monta o número completo com o código do país
    const fullNumber = selectedCountry.phoneCode + cleanPhone;
    onChange(fullNumber);
  };

  // Extrai apenas o número do telefone (sem o código do país) para exibição
  const displayPhone = value.startsWith(selectedCountry.phoneCode)
    ? value.substring(selectedCountry.phoneCode.length)
    : value;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="phone-input" className="text-sm font-medium">
          {label}
        </Label>
      )}
      
      <div className="relative flex">
        {/* Seletor de País */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 px-3 border-r-0 rounded-r-none focus:z-10",
              isOpen && "border-blue-500 ring-2 ring-blue-500 ring-offset-2"
            )}
            onClick={() => setIsOpen(!isOpen)}
            disabled={isDetecting}
          >
            <span className="text-lg mr-2">{selectedCountry.flagEmoji}</span>
            <span className="text-sm font-medium">{selectedCountry.phoneCode}</span>
            <ChevronDown className={cn(
              "ml-1 h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )} />
          </Button>

          {/* Dropdown de Países */}
          {isOpen && (
            <div
              ref={selectRef}
              className="absolute top-full left-0 z-50 w-80 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-hidden"
            >
              {/* Campo de busca */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar país..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Lista de países */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3",
                        selectedCountry.code === country.code && "bg-blue-50 text-blue-700"
                      )}
                      onClick={() => handleCountrySelect(country.code)}
                    >
                      <span className="text-lg">{country.flagEmoji}</span>
                      <div className="flex-1">
                        <div className="font-medium">{country.name}</div>
                        <div className="text-sm text-gray-500">{country.phoneCode}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-gray-500">
                    Ningún país encontrado
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input de Telefone */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="phone-input"
            type="tel"
            value={displayPhone}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            required={required}
            className="pl-10 rounded-l-none border-l-0"
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Mensagem de ajuda */}
      <p className="text-xs text-gray-500">
        Este número será utilizado para enviar mensajes y notificaciones importantes vía WhatsApp.
      </p>

      {/* Mensagem de erro */}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Overlay para fechar o dropdown quando clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default CountryPhoneInput;
