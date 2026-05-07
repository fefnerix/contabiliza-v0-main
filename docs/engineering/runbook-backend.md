# Runbook — Backend Contabiliza

## Comandos essenciais

```bash
# Linkar projeto
supabase link --project-ref cbkynnvuiuyjmdjtorvc

# Aplicar migrations
supabase db push

# Deploy de uma function
supabase functions deploy get-public-settings --project-ref cbkynnvuiuyjmdjtorvc

# Deploy de todas as functions (recomendado rodar com loop local)
supabase functions deploy --project-ref cbkynnvuiuyjmdjtorvc

# Regenerar types.ts após migration
supabase gen types typescript --project-id cbkynnvuiuyjmdjtorvc > src/integrations/supabase/types.ts

# Ver logs de function
supabase functions logs get-public-settings --project-ref cbkynnvuiuyjmdjtorvc
```

## Smoke test rápido (terminal)

```bash
# Função pública deve retornar 200
curl https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/get-public-settings

# Função protegida deve retornar 401
curl https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/get-admin-settings
```

## Recuperação de admin

```bash
curl -X POST https://cbkynnvuiuyjmdjtorvc.supabase.co/functions/v1/create-admin-user \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@seudominio.com", "password": "senha_forte"}'
```

## Usuário sem row em poupeja_users (trigger falhou)

Rodar no SQL Editor:

```sql
SELECT * FROM public.recover_missing_users();
```

## Rollback de migration

Supabase não tem down migrations. Para reverter:

1. Criar nova migration com DDL inverso
2. `supabase db push`

