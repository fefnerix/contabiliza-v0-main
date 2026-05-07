# PRD — Backend Setup: Contabiliza

**Status:** 🚧 Em execução  
**Projeto Supabase:** cbkynnvuiuyjmdjtorvc  
**Última atualização:** 2026-05-07  

---

## Objetivo

Colocar o backend do Contabiliza 100% funcional em produção.

---

## Checklist de go-live

### FASE 0 — Config
- [ ] `client.ts` usa `import.meta.env.VITE_*`
- [ ] `.env.local` criado e não commitado
- [ ] `.env.example` commitado
- [ ] `supabase/config.toml` com `cbkynnvuiuyjmdjtorvc`

### FASE 1 — Banco de Dados
- [ ] `supabase db push` sem erros (31 migrations)
- [ ] 11+ tabelas existem (`poupeja_*`)
- [ ] RLS ativa em todas as tabelas sensíveis
- [ ] RPC `update_goal_amount` funcional
- [ ] RPC `is_admin()` funcional
- [ ] RPC `buscar_cadastro_por_email_phone` funcional
- [ ] Trigger `auth_user_created_trigger` ativo
- [ ] `poupeja_categories.updated_at` existe

### FASE 2 — Edge Functions
- [ ] 27+ functions deployadas
- [ ] `get-public-settings` retorna 200 sem JWT
- [ ] `stripe-webhook` retorna 200 sem JWT
- [ ] `create-checkout-session` retorna 401 sem JWT

### FASE 3 — Seed
- [ ] `poupeja_settings` com >= 28 rows
- [ ] `SELECT COUNT(*) FROM poupeja_settings` >= 28

### FASE 4 — CI/CD
- [ ] GitHub Secrets: `SUPABASE_ACCESS_TOKEN`
- [ ] GitHub Secrets: `SUPABASE_PROJECT_ID = cbkynnvuiuyjmdjtorvc`
- [ ] GitHub Secrets: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] GitHub Secrets: `SUPABASE_DB_PASSWORD`
- [ ] GitHub Secrets: `VITE_SUPABASE_ANON_KEY`
- [ ] Vercel: `VITE_SUPABASE_URL` configurada
- [ ] Vercel: `VITE_SUPABASE_ANON_KEY` configurada
- [ ] `ci.yml` verde em PR

### FASE 5 — Smoke Test Final
- [ ] App carrega sem erros no console do browser
- [ ] Login funciona
- [ ] Dashboard renderiza
- [ ] Criar transação funciona
- [ ] `get-public-settings` retorna branding correto

### P1 — Após go-live
- [ ] Configurar Stripe no admin (secret key, price IDs)
- [ ] Configurar branding (logo, cor tema)
- [ ] Criar admin via edge `create-admin-user`

### P2 — n8n
- [ ] RabbitMQ + Redis ativos
- [ ] Evolution API instância conectada
- [ ] Flows importados e ativados na ordem correta
- [ ] Teste end-to-end via WhatsApp

---

## Secrets necessários

| Secret | Onde configurar | Como obter |
|--------|----------------|------------|
| SUPABASE_ACCESS_TOKEN | GitHub | supabase.com → Account → Access Tokens |
| SUPABASE_PROJECT_ID | GitHub | cbkynnvuiuyjmdjtorvc (fixo) |
| SUPABASE_SERVICE_ROLE_KEY | GitHub | Dashboard → Settings → API |
| SUPABASE_DB_PASSWORD | GitHub | Dashboard → Settings → Database |
| VITE_SUPABASE_ANON_KEY | GitHub + Vercel | Dashboard → Settings → API → anon |
| VITE_SUPABASE_URL | Vercel | https://cbkynnvuiuyjmdjtorvc.supabase.co |

---

## Backlog priorizado

### P0 — Bloqueantes (fazer agora)
1. Prompts #1-#7 (código)
2. `supabase link` + `supabase db push` (terminal)
3. `supabase functions deploy` (terminal)
4. Executar seed SQL (Supabase dashboard)
5. Configurar secrets GitHub e Vercel
6. Push para `main` → verificar CI verde

### P1 — Antes de usuários reais
7. Configurar Stripe no admin
8. Configurar branding
9. Criar admin inicial

### P2 — n8n e automações
10. Configurar stack n8n (RabbitMQ, Redis, Evolution)
11. Importar e ativar flows

