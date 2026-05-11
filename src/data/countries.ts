export interface Country {
  code: string;
  name: string;
  phoneCode: string;
  flag: string;
  flagEmoji: string;
}

export interface CountryInfo {
  code: string; // ISO 2-letter
  name: string;
  timezone: string;
  currency?: string;
  language?: string;
}

export const countries: Country[] = [
  {
    code: 'BR',
    name: 'Brasil',
    phoneCode: '+55',
    flag: '🇧🇷',
    flagEmoji: '🇧🇷'
  },
  {
    code: 'AR',
    name: 'Argentina',
    phoneCode: '+54',
    flag: '🇦🇷',
    flagEmoji: '🇦🇷'
  },
  {
    code: 'MX',
    name: 'México',
    phoneCode: '+52',
    flag: '🇲🇽',
    flagEmoji: '🇲🇽'
  },
  {
    code: 'CO',
    name: 'Colômbia',
    phoneCode: '+57',
    flag: '🇨🇴',
    flagEmoji: '🇨🇴'
  },
  {
    code: 'PE',
    name: 'Peru',
    phoneCode: '+51',
    flag: '🇵🇪',
    flagEmoji: '🇵🇪'
  },
  {
    code: 'CL',
    name: 'Chile',
    phoneCode: '+56',
    flag: '🇨🇱',
    flagEmoji: '🇨🇱'
  },
  {
    code: 'VE',
    name: 'Venezuela',
    phoneCode: '+58',
    flag: '🇻🇪',
    flagEmoji: '🇻🇪'
  },
  {
    code: 'EC',
    name: 'Equador',
    phoneCode: '+593',
    flag: '🇪🇨',
    flagEmoji: '🇪🇨'
  },
  {
    code: 'BO',
    name: 'Bolívia',
    phoneCode: '+591',
    flag: '🇧🇴',
    flagEmoji: '🇧🇴'
  },
  {
    code: 'PY',
    name: 'Paraguai',
    phoneCode: '+595',
    flag: '🇵🇾',
    flagEmoji: '🇵🇾'
  },
  {
    code: 'UY',
    name: 'Uruguai',
    phoneCode: '+598',
    flag: '🇺🇾',
    flagEmoji: '🇺🇾'
  },
  {
    code: 'GY',
    name: 'Guiana',
    phoneCode: '+592',
    flag: '🇬🇾',
    flagEmoji: '🇬🇾'
  },
  {
    code: 'SR',
    name: 'Suriname',
    phoneCode: '+597',
    flag: '🇸🇷',
    flagEmoji: '🇸🇷'
  },
  {
    code: 'GF',
    name: 'Guiana Francesa',
    phoneCode: '+594',
    flag: '🇬🇫',
    flagEmoji: '🇬🇫'
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    phoneCode: '+1',
    flag: '🇺🇸',
    flagEmoji: '🇺🇸'
  },
  {
    code: 'CA',
    name: 'Canadá',
    phoneCode: '+1',
    flag: '🇨🇦',
    flagEmoji: '🇨🇦'
  },
  {
    code: 'ES',
    name: 'Espanha',
    phoneCode: '+34',
    flag: '🇪🇸',
    flagEmoji: '🇪🇸'
  },
  {
    code: 'PT',
    name: 'Portugal',
    phoneCode: '+351',
    flag: '🇵🇹',
    flagEmoji: '🇵🇹'
  },
  {
    code: 'FR',
    name: 'França',
    phoneCode: '+33',
    flag: '🇫🇷',
    flagEmoji: '🇫🇷'
  },
  {
    code: 'DE',
    name: 'Alemanha',
    phoneCode: '+49',
    flag: '🇩🇪',
    flagEmoji: '🇩🇪'
  },
  {
    code: 'IT',
    name: 'Itália',
    phoneCode: '+39',
    flag: '🇮🇹',
    flagEmoji: '🇮🇹'
  },
  {
    code: 'GB',
    name: 'Reino Unido',
    phoneCode: '+44',
    flag: '🇬🇧',
    flagEmoji: '🇬🇧'
  },
  {
    code: 'AU',
    name: 'Austrália',
    phoneCode: '+61',
    flag: '🇦🇺',
    flagEmoji: '🇦🇺'
  },
  {
    code: 'NZ',
    name: 'Nova Zelândia',
    phoneCode: '+64',
    flag: '🇳🇿',
    flagEmoji: '🇳🇿'
  },
  {
    code: 'JP',
    name: 'Japão',
    phoneCode: '+81',
    flag: '🇯🇵',
    flagEmoji: '🇯🇵'
  },
  {
    code: 'CN',
    name: 'China',
    phoneCode: '+86',
    flag: '🇨🇳',
    flagEmoji: '🇨🇳'
  },
  {
    code: 'IN',
    name: 'Índia',
    phoneCode: '+91',
    flag: '🇮🇳',
    flagEmoji: '🇮🇳'
  },
  {
    code: 'RU',
    name: 'Rússia',
    phoneCode: '+7',
    flag: '🇷🇺',
    flagEmoji: '🇷🇺'
  },
  {
    code: 'ZA',
    name: 'África do Sul',
    phoneCode: '+27',
    flag: '🇿🇦',
    flagEmoji: '🇿🇦'
  },
  {
    code: 'EG',
    name: 'Egito',
    phoneCode: '+20',
    flag: '🇪🇬',
    flagEmoji: '🇪🇬'
  },
  {
    code: 'NG',
    name: 'Nigéria',
    phoneCode: '+234',
    flag: '🇳🇬',
    flagEmoji: '🇳🇬'
  },
  {
    code: 'KE',
    name: 'Quênia',
    phoneCode: '+254',
    flag: '🇰🇪',
    flagEmoji: '🇰🇪'
  },
  {
    code: 'MA',
    name: 'Marrocos',
    phoneCode: '+212',
    flag: '🇲🇦',
    flagEmoji: '🇲🇦'
  },
  {
    code: 'TN',
    name: 'Tunísia',
    phoneCode: '+216',
    flag: '🇹🇳',
    flagEmoji: '🇹🇳'
  },
  {
    code: 'DZ',
    name: 'Argélia',
    phoneCode: '+213',
    flag: '🇩🇿',
    flagEmoji: '🇩🇿'
  },
  {
    code: 'LY',
    name: 'Líbia',
    phoneCode: '+218',
    flag: '🇱🇾',
    flagEmoji: '🇱🇾'
  },
  {
    code: 'SD',
    name: 'Sudão',
    phoneCode: '+249',
    flag: '🇸🇩',
    flagEmoji: '🇸🇩'
  },
  {
    code: 'ET',
    name: 'Etiópia',
    phoneCode: '+251',
    flag: '🇪🇹',
    flagEmoji: '🇪🇹'
  },
  {
    code: 'UG',
    name: 'Uganda',
    phoneCode: '+256',
    flag: '🇺🇬',
    flagEmoji: '🇺🇬'
  },
  {
    code: 'TZ',
    name: 'Tanzânia',
    phoneCode: '+255',
    flag: '🇹🇿',
    flagEmoji: '🇹🇿'
  },
  {
    code: 'GH',
    name: 'Gana',
    phoneCode: '+233',
    flag: '🇬🇭',
    flagEmoji: '🇬🇭'
  },
  {
    code: 'CI',
    name: 'Costa do Marfim',
    phoneCode: '+225',
    flag: '🇨🇮',
    flagEmoji: '🇨🇮'
  },
  {
    code: 'SN',
    name: 'Senegal',
    phoneCode: '+221',
    flag: '🇸🇳',
    flagEmoji: '🇸🇳'
  },
  {
    code: 'ML',
    name: 'Mali',
    phoneCode: '+223',
    flag: '🇲🇱',
    flagEmoji: '🇲🇱'
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    phoneCode: '+226',
    flag: '🇧🇫',
    flagEmoji: '🇧🇫'
  },
  {
    code: 'NE',
    name: 'Níger',
    phoneCode: '+227',
    flag: '🇳🇪',
    flagEmoji: '🇳🇪'
  },
  {
    code: 'TD',
    name: 'Chade',
    phoneCode: '+235',
    flag: '🇹🇩',
    flagEmoji: '🇹🇩'
  },
  {
    code: 'CM',
    name: 'Camarões',
    phoneCode: '+237',
    flag: '🇨🇲',
    flagEmoji: '🇨🇲'
  },
  {
    code: 'CF',
    name: 'República Centro-Africana',
    phoneCode: '+236',
    flag: '🇨🇫',
    flagEmoji: '🇨🇫'
  },
  {
    code: 'CG',
    name: 'República do Congo',
    phoneCode: '+242',
    flag: '🇨🇬',
    flagEmoji: '🇨🇬'
  },
  {
    code: 'CD',
    name: 'República Democrática do Congo',
    phoneCode: '+243',
    flag: '🇨🇩',
    flagEmoji: '🇨🇩'
  },
  {
    code: 'AO',
    name: 'Angola',
    phoneCode: '+244',
    flag: '🇦🇴',
    flagEmoji: '🇦🇴'
  },
  {
    code: 'ZM',
    name: 'Zâmbia',
    phoneCode: '+260',
    flag: '🇿🇲',
    flagEmoji: '🇿🇲'
  },
  {
    code: 'ZW',
    name: 'Zimbábue',
    phoneCode: '+263',
    flag: '🇿🇼',
    flagEmoji: '🇿🇼'
  },
  {
    code: 'BW',
    name: 'Botswana',
    phoneCode: '+267',
    flag: '🇧🇼',
    flagEmoji: '🇧🇼'
  },
  {
    code: 'NA',
    name: 'Namíbia',
    phoneCode: '+264',
    flag: '🇳🇦',
    flagEmoji: '🇳🇦'
  },
  {
    code: 'SZ',
    name: 'Eswatini',
    phoneCode: '+268',
    flag: '🇸🇿',
    flagEmoji: '🇸🇿'
  },
  {
    code: 'LS',
    name: 'Lesoto',
    phoneCode: '+266',
    flag: '🇱🇸',
    flagEmoji: '🇱🇸'
  },
  {
    code: 'MG',
    name: 'Madagascar',
    phoneCode: '+261',
    flag: '🇲🇬',
    flagEmoji: '🇲🇬'
  },
  {
    code: 'MU',
    name: 'Maurício',
    phoneCode: '+230',
    flag: '🇲🇺',
    flagEmoji: '🇲🇺'
  },
  {
    code: 'SC',
    name: 'Seicheles',
    phoneCode: '+248',
    flag: '🇸🇨',
    flagEmoji: '🇸🇨'
  },
  {
    code: 'KM',
    name: 'Comores',
    phoneCode: '+269',
    flag: '🇰🇲',
    flagEmoji: '🇰🇲'
  },
  {
    code: 'DJ',
    name: 'Djibouti',
    phoneCode: '+253',
    flag: '🇩🇯',
    flagEmoji: '🇩🇯'
  },
  {
    code: 'SO',
    name: 'Somália',
    phoneCode: '+252',
    flag: '🇸🇴',
    flagEmoji: '🇸🇴'
  },
  {
    code: 'ER',
    name: 'Eritreia',
    phoneCode: '+291',
    flag: '🇪🇷',
    flagEmoji: '🇪🇷'
  },
  {
    code: 'SS',
    name: 'Sudão do Sul',
    phoneCode: '+211',
    flag: '🇸🇸',
    flagEmoji: '🇸🇸'
  }
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

export const getCountryByPhoneCode = (phoneCode: string): Country | undefined => {
  return countries.find(country => country.phoneCode === phoneCode);
};

export const getDefaultCountry = (): Country => {
  return getCountryByCode('BR') || countries[0];
};

export const COUNTRIES: Record<string, CountryInfo> = {
  BR: { code: 'BR', name: 'Brasil', timezone: 'America/Sao_Paulo', currency: 'BRL', language: 'pt' },
  AR: { code: 'AR', name: 'Argentina', timezone: 'America/Argentina/Buenos_Aires', currency: 'ARS', language: 'es' },
  CO: { code: 'CO', name: 'Colombia', timezone: 'America/Bogota', currency: 'COP', language: 'es' },
  MX: { code: 'MX', name: 'México', timezone: 'America/Mexico_City', currency: 'MXN', language: 'es' },
  CL: { code: 'CL', name: 'Chile', timezone: 'America/Santiago', currency: 'CLP', language: 'es' },
  PY: { code: 'PY', name: 'Paraguay', timezone: 'America/Asuncion', currency: 'PYG', language: 'es' },
  PE: { code: 'PE', name: 'Perú', timezone: 'America/Lima', currency: 'PEN', language: 'es' },
  VE: { code: 'VE', name: 'Venezuela', timezone: 'America/Caracas', currency: 'VES', language: 'es' },
  UY: { code: 'UY', name: 'Uruguay', timezone: 'America/Montevideo', currency: 'UYU', language: 'es' },
  EC: { code: 'EC', name: 'Ecuador', timezone: 'America/Guayaquil', currency: 'USD', language: 'es' },
  BO: { code: 'BO', name: 'Bolivia', timezone: 'America/La_Paz', currency: 'BOB', language: 'es' },
  CU: { code: 'CU', name: 'Cuba', timezone: 'America/Havana', currency: 'CUP', language: 'es' },
  DO: { code: 'DO', name: 'República Dominicana', timezone: 'America/Santo_Domingo', currency: 'DOP', language: 'es' },
  PA: { code: 'PA', name: 'Panamá', timezone: 'America/Panama', currency: 'PAB', language: 'es' },
  CR: { code: 'CR', name: 'Costa Rica', timezone: 'America/Costa_Rica', currency: 'CRC', language: 'es' },
  GT: { code: 'GT', name: 'Guatemala', timezone: 'America/Guatemala', currency: 'GTQ', language: 'es' },
  SV: { code: 'SV', name: 'El Salvador', timezone: 'America/El_Salvador', currency: 'SVC', language: 'es' },
  HN: { code: 'HN', name: 'Honduras', timezone: 'America/Tegucigalpa', currency: 'HNL', language: 'es' },
  NI: { code: 'NI', name: 'Nicaragua', timezone: 'America/Managua', currency: 'NIO', language: 'es' },
};

export const getCountryTimezone = (countryCode: string): string => {
  return COUNTRIES[countryCode]?.timezone || 'America/Sao_Paulo';
};
