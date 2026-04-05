---
tags:
  - engenharia
  - testes
  - deploy
---

# Testes e Deploy

## Stack de validacao

- Vitest para testes de unidade, integracao local e contratos da camada do app
- scripts Node para smoke do backend HTTP e do dominio real
- Playwright configurado, mas ainda sem suite forte de regressao publicada no repo
- checagem de sincronismo entre codigo e vault via `obsidian:check`

## Testes em `src/test`

- `auth.test.ts`: auth local/remota
- `account-center.test.ts`: leituras e agregacao da conta
- `checkout-backend.test.ts`: hold, order, payment, ticket, cancelamento e analytics locais
- `backend-api-contracts.test.ts`: contratos da camada `src/server/api`
- `operations-backoffice.test.ts`: backoffice local
- `organizer-dashboard.test.ts`: snapshot do painel do produtor
- `ticketing.test.tsx`: fluxo de ticketing/render
- `example.test.ts`: placeholder/base
- `setup.ts`: bootstrap de ambiente de teste

## Smokes mais importantes

### `npm run backend:http:smoke`

Arquivo: `scripts/backend-http-smoke.mjs`

Valida:

- subida do backend HTTP em porta efemera
- healthcheck
- auth register/login/logout
- profile read/update
- catalog publication/search/runtime
- hold remoto
- snapshot do organizer
- CRUD/publicacao/arquivo do organizer
- criacao de order via BFF
- abertura de suporte
- leituras da conta
- snapshot do backoffice

### `npm run backend:flow:smoke`

Arquivo: `scripts/backend-flow-smoke.mjs`

Valida no dominio real:

- criacao de venue/event/session/sections/seats
- hold real
- fluxo corporate `under_review -> approve -> issue`
- fluxo pix `authorized -> cancel -> refund`

## Banco e migracoes

- `npm run db:migrate`: aplica `server/db/migrations`
- `npm run postgres:smoke`: verifica conexao Postgres
- `npm run supabase:smoke`: verifica acesso Supabase
- `npm run postgres:inspect`: ajuda a inspecionar o banco

## Deploy estatico

O deploy estatico esta descrito por `Caddyfile`.

### O que ele faz

- serve `dist/` como raiz
- aplica compressao
- marca assets hashados, mapas e seatmaps como cache imutavel
- marca o app shell como `no-cache`
- faz fallback SPA para `index.html`

### Consequencia pratica

- rotas client-side funcionam no deploy estatico
- assets pesados de mapas podem ficar cacheados agressivamente
- a chance de mismatch entre `index.html` e assets novos e reduzida

## Variaveis de ambiente relevantes

- frontend:
  - `VITE_BACKEND_URL`
  - `VITE_GOOGLE_MAPS_API_KEY`
  - `VITE_GOOGLE_OAUTH_ENABLED`
  - `VITE_GOOGLE_OAUTH_CLIENT_ID`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- backend:
  - `GOOGLE_OAUTH_CLIENT_ID`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_DB_URL`

## O que ainda esta fraco em QA

- smoke desktop/mobile de verdade nao estao institucionalizados
- nao ha suite forte de acessibilidade
- nao ha regressao visual estruturada
- o Playwright existe mais como ponto de partida do que como cobertura operacional madura

## Sequencia curta de validacao para mudancas grandes

1. `npm run test`
2. `npm run build`
3. `npm run backend:http:smoke`
4. `npm run backend:flow:smoke`
5. `npm run obsidian:check`

## Nota operacional

Se `node_modules` nao estiver instalado, `vite` e `vitest` nao vao resolver. Em ambiente novo, instalar dependencias e confirmar `.env` antes de concluir que o problema e do codigo.
