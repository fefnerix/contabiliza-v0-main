-- =====================================================
-- FIX: poupeja_categories updated_at + tradução ES
-- Corrige trigger que quebrava UPDATE em categorias
-- =====================================================

-- 1. Adicionar coluna updated_at (estava faltando)
ALTER TABLE public.poupeja_categories
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Popular em registros existentes
UPDATE public.poupeja_categories
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 3. Criar trigger (igual às outras tabelas)
DROP TRIGGER IF EXISTS update_poupeja_categories_updated_at ON public.poupeja_categories;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE TRIGGER update_poupeja_categories_updated_at
      BEFORE UPDATE ON public.poupeja_categories
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4. Traduzir categorias padrão para espanhol
UPDATE public.poupeja_categories SET name = 'Alimentación'    WHERE name = 'Alimentação'   AND is_default = true;
UPDATE public.poupeja_categories SET name = 'Vivienda'        WHERE name = 'Moradia'        AND is_default = true;
UPDATE public.poupeja_categories SET name = 'Salud'           WHERE name = 'Saúde'          AND is_default = true;
UPDATE public.poupeja_categories SET name = 'Educación'       WHERE name = 'Educação'       AND is_default = true;
UPDATE public.poupeja_categories SET name = 'Entretenimiento' WHERE name = 'Lazer'          AND is_default = true;
UPDATE public.poupeja_categories SET name = 'Otros'           WHERE name = 'Outros'         AND is_default = true;
UPDATE public.poupeja_categories SET name = 'Salario'         WHERE name = 'Salário'        AND type = 'income' AND is_default = true;
UPDATE public.poupeja_categories SET name = 'Inversiones'     WHERE name = 'Investimentos'  AND is_default = true;

