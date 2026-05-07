# Guia de Contribuicao

Este documento define o fluxo minimo para contribuicoes tecnicas no projeto.

## Objetivo

- Registrar bugs e melhorias com contexto suficiente para reproducao.
- Manter PRs pequenas, testaveis e rastreaveis.
- Priorizar backlog com criterios claros.

## Fluxo de trabalho

1. Abra uma issue usando um template em `.github/ISSUE_TEMPLATE`.
2. Classifique com labels (tipo, prioridade, status).
3. Crie branch a partir da issue:
   - `bugfix/<id-curto>`
   - `feature/<id-curto>`
   - `chore/<id-curto>`
4. Implemente mudancas pequenas e focadas.
5. Rode verificacoes locais antes do PR:
   - `npm run lint`
   - `npm run build`
6. Abra PR usando `.github/pull_request_template.md`.
7. Vincule a issue no PR (`Closes #123`).

## Convencoes de issue

- Use o template correto (bug, feature, task).
- Preencha impacto, severidade e passos de validacao.
- Se for bug, inclua:
  - ambiente
  - comportamento esperado x atual
  - passos para reproduzir

## Convencoes de pull request

- Um objetivo por PR.
- Inclua plano de teste claro e reproduzivel.
- Evite misturar refactor grande com correcao critica.
- Referencie migracoes/edge functions quando houver impacto no Supabase.

## Politica de prioridade

- `P0`: bloqueio de producao, seguranca, perda de dados.
- `P1`: funcionalidade principal quebrada sem workaround aceitavel.
- `P2`: degradacao moderada, workaround disponivel.
- `P3`: melhoria de qualidade/documentacao.

## Definicao de pronto (DoD)

Uma issue so pode ser encerrada quando:

- criterio de aceite atendido;
- validacao manual executada;
- lint/build passando;
- docs atualizadas se houve mudanca de comportamento;
- PR revisado e mergeado.
