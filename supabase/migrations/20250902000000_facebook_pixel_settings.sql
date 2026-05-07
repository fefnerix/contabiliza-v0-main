-- Migration: Facebook Pixel Settings
-- Adiciona configurações do Facebook Pixel na tabela poupeja_settings

-- Primeiro, adicionar 'marketing' às categorias permitidas
ALTER TABLE poupeja_settings DROP CONSTRAINT IF EXISTS poupeja_settings_category_check;
ALTER TABLE poupeja_settings ADD CONSTRAINT poupeja_settings_category_check 
  CHECK (category IN ('branding', 'stripe', 'pricing', 'contact', 'system', 'marketing'));

-- Corrigir função is_admin para resolver ambiguidade de user_id
-- Primeiro, remover as políticas que dependem da função
DROP POLICY IF EXISTS "Only admins can view settings" ON public.poupeja_settings;
DROP POLICY IF EXISTS "Only admins can insert settings" ON public.poupeja_settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON public.poupeja_settings;
DROP POLICY IF EXISTS "Only admins can delete settings" ON public.poupeja_settings;
DROP POLICY IF EXISTS "Only admins can view settings history" ON public.poupeja_settings_history;
DROP POLICY IF EXISTS "Admins can view all uploads" ON public.poupeja_uploads;

-- Remover a função existente
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Recriar a função com nome de parâmetro diferente
CREATE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = check_user_id AND user_roles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar as políticas com a função corrigida
CREATE POLICY "Only admins can view settings" ON public.poupeja_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Only admins can insert settings" ON public.poupeja_settings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update settings" ON public.poupeja_settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete settings" ON public.poupeja_settings
  FOR DELETE USING (public.is_admin());

CREATE POLICY "Only admins can view settings history" ON public.poupeja_settings_history
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can view all uploads" ON public.poupeja_uploads
  FOR SELECT USING (public.is_admin());

-- Inserir configurações do Facebook Pixel
INSERT INTO poupeja_settings (key, value, value_type, category, description, created_at, updated_at)
VALUES 
  ('facebook_pixel_enabled', 'false', 'boolean', 'marketing', 'Ativa/desativa o Facebook Pixel', NOW(), NOW()),
  ('facebook_pixel_id', '', 'string', 'marketing', 'ID do Facebook Pixel (15-20 dígitos)', NOW(), NOW()),
  ('facebook_pixel_events', '["PageView","Lead","CompleteRegistration","Purchase"]', 'json', 'marketing', 'Eventos padrão do Facebook Pixel', NOW(), NOW());

-- Comentário: Configurações do Facebook Pixel adicionadas com sucesso
