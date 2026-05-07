# Implementação do Sistema de Seleção de País por Geolocalização

## Visão Geral

Este documento descreve a implementação de um sistema de input de telefone com seleção automática de país baseada na geolocalização do usuário, incluindo bandeiras e códigos de telefone.

## Componentes Criados

### 1. `src/data/countries.ts`
Arquivo contendo dados de todos os países suportados, incluindo:
- Código do país (ISO 3166-1 alpha-2)
- Nome do país
- Código de telefone
- Emoji da bandeira

### 2. `src/hooks/useGeolocation.ts`
Hook personalizado que detecta automaticamente o país do usuário usando:
1. **API de Intl**: Detecta o locale do navegador
2. **Geolocalização**: Usa a API de geolocalização do navegador + serviço de reverse geocoding
3. **Fallback**: Brasil como país padrão

### 3. `src/components/common/CountryPhoneInput.tsx`
Componente principal que combina:
- Seletor de país com bandeiras
- Campo de busca de países
- Input de telefone integrado
- Detecção automática de país

## Funcionalidades

### Detecção Automática de País
- Detecta o país baseado no locale do navegador
- Se não disponível, usa geolocalização
- Fallback para Brasil se nenhuma detecção funcionar

### Interface do Usuário
- **Bandeira do país**: Exibida no botão de seleção
- **Código do país**: Mostrado junto com a bandeira
- **Campo de busca**: Permite buscar países por nome, código ou código de telefone
- **Input de telefone**: Integrado com o seletor de país

### Validação e Formatação
- Formata automaticamente o número com o código do país
- Remove caracteres inválidos
- Mantém apenas números, espaços, parênteses e hífens

## Uso

### Em Páginas de Registro
```tsx
import CountryPhoneInput from '@/components/common/CountryPhoneInput';

<CountryPhoneInput
  value={whatsapp}
  onChange={handleWhatsappChange}
  label="WhatsApp"
  placeholder="(DDD) número — ej.: 11 1234-5678"
  required
  error={error}
/>
```

### Em Formulários de Autenticação
```tsx
<FormField
  control={form.control}
  name="phone"
  render={({ field }) => (
    <FormItem>
      <FormLabel>WhatsApp</FormLabel>
      <FormControl>
        <CountryPhoneInput
          value={field.value}
          onChange={field.onChange}
          placeholder="(DDD) número — ej.: 11 1234-5678"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Páginas Atualizadas

1. **RegisterPage.tsx**: Página de registro principal
2. **AuthForm.tsx**: Formulário de autenticação
3. **ProfilePage.tsx**: Página de perfil do usuário

## Características Técnicas

### Geolocalização
- Usa `navigator.language` para detecção primária
- API de geolocalização do navegador como fallback
- Serviço BigDataCloud para reverse geocoding
- Timeout de 5 segundos para geolocalização

### Performance
- Detecção assíncrona não bloqueia a interface
- Estados de loading durante detecção
- Fallback rápido para país padrão

### Acessibilidade
- Labels apropriados
- Navegação por teclado
- Suporte a screen readers
- Foco automático no input após seleção de país

## Países Suportados

O sistema inclui mais de 60 países, com foco em:
- América Latina (Brasil, Argentina, México, etc.)
- América do Norte (EUA, Canadá)
- Europa (Espanha, Portugal, França, etc.)
- África (vários países)
- Ásia (Japão, China, Índia, etc.)

## Configuração

### País Padrão
O Brasil é configurado como país padrão em `src/data/countries.ts`:

```typescript
export const getDefaultCountry = (): Country => {
  return getCountryByCode('BR') || countries[0];
};
```

### Personalização
Para adicionar novos países, edite o array `countries` em `src/data/countries.ts`.

## Considerações de Segurança

- Geolocalização requer permissão do usuário
- Fallback gracioso se permissão for negada
- Não armazena dados de localização
- Usa apenas para detecção inicial

## Compatibilidade

- Funciona em todos os navegadores modernos
- Fallback para países padrão em navegadores antigos
- Suporte a dispositivos móveis
- Interface responsiva
