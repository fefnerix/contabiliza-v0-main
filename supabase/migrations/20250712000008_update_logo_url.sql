-- ========================================================================
-- MIGRAÇÃO COMENTADA - JÁ APLICADA COM SUCESSO
-- MIGRAÇÃO: Atualizar Logo URL para Contabiliza
-- Data: 2025-07-12
-- Descrição: Atualizar a logo URL para usar a logo correta do Contabiliza
-- ========================================================================

-- MIGRAÇÃO JÁ APLICADA - COMENTANDO PARA EVITAR RE-EXECUÇÃO
/*
-- Atualizar a logo URL para usar a logo correta do Contabiliza
UPDATE public.poupeja_settings 
SET 
  value = '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
  updated_at = NOW()
WHERE category = 'branding' AND key = 'logo_url';

-- Verificar se a atualização foi bem-sucedida
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.poupeja_settings 
    WHERE category = 'branding' AND key = 'logo_url' 
    AND value = '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png'
  ) THEN
    -- Se não existir, inserir
    INSERT INTO public.poupeja_settings (category, key, value, description) 
    VALUES ('branding', 'logo_url', '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png', 'URL da logo da empresa')
    ON CONFLICT (category, key) DO UPDATE SET
      value = '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
      updated_at = NOW();
  END IF;
END $$;
*/

-- ========================================================================
-- FIM DA MIGRAÇÃO
-- ========================================================================
