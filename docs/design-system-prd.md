# PRD — Design system Contabiliza (completo)

**Versão:** 2.1  
**Estado:** Proposta normativa para implementação faseada  
**Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Recharts  
**Direção visual:** Linguagem **tipo Apple** (clareza, hierarquia, calma, motion discreto, tipografia de sistema) **mantendo a cor de marca verde** como primário disciplinado — não é rebranding cromático; é **refino de execução** e consistência.

---

## 1. Resumo executivo

### 1.1 Problema

O produto mistura tokens semânticos (`index.css`), paleta `metacash-*`, hex soltos e gradientes globais. Gráficos e widgets evoluíram ad hoc (Recharts direto vs. `ChartContainer` shadcn). Isso gera inconsistência entre rotas, dificulta modo escuro e aumenta custo de manutenção.

### 1.2 Objetivo deste PRD

1. Definir um **design system único** documentado (tokens, tipo, componentes, dados visuais).  
2. Inventariar **todas as rotas e páginas** do repositório atual com prioridade de rollout.  
3. Redesenhar intencionalmente **widgets do dashboard**, **gráficos** e padrões de densidade (app vs. admin).  
4. Preservar **identidade verde** da marca com valores HSL refinados e uso semântico (primário vs. receita/despesa vs. erro).

### 1.3 Fora de âmbito imediato

- Troca de React/Radix/shadcn.  
- Substituir Recharts por outra lib na v1 (padronizar **em cima** do Recharts + tokens).  
- Ilustrações de marketing completamente novas (podem seguir wave 2).

---

## 2. Visão do design system

### 2.1 Pilares (alinhados a HIG + NN/g + boas práticas produto financeiro)

| Pilar | Significado operacional |
|-------|-------------------------|
| Clareza | Valores monetários e datas dominam; labels secundários em `--muted-foreground`. |
| Deferência | Menos moldura; mais espaço e tipografia; um nível de profundidade por cartão. |
| Consistência | Mesmos tokens em `/dashboard`, `/reports`, `/admin/*`. |
| Cor com propósito | Verde = marca + ações primárias; vermelho = destrutivo / despesa quando aplicável; não competir com três verdes diferentes no mesmo ecrã. |

### 2.2 Identidade cromática (mantém “as nossas cores”)

| Token | Papel | Notas |
|-------|--------|------|
| `--primary` | Verde de marca (ações principais, links fortes, ênfase controlada) | Refinar HSL; fonte única em `index.css` |
| `--secondary` / `--accent` | Apoio (superfícies secundárias, hovers suaves) | Derivados harmonizados do verde ou neutros |
| `--destructive` | Eliminar / erro | Um vermelho semântico |
| `--muted`, `--border`, `--card` | Neutros Apple-like | Fundos off-white / cinzas em light; cinzas profundos não puros em dark |
| Séries de gráficos | `chart-1` … `chart-5` (shadcn) ou tokens `--chart-income`, `--chart-expense` | Receita vs. despesa sempre distinguíveis sem só depender da cor (legenda + forma) |

**Regra:** eliminar gradualmente `metacash-*` e hex em componentes; mapear para tokens semânticos.

### 2.3 Tipografia

- **Sans:** stack de sistema (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, …).  
- **Pesos:** regular / medium / semibold para hierarquia (evitar >3 pesos simultâneos).  
- **Display extra:** não na v1 do DS no app (decisão mantida); eventual uso só landing em wave 2.

### 2.4 Espaçamento, raio, elevação

- Baseline **8px**; múltiplos de **4px** para microajustes.  
- `--radius` global documentado; cartões com cantos consistentes.  
- Sombras: tokens nomeados (`shadow-soft`, etc.); evitar “stack” de sombra + gradiente forte + borda grossa no mesmo bloco.

### 2.5 Motion

- Microinterações **150–220ms**, easing natural; **sem** animação decorativa em tabelas densas.  
- Respeitar `prefers-reduced-motion`.

### 2.6 Arquitetura técnica dos estilos

| Artefacto | Função |
|-----------|--------|
| `src/index.css` | Fonte da verdade `:root` / `.dark` |
| `tailwind.config.ts` | Mapeamento Tailwind → CSS variables; deprecar `metacash` após migração |
| `src/components/ui/*` | Componentes shadcn; charts via `chart.tsx` onde possível |
| `src/styles/globals.css` | Apenas fixes pontuais (ex. popper mobile); sem tokens duplicados |

---

## 3. Inventário completo de rotas e páginas

Fonte de verdade: `src/App.tsx`. Layout inferido por uso de `MainLayout` nos ficheiros de página (quando aplicável).

### 3.1 Rotas públicas e autenticação

| Rota | Componente (ficheiro) | Layout típico | Prioridade DS |
|------|------------------------|----------------|---------------|
| `/` | `LandingPage` | Marketing / full-width | P2 (wave 2) |
| `/landing` | `LandingPage` | Idem | P2 |
| `/login` | `LoginPage` | Auth centrado | P1 |
| `/register` | `RegisterPage` | Auth centrado | P1 |
| `/register/:planType` | `RegisterWithPlanPage` | Auth / onboarding | P1 |
| `/forgot-password` | `ForgotPasswordPage` | Auth centrado | P1 |
| `/reset-password` | `ResetPasswordPage` | Auth centrado | P1 |

### 3.2 Produto principal (utilizador autenticado)

Rotas abaixo usam **`MainLayout`** + `Sidebar` (confirmado por imports nos respetivos ficheiros).

| Rota | Componente | Notas de produto | Prioridade DS |
|------|------------|------------------|---------------|
| `/dashboard` | `Index` (`pages/Index.tsx`) | Dashboard principal; widgets e gráficos | **P0** |
| `/transactions` | `TransactionsPage` | Listas, filtros, crud | P0 |
| `/expenses` | `ExpensesPage` | Inclui gráfico pizza Recharts | P0 |
| `/goals` | `GoalsPage` | Objetivos, cartões | P1 |
| `/reports` | `ReportsPage` | Relatórios | P1 |
| `/schedule` | `SchedulePage` | Agendamentos | P1 |
| `/categories` | `CategoriesPage` | Gestão de categorias | P1 |
| `/settings` | `SettingsPage` | Preferências | P1 |
| `/profile` | `ProfilePage` | Perfil; variantes admin/user | P1 |
| `/plans` | `PlansPage` | Planos | P1 |
| `/achievements` | `AchievementsPage` | Conquistas | P2 |

### 3.3 Checkout e pós-pagamento

| Rota | Componente | Prioridade DS |
|------|------------|---------------|
| `/checkout/:planType` | `CheckoutPage` | P1 |
| `/payment-success` | `PaymentSuccessPage` | P1 |
| `/thank-you` | `ThankYouPage` | P1 |

### 3.4 Admin (`AdminLayout` + `AdminRoute`)

Prefixo **`/admin`** (rotas aninhadas).

| Rota | Componente | Superfície | Prioridade DS |
|------|------------|-------------|---------------|
| `/admin` | redirect → `/admin/dashboard` | — | — |
| `/admin/dashboard` | `AdminDashboardPage` | KPIs, atividade, toggles | P1 (densidade) |
| `/admin/customers` | `AdminCustomersPage` | Tabelas | P1 |
| `/admin/analytics` | `AdminAnalyticsPage` | **Linhas + pizza + métricas** (Recharts) | P1 |
| `/admin/plans` | `AdminPlansPage` | Dados tabulares | P1 |
| `/admin/checkouts` | `AdminCheckoutsPage` | Dados / ações | P1 |
| `/admin/communications` | `AdminCommunicationsPage` | Comunicação | P2 |
| `/admin/content` | `AdminContentPage` | Conteúdo | P2 |
| `/admin/settings` | `AdminSettingsPage` | Configuração | P1 |
| `/admin/logs` | `AdminLogsPage` | Logs | P1 (densidade) |
| `/admin/audit` | `AdminAuditPage` | Auditoria | P1 |

### 3.5 Fallback

| Rota | Componente |
|------|------------|
| `*` | `NotFound` |

### 3.6 Ficheiros órfãos ou legacy (fora do router atual)

| Ficheiro | Nota |
|----------|------|
| ~~`src/pages/AdminDashboard.tsx`~~ | **Removido** (não estava em `App.tsx`; duplicava conceito de `admin/AdminDashboardPage`). |

---

## 4. Componentes e superfícies por área

### 4.1 Shell da aplicação

- `MainLayout`, `Sidebar`, `DashboardHeader`, `ThemeToggle`, `BrandLogo`.  
- **Objetivo DS:** sidebar mais “lista sobre fundo”, separadores hairline, item ativo com fundo suave (`accent`) em vez de múltiplos contornos.

### 4.2 Dashboard (`/dashboard`) — widgets alvo de repensar

Componentes atuais relevantes (`src/components/dashboard/`):

| Componente | Função hoje | Direção de redesign |
|------------|-------------|---------------------|
| `DashboardHeader` | Título, mês, ações | Hierarquia grande estilo “título de ecrã”; menos ruído |
| `DashboardStatCards` / `StatCards` | KPIs principais | **Widgets tipo cartão Apple:** número grande, label pequeno, tendência opcional sutil |
| `DashboardCharts` | Linhas + pizza (Recharts) | Ver secção 5; cores dos tokens; menos grade; tooltips discretos |
| `DashboardContent` | Orquestra lista + charts | Espaçamento consistente; eventual grid responsivo 12 colunas |
| `UpcomingExpensesAlert` | Alertas | Semântica `destructive` / warning única; não competir com KPI verde |

**Princípio:** no máximo **3–4 widgets primários** acima da dobra no mobile; secções subsequentes colapsáveis ou scroll natural.

### 4.3 Transações e listas

- `TransactionList`, `TransactionCard`, formulários e diálogos.  
- Alinhamento a tokens; ícones receita/despesa mantêm legibilidade sem novos hex.

### 4.4 Relatórios e despesas

- `ReportsPage`, `ExpensesPage` (gráfico pizza).  
- Mesmos padrões de **Chart** do DS (legenda, cores, altura mínima, empty state).

### 4.5 Admin

- Mesmo DS com **modo denso**: tabelas com padding compacto, fonte um passo menor opcional **via token de densidade**, não CSS aleatório.

---

## 5. Gráficos e visualização de dados (RTC — Recharts, tokens, consistência)

### 5.1 Stack

- **Recharts** é a biblioteca atual em `DashboardCharts`, `ExpensesPage`, `AdminAnalyticsPage`.  
- Existe **`src/components/ui/chart.tsx`** (padrão shadcn + Recharts) — **alvo:** novos gráficos e refactors usam `ChartContainer` + `ChartConfig` para injetar cores dos tokens.

### 5.2 Diretrizes visuais “Apple-like” para gráficos

| Tópico | Regra |
|--------|--------|
| Grade | `stroke-border/50` ou removida em gráficos pequenos |
| Eixos | Ticks discretos (`muted-foreground`); evitar chartjunk |
| Cores de série | `--chart-1` … ou pares income/expense derivados de primário + neutro |
| Tooltip | Fundo `card`, borda suave, tipografia `text-sm` |
| Altura | Mínimos por breakpoint; `aspect-video` só quando fizer sentido (shadcn default) |
| Dados sensíveis | Respeitar `hideValues` (mascarar como no resto do app) |

### 5.3 Roadmap técnico dos gráficos

1. **Definir** `ChartConfig` partilhado (ex. `lib/chart-theme.ts`) com cores HSL dos tokens.  
2. Refatorar **`DashboardCharts`** para usar `ChartContainer` onde não atrasar release.  
3. Alinhar **`ExpensesPage`** e **`AdminAnalyticsPage`** ao mesmo tema.  
4. Documentar **empty states** (“sem dados neste período”) com tipografia secundária.

---

## 6. Componentes do design system (catálogo mínimo v1)

### Must-have

- Botão (variantes + estados).  
- Input, Select, Checkbox, Switch.  
- Card (padding documentado).  
- Table + ScrollArea (admin).  
- Dialog / Sheet / Dropdown / Tabs / Toast.  
- **Chart** wrapper + Tooltip unificado.

### Nice-to-have v1.1

- Skeleton por tipo (lista, gráfico, cartão).  
- Empty state ilustrado leve (opcional).

---

## 7. Plano de entrega (fases atualizadas)

| Fase | Âmbito | Critério de conclusão |
|------|--------|------------------------|
| **A — Fundamentos** | Tokens `index.css`, Tailwind, remoção de overrides hex óbvios | Light/dark OK; verde marca aplicável em botões/cards |
| **B — Shell** | `MainLayout`, `Sidebar`, headers | Navegação coerente; foco visível |
| **C — Dashboard & widgets** | `DashboardStatCards`, `DashboardCharts`, `DashboardContent`, alertas | Widgets seguem grid e tokens; gráficos usam tema partilhado |
| **D — Dados & formulários** | Transações, categorias, formulário de transação | Sem novos hex; listas alinhadas |
| **E — Relatórios & despesas** | `ReportsPage`, `ExpensesPage` | Gráficos alinhados ao tema |
| **F — Admin** | `AdminAnalyticsPage`, tabelas críticas | Densidade compacta; charts consistentes |
| **G — Público & checkout** | Login, register, checkout, thank-you | Paridade de tokens |
| **H — Limpeza** | Remover `metacash-*` residual; legacy `AdminDashboard.tsx` | Checklist de rotas + QA |

As fases **A–H** são o mapa macro; o **plano de sprints** (secção seguinte) traduz isso em **passos executáveis** com ordem, dependências e “Definition of Done”.

---

## 8. Plano de sprints (visão clara e passo a passo)

### 8.1 Como ler este plano

| Conceito | Definição |
|----------|-----------|
| **Sprint** | Ciclo de trabalho com entrega incremental testável (duração sugerida: **1–2 semanas** por sprint; ajustar à equipa). |
| **Dependência** | Sprint N assume que N−1 cumpriu o critério de conclusão indicado. |
| **DoD (Definition of Done)** | Merge em `main`, `npm run build` OK, smoke nas rotas tocadas, capturas opcionais antes/depois. |

**Ordem recomendada:** respeitar a sequência **Sprint 1 → 8**; o **Sprint 9** é opcional (landing / polish).

---

### 8.2 Tabela resumo: sprints ↔ fases PRD

| Sprint | Nome | Fases PRD cobertas | Foco principal |
|--------|------|-------------------|----------------|
| **1** | Fundamentos & tokens | A | `index.css`, Tailwind, baseline light/dark |
| **2** | Shell de navegação | B | `MainLayout`, `Sidebar`, cabeçalhos |
| **3** | Dashboard — widgets & layout | C (parte 1) | KPI cards, `DashboardContent`, alertas |
| **4** | Dashboard & produto — gráficos | C (parte 2) + E (parcial) | `DashboardCharts`, tema charts, `ExpensesPage` |
| **5** | Dados núcleo — transações & categorias | D | Listas, cartões, formulários, diálogos |
| **6** | Relatórios, metas, agenda, definições | D–E | `ReportsPage`, `GoalsPage`, `SchedulePage`, `SettingsPage`, `ProfilePage`, `PlansPage` |
| **7** | Admin — densidade & analytics | F | Tabelas + `AdminAnalyticsPage` + rotas admin restantes |
| **8** | Auth, checkout & hardening | G + início H | Login/register/checkout; remover hex residual |
| **9** (opc.) | Landing wave 2 & limpeza final | H + wave 2 landing | `LandingPage`, legacy, auditoria final |

---

### 8.3 Sprint 1 — Fundamentos & tokens (Fase A)

**Objetivo:** uma única fonte de verdade visual para cor e neutros; modo escuro coerente.

| Passo | Ação | Saída |
|-------|------|--------|
| 1.1 | Auditar `src/index.css` (`:root`, `.dark`) e listar tokens a alterar | Checklist no PR ou doc curto |
| 1.2 | Refinar HSL do verde marca (`--primary`, derivados) mantendo identidade | Tokens atualizados |
| 1.3 | Substituir overrides locais mais graves (ex. `.hover\:bg-accent` hardcoded) por variáveis | Menos hex solto |
| 1.4 | Alinhar `tailwind.config.ts` (início deprecação `metacash-*`) | Comentário DEPRECATED + plano de uso |
| 1.5 | Definir esboço de tokens de gráfico (`chart-1`… ou income/expense) | Ficheiro ou secção em `lib/` |

**DoD:** Dashboard e login **sem regressão** de contraste; build verde; screenshot light/dark dos tokens aplicados a botão + card.

**Dependências:** nenhuma.

---

### 8.4 Sprint 2 — Shell de navegação (Fase B)

**Objetivo:** shell “Apple-like”: navegação calma, foco visível, hierarquia do título.

| Passo | Ação | Saída |
|-------|------|--------|
| 2.1 | `Sidebar`: estados ativo/hover com tokens; separadores discretos | Sidebar revisada |
| 2.2 | `MainLayout`: ritmo vertical e largura máxima consistentes | Layout base |
| 2.3 | `DashboardHeader` (se já tocado aqui): tipografia de título de ecrã | Header alinhado ao DS |
| 2.4 | `ThemeToggle` + foco em links | Acessibilidade básica OK |

**DoD:** Navegar entre 3 rotas principais sem “saltos” de estilo; teclado operacional na sidebar.

**Dependências:** Sprint 1.

---

### 8.5 Sprint 3 — Dashboard: widgets & composição (Fase C — parte 1)

**Objetivo:** KPIs e zona principal do dashboard com grid e cartões consistentes.

| Passo | Ação | Saída |
|-------|------|--------|
| 3.1 | `DashboardStatCards` / `StatCards`: hierarquia número > label; espaçamento único | Widgets KPI |
| 3.2 | `DashboardContent`: grid responsivo, espaçamento entre secções | Menos “blocos soltos” |
| 3.3 | `UpcomingExpensesAlert`: uma voz semântica (warning/destructive) | Alerta legível |
| 3.4 | Lista rápida / empty states no dashboard se existirem | Coerência tipográfica |

**DoD:** `/dashboard` mobile + desktop sem cores fora dos tokens; revisão visual aprovada.

**Dependências:** Sprints 1–2.

---

### 8.6 Sprint 4 — Gráficos: tema unificado + despesas (Fase C — parte 2 + E parcial)

**Objetivo:** Recharts alinhado ao DS; mesmo tema no dashboard e em despesas.

| Passo | Ação | Saída |
|-------|------|--------|
| 4.1 | Criar `ChartConfig` / helper de tema partilhado (cores dos tokens) | `lib/chart-theme.ts` (ou equivalente) |
| 4.2 | Refatorar `DashboardCharts` para usar wrapper shadcn `ChartContainer` onde viável | Gráficos dashboard |
| 4.3 | Alinhar `ExpensesPage` (pizza) ao mesmo tema | Despesas consistentes |
| 4.4 | Tooltips e eixos: `muted-foreground`, grades discretas | Menos chartjunk |

**DoD:** Tooltips e séries legíveis em light/dark; `hideValues` respeitado onde já existir.

**Dependências:** Sprints 1 e 3.

---

### 8.7 Sprint 5 — Transações & categorias (Fase D)

**Objetivo:** fluxo principal de dados (lista, edição, eliminação) 100% em tokens.

| Passo | Ação | Saída |
|-------|------|--------|
| 5.1 | `TransactionList` / `TransactionCard` / tabelas | Sem `metacash-*` novos |
| 5.2 | Formulário de transação + diálogos (`EditTransactionDialog`, etc.) | Estados foco/erro uniformes |
| 5.3 | `CategoriesPage` | Alinhamento cards/listas |

**DoD:** Fluxo criar/editar/apagar transação sem regressões; build OK.

**Dependências:** Sprints 1–2.

---

### 8.8 Sprint 6 — Relatórios, metas, agenda, perfil, planos (Fases D–E)

**Objetivo:** páginas P1 do produto com o mesmo ritmo visual.

| Passo | Ação | Saída |
|-------|------|--------|
| 6.1 | `ReportsPage` | Layout e tipografia DS |
| 6.2 | `GoalsPage`, `SchedulePage` | Cartões/listas coerentes |
| 6.3 | `SettingsPage`, `ProfilePage`, `PlansPage` | Formulários e secções alinhados |
| 6.4 | `AchievementsPage` | Paridade visual (P2 mas no mesmo sprint se capacity) |

**DoD:** Rotas listadas com smoke test manual; sem novos hex.

**Dependências:** Sprints 1–2; 5 opcional para consistência de forms.

---

### 8.9 Sprint 7 — Admin (Fase F)

**Objetivo:** densidade para dados; gráficos admin no mesmo tema que o app.

| Passo | Ação | Saída |
|-------|------|--------|
| 7.1 | Tokens ou classes de **densidade compacta** em tabelas | Admin legível |
| 7.2 | `AdminAnalyticsPage`: Recharts com tema Sprint 4 | Analytics consistente |
| 7.3 | Demais rotas admin (customers, plans, checkouts, …) | Paridade de cards/tabelas |
| 7.4 | `AdminLogsPage`, `AdminAuditPage` | Monoespaçador / densidade se aplicável |

**DoD:** `/admin/analytics` + uma tabela grande testadas em dark mode.

**Dependências:** Sprints 1, 4 (tema gráficos).

---

### 8.10 Sprint 8 — Auth, checkout & hardening (Fase G + início H)

**Objetivo:** superfícies públicas e pagamento alinhadas; começar remoção sistemática de legado.

| Passo | Ação | Saída |
|-------|------|--------|
| 8.1 | `LoginPage`, `RegisterPage`, `RegisterWithPlanPage`, forgot/reset | Auth coerente com DS |
| 8.2 | `CheckoutPage`, `PaymentSuccessPage`, `ThankYouPage` | Fluxo comercial alinhado |
| 8.3 | Início **H**: caça a hex residual em ficheiros já tocados | Lista de débito técnico |

**DoD:** Utilizador consegue register → checkout (staging) sem inconsistência visual gritante.

**Dependências:** Sprint 1.

---

### 8.11 Sprint 9 (opcional) — Landing wave 2 & limpeza final (Fase H + landing)

**Objetivo:** marketing opcional + fecho do débito técnico.

| Passo | Ação | Saída |
|-------|------|--------|
| 9.1 | `LandingPage` / `/landing` com tokens (hero, CTA) | Wave 2 landing |
| 9.2 | Remover ou integrar `pages/AdminDashboard.tsx` legacy | Menos confusão no repo |
| 9.3 | Auditoria final: `metacash-*`, hex, rotas do §3 | Relatório “DS complete” |

**DoD:** Checklist de todas as rotas do PRD §3 com ✅.

**Dependências:** idealmente Sprints 1–8 concluídos.

---

### 8.12 Diagrama de dependências (ordem mínima)

```text
S1 (tokens) ──┬──► S2 (shell) ──┬──► S3 (dashboard widgets)
              │                 │
              │                 └──► S5 (transações) ──► S6 (resto app)
              │
              └──► S4 (gráficos) ──┬──► S7 (admin)
                                   │
S8 (auth/checkout) depende de S1 (e idealmente S2)
S9 (opcional) depende do conjunto anterior
```

---

## 9. Métricas de sucesso

| Métrica | Alvo |
|---------|------|
| Cobertura de tokens | ≥90% dos ecrãs P0–P1 sem cor hex fora de `index.css` / chart theme |
| Gráficos | 100% dos gráficos principais (dashboard, despesas, admin analytics) no mesmo tema |
| Acessibilidade | Contraste AA em texto primário e estados de foco |
| Performance | Sem aumento relevante de bundle (manter Recharts shared chunk) |

---

## 10. Riscos

| Risco | Mitigação |
|-------|-----------|
| Refactor de charts quebra tooltips | QA manual por rota + dados de teste |
| Admin denso ilegível | Tokens de densidade + testes com utilizadores internos |
| Scope creep na landing | Wave 2 explícita |

---

## 11. Decisões de kickoff (mantidas)

### 11.1 Primário de marca

**Verde refinado** (HSL), continuidade da marca Contabiliza.

### 11.2 Display font

**Não** na v1 do app; landing wave 2 opcional.

### 11.3 Landing

**Wave 2** salvo exceção de negócio.

### 11.4 Admin

Mesmo DS + **densidade compacta** para tabelas e listagens longas.

*(Fundamentação detalhada HIG / NN/g / Rams / Material mantém-se válida; ver versões anteriores do histórico se necessário.)*

---

## 12. Referências internas ao repositório

| Área | Caminho |
|------|---------|
| Rotas | `src/App.tsx` |
| Tokens | `src/index.css` |
| Tailwind | `tailwind.config.ts` |
| UI / Chart | `src/components/ui/*`, especialmente `chart.tsx` |
| Dashboard | `src/components/dashboard/*` |
| Páginas | `src/pages/**` |

---

## 13. Histórico de versões

| Versão | Notas |
|--------|--------|
| 1.0 | PRD inicial |
| 1.1 | Decisões kickoff |
| 2.0 | Mapa completo de rotas; DS Apple-like + verde; widgets; gráficos; fases estendidas |
| 2.1 | Secção 8: plano de sprints (1–9), passos, DoD, dependências, diagrama |

---

**Aprovações:** Product ___ · Design ___ · Eng lead ___
