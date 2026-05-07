# Secrets Policy — Contabiliza

## Secrets obrigatórios no GitHub

| Secret | Valor | Como obter |
|--------|-------|------------|
| SUPABASE_ACCESS_TOKEN | token pessoal | supabase.com → Account → Access Tokens |
| SUPABASE_PROJECT_ID | cbkynnvuiuyjmdjtorvc | fixo |
| SUPABASE_SERVICE_ROLE_KEY | eyJ... | Dashboard → Settings → API → service_role |
| SUPABASE_DB_PASSWORD | senha do DB | Dashboard → Settings → Database |
| VITE_SUPABASE_ANON_KEY | eyJ... | Dashboard → Settings → API → anon/public |

## Secrets obrigatórios na Vercel

| Var | Valor |
|-----|-------|
| VITE_SUPABASE_URL | https://cbkynnvuiuyjmdjtorvc.supabase.co |
| VITE_SUPABASE_ANON_KEY | eyJ... (anon/public key) |

## Regras

- Nunca commitar secrets em código
- `.env.local` nunca vai para o git
- Rotacionar `SUPABASE_SERVICE_ROLE_KEY` a cada 90 dias
- Em caso de vazamento: revogar imediatamente no dashboard Supabase

