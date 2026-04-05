---
tags:
  - engenharia
  - comandos
---

# Comandos

## Basicos

- `npm run dev`: sobe o frontend
- `npm run build`: build de producao
- `npm run test`: roda testes Vitest
- `npm run lint`: roda ESLint

## Backend e banco

- `npm run backend:serve`: sobe o backend HTTP
- `npm run db:migrate`: aplica migracoes
- `npm run postgres:smoke`: verifica Postgres
- `npm run supabase:smoke`: verifica Supabase
- `npm run backend:http:smoke`: smoke do backend HTTP
- `npm run backend:flow:smoke`: fluxo fim a fim do backend

## Variaveis e runtime

- `VITE_BACKEND_URL`: liga o frontend ao backend HTTP real
- `VITE_GOOGLE_MAPS_API_KEY`: habilita mapas Google onde a UI precisar
- `VITE_GOOGLE_OAUTH_ENABLED` e `VITE_GOOGLE_OAUTH_CLIENT_ID`: login Google no frontend
- `GOOGLE_OAUTH_CLIENT_ID`: validacao do lado servidor para auth Google
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL`: backend real e migracoes
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`: cliente Supabase no frontend
- `.env.example`: referencia principal das variaveis

## Scripts de engenharia

- `node server/http/serve.mjs`: sobe o BFF fora do wrapper do npm
- `node scripts/db-migrate.mjs`: runner de migracoes SQL
- `node scripts/check-obsidian-sync.mjs`: valida a regra de documentacao acoplada ao vault

## Seatmaps e utilitarios

- `npm run generate:teatro-municipal`: gera seatmap
- `npm run export:seatmaps`: exporta seatmaps
- `npm run postgres:inspect`: inspeciona banco
- `npm run import:bradesco`: importa snapshot do Teatro Bradesco
- `scripts/extract-svg.mjs` e `scripts/generate_svg.py`: utilitarios de pipeline grafico

## Assistentes locais

- `npm run eni`
- `npm run eni:flash`
- `npm run eni:auto`
- `npm run eni:pro`
- `npm run gemini:cli`

## Vault Obsidian

- o plugin comunitario `obsidian-git` foi instalado em `ticket/.obsidian/plugins/obsidian-git`
- o vault ja habilita `obsidian-git` via `ticket/.obsidian/community-plugins.json`
- a instalacao atual serve para diff, historico e operacao Git dentro do Obsidian
- automacao agressiva de commit, pull ou push nao foi preconfigurada no repo para nao quebrar o acoplamento entre codigo e documentacao no mesmo commit

## Observacao

O projeto mistura fluxo local e fluxo remote-first. Sempre confirme se a tela em questao esta consumindo backend real ou fallback local antes de depurar.
