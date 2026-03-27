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

## Seatmaps e utilitarios

- `npm run generate:teatro-municipal`: gera seatmap
- `npm run export:seatmaps`: exporta seatmaps
- `npm run postgres:inspect`: inspeciona banco

## Assistentes locais

- `npm run eni`
- `npm run eni:flash`
- `npm run eni:auto`
- `npm run eni:pro`
- `npm run gemini:cli`

## Observacao

O projeto mistura fluxo local e fluxo remote-first. Sempre confirme se a tela em questao esta consumindo backend real ou fallback local antes de depurar.
