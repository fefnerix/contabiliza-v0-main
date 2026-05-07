-- =====================================================
-- ADICIONAR CONSTRAINTS ÚNICOS PARA EMAIL E PHONE
-- Data: 2025-01-15
-- Descrição: Adiciona validações únicas para email e phone na tabela poupeja_users
-- =====================================================

-- 1. Adicionar constraint único para email (se não existir)
DO $$ 
BEGIN
  -- Verificar se o constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'poupeja_users_email_key' 
    AND table_name = 'poupeja_users'
  ) THEN
    -- Adicionar constraint único para email
    ALTER TABLE public.poupeja_users 
    ADD CONSTRAINT poupeja_users_email_key UNIQUE (email);
    
    RAISE NOTICE 'Constraint único para email adicionado com sucesso';
  ELSE
    RAISE NOTICE 'Constraint único para email já existe';
  END IF;
END $$;

-- 2. LIMPAR DADOS DUPLICADOS DE PHONE ANTES DE ADICIONAR CONSTRAINT
DO $$ 
DECLARE
  duplicate_count INTEGER;
  empty_phone_count INTEGER;
BEGIN
  -- Primeiro, limpar telefones vazios ou nulos
  UPDATE public.poupeja_users 
  SET phone = NULL 
  WHERE phone IS NULL OR phone = '' OR phone = 'null' OR TRIM(phone) = '';
  
  -- Contar quantos telefones vazios foram limpos
  GET DIAGNOSTICS empty_phone_count = ROW_COUNT;
  IF empty_phone_count > 0 THEN
    RAISE NOTICE 'Limpados % telefones vazios/nulos', empty_phone_count;
  END IF;
  
  -- Contar quantos telefones duplicados existem
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT phone, COUNT(*) as cnt
    FROM public.poupeja_users 
    WHERE phone IS NOT NULL AND phone != '' AND TRIM(phone) != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Encontrados % telefones duplicados. Limpando dados duplicados...', duplicate_count;
    
    -- Manter apenas o primeiro registro de cada telefone duplicado
    -- Atualizar os demais para NULL
    UPDATE public.poupeja_users 
    SET phone = NULL
    WHERE id IN (
      SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at ASC) as rn
        FROM public.poupeja_users 
        WHERE phone IS NOT NULL AND phone != '' AND TRIM(phone) != ''
      ) ranked
      WHERE rn > 1
    );
    
    RAISE NOTICE 'Dados duplicados de telefone limpos com sucesso';
  ELSE
    RAISE NOTICE 'Nenhum telefone duplicado encontrado';
  END IF;
  
  -- Verificação final: garantir que não há duplicatas
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT phone, COUNT(*) as cnt
    FROM public.poupeja_users 
    WHERE phone IS NOT NULL AND phone != '' AND TRIM(phone) != ''
    GROUP BY phone
    HAVING COUNT(*) > 1
  ) final_check;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Ainda existem % telefones duplicados após limpeza. Abortando migração.', duplicate_count;
  END IF;
  
  RAISE NOTICE 'Verificação final: Nenhuma duplicata encontrada';
END $$;

-- 3. Adicionar constraint único para phone (apenas valores não nulos)
DO $$ 
BEGIN
  -- Verificar se o constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'poupeja_users_phone_key' 
    AND table_name = 'poupeja_users'
  ) THEN
    -- Adicionar constraint único para phone (apenas valores não nulos)
    -- Usar índice parcial para ignorar valores NULL
    CREATE UNIQUE INDEX poupeja_users_phone_key ON public.poupeja_users (phone) 
    WHERE phone IS NOT NULL AND phone != '' AND TRIM(phone) != '';
    
    RAISE NOTICE 'Constraint único para phone adicionado com sucesso';
  ELSE
    RAISE NOTICE 'Constraint único para phone já existe';
  END IF;
END $$;

-- 4. Criar índices para melhorar performance das consultas de validação
CREATE INDEX IF NOT EXISTS idx_poupeja_users_email ON public.poupeja_users (email);
-- O índice para phone já foi criado como único acima, não precisa criar outro

-- 5. Comentários para documentação
COMMENT ON CONSTRAINT poupeja_users_email_key ON public.poupeja_users IS 'Garante que cada email seja único na tabela';
-- Comentário para o índice único de phone (sintaxe correta)
COMMENT ON INDEX poupeja_users_phone_key IS 'Garante que cada número de telefone seja único na tabela (apenas valores não nulos)';

-- 6. Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Constraints únicos para email e phone configurados com sucesso';
  RAISE NOTICE '📧 Email: Constraint único ativo';
  RAISE NOTICE '📱 Phone: Constraint único ativo (apenas valores não nulos)';
  RAISE NOTICE '⚡ Índices de performance criados';
  RAISE NOTICE '🧹 Dados duplicados de telefone foram limpos automaticamente';
END $$;
