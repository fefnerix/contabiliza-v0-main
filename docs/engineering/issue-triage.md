# Triage de Issues

Este guia padroniza como priorizar e encaminhar bugs, tasks e features.

## Cadencia recomendada

- Triage rapido: diaria (10-15 min).
- Triage completo: semanal (30-45 min).

## Fluxo de triagem

1. Validar template e completude da issue.
2. Classificar tipo: `type:bug`, `type:feature`, `type:task`.
3. Definir prioridade: `P0`, `P1`, `P2`, `P3`.
4. Marcar status inicial: `status:triage` -> `status:ready` (ou `status:blocked`).
5. Atribuir responsavel e milestone (se houver).

## Matriz de prioridade

- `P0`: queda de producao, seguranca, perda/corrupcao de dados.
- `P1`: fluxo principal quebrado (login, dashboard, checkout, transacoes).
- `P2`: problema relevante com workaround.
- `P3`: melhoria incremental/documentacao.

## Estados sugeridos

- `status:triage`
- `status:ready`
- `status:in-progress`
- `status:blocked`
- `status:review`
- `status:done`

## Definicao de pronto para desenvolvimento

Uma issue esta `ready` quando tem:

- contexto suficiente;
- criterio de aceite claro;
- impacto/risco identificado;
- estrategia minima de validacao.

## Definicao de concluido

Uma issue so vai para `done` quando:

- PR mergeado com referencia da issue;
- validacao executada e registrada;
- documentacao atualizada (quando aplicavel).
