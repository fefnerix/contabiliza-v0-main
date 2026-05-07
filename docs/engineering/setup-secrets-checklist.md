# Checklist de Secrets — Contabiliza

## GitHub Secrets

Acessar: https://github.com/SEU_USUARIO/SEU_REPO/settings/secrets/actions

Adicionar os seguintes secrets (New repository secret):

| Secret | Valor |
|--------|-------|
| SUPABASE_PROJECT_ID | cbkynnvuiuyjmdjtorvc |
| SUPABASE_ACCESS_TOKEN | [pegar em supabase.com -> Account -> Access Tokens] |
| SUPABASE_SERVICE_ROLE_KEY | [pegar em supabase.com/dashboard/project/cbkynnvuiuyjmdjtorvc/settings/api] |
| SUPABASE_DB_PASSWORD | [pegar em supabase.com/dashboard/project/cbkynnvuiuyjmdjtorvc/settings/database] |
| DISCORD_WEBHOOK_URL | [webhook do canal de alertas do Discord] |
| VITE_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNia3lubnZ1aXV5am1kanRvcnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjE5NzYsImV4cCI6MjA5MzY5Nzk3Nn0.sGnjssT5k08GqEV1QpJo1fo3ad4TergMw_rjp_kPJtM |
| VITE_SENTRY_DSN | [DSN do projeto Sentry frontend] |

## Vercel Environment Variables

Acessar: https://vercel.com/dashboard -> Seu projeto -> Settings -> Environment Variables

| Variável | Valor | Environments |
|----------|-------|-------------|
| VITE_SUPABASE_URL | https://cbkynnvuiuyjmdjtorvc.supabase.co | Production, Preview, Development |
| VITE_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNia3lubnZ1aXV5am1kanRvcnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMjE5NzYsImV4cCI6MjA5MzY5Nzk3Nn0.sGnjssT5k08GqEV1QpJo1fo3ad4TergMw_rjp_kPJtM | Production, Preview, Development |
| VITE_SENTRY_DSN | [DSN do projeto Sentry frontend] | Production, Preview, Development |

## Após configurar Vercel -> Redeploy

Settings -> Deployments -> Redeploy mais recente

