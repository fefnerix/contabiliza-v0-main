-- MIGRAÇÃO COMENTADA - ERRO: record "new" has no field "updated_at"
-- Atualizar categorias padrão de português para espanhol
-- Esta migração atualiza os nomes das categorias padrão no banco de dados

-- PROBLEMA: Trigger BEFORE UPDATE em poupeja_categories espera coluna updated_at que não existe
-- SOLUÇÃO: Comentar migração até corrigir o trigger

/*
-- Atualizar categorias de despesas
UPDATE public.poupeja_categories 
SET name = 'Alimentación' 
WHERE name = 'Alimentação' AND type = 'expense' AND is_default = true;

UPDATE public.poupeja_categories 
SET name = 'Vivienda' 
WHERE name = 'Moradia' AND type = 'expense' AND is_default = true;

UPDATE public.poupeja_categories 
SET name = 'Salud' 
WHERE name = 'Saúde' AND type = 'expense' AND is_default = true;

UPDATE public.poupeja_categories 
SET name = 'Educación' 
WHERE name = 'Educação' AND type = 'expense' AND is_default = true;

UPDATE public.poupeja_categories 
SET name = 'Entretenimiento' 
WHERE name = 'Lazer' AND type = 'expense' AND is_default = true;

UPDATE public.poupeja_categories 
SET name = 'Otros' 
WHERE name = 'Outros' AND type = 'expense' AND is_default = true;

-- Atualizar categorias de receitas
UPDATE public.poupeja_categories 
SET name = 'Salario' 
WHERE name = 'Salário' AND type = 'income' AND is_default = true;

UPDATE public.poupeja_categories 
SET name = 'Inversiones' 
WHERE name = 'Investimentos' AND type = 'income' AND is_default = true;

UPDATE public.poupeja_categories 
SET name = 'Otros' 
WHERE name = 'Outros' AND type = 'income' AND is_default = true;

-- Nota: 'Transporte' e 'Freelance' permanecem os mesmos em ambos os idiomas
*/
