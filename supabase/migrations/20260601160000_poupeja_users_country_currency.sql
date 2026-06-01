-- Perfil: país e moeda escolhidos no cadastro MVP
ALTER TABLE public.poupeja_users
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT 'R$';
