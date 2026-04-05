---
tags:
  - engenharia
  - arquitetura
---

# Arquitetura

## Camadas principais

1. SPA React/Vite em `src/` com rotas publicas, conta, produtor, operacao e uma camada social.
2. Camada de API do app em `src/server/api/` que preserva contratos de consumo do frontend.
3. Servicos locais em `src/server/*.service.ts` que seguram fallback e simulacao local.
4. Backend HTTP real em `server/http/app.mjs`.
5. Dominios server-side em `server/domain/*.mjs`.
6. Persistencia em Supabase/Postgres via `server/db` e `server/supabase`.

## Fluxo de alto nivel

```text
UI React
  -> hooks
    -> src/server/api
      -> backend HTTP real quando VITE_BACKEND_URL existe
      -> servicos locais/fallback quando o backend nao responde
        -> localStorage no browser

backend HTTP real
  -> server/domain
    -> server/db + Supabase/Postgres
```

## Ponto de entrada do frontend

- `src/main.tsx` sobe o app React
- `src/App.tsx` concentra o roteamento
- o app lazy-loada conta, checkout, detalhe, mapa, organizador, operacao e verticais sociais
- `AuthProvider` trabalha em modo remote-first, mas ainda cai para fluxo local se o backend nao estiver disponivel

## Fronteira do app

- `src/server/api/*.api.ts` e a fronteira usada pelos hooks e paginas
- essa camada tenta primeiro o backend remoto quando `VITE_BACKEND_URL` existe
- se a chamada remota falha, parte dos modulos ainda usa fallback local
- exemplos:
  - catalogo: `src/server/api/catalog.api.ts`
  - organizer: `src/server/api/organizer.api.ts`
  - orders: `src/server/api/orders.api.ts`
  - auth: `src/server/api/auth.api.ts`

## Servicos locais e fallback

- `src/server/storage.ts` encapsula `localStorage` e o canal de mutacao `eventhub:storage-mutation`
- `src/server/checkout.service.ts`, `payment.service.ts`, `ticket.service.ts`, `notification.service.ts` e afins simulam o ciclo local
- isso ainda e importante para testes locais, fallback e partes do produto nao 100% migradas

## Backend HTTP real

- `server/http/app.mjs` expoe os endpoints principais do produto
- `server/http/serve.mjs` sobe o servidor carregando `.env.local` e `.env`
- o backend ja cobre:
  - auth
  - catalogo
  - runtime event hydration
  - holds
  - orders
  - account reads
  - support
  - organizer
  - backoffice

## Dominios server-side reais

- `catalog-backend.mjs`: upsert e sincronizacao de venue, evento, sessao, setor e assento
- `catalog-view-backend.mjs`: leitura publica e runtime para o catalogo
- `ticketing-backend.mjs`: hold, criacao de pedido, pagamento, aprovacao, cancelamento e emissao
- `organizer-backend.mjs`: snapshot do produtor, CRUD/publicacao/arquivo de eventos
- `operations-backend.mjs`: snapshot e acoes sensiveis do backoffice
- `auth-backend.mjs` e `account-backend.mjs`: autenticacao e leituras da conta
- `support-backend.mjs`: abertura e listagem de casos de suporte

## Persistencia real

- `server/db/migrations/0001_ticketing_core.sql` cria enums, tabelas operacionais e RLS basica
- `0003_support_cases.sql` adiciona suporte
- `0004_customer_accounts.sql` adiciona a base de conta remota
- entidades centrais:
  - profiles
  - venues
  - events
  - event_sessions
  - event_sections
  - event_seats
  - seat_holds
  - orders
  - order_items
  - payments
  - tickets
  - notifications
  - analytics_events
  - audit_log

## Norte tecnico

- manter contratos estaveis entre UI e backend
- mover regras criticas para o servidor
- tratar o frontend local como fallback, nao como fonte principal
- preservar a experiencia atual enquanto a persistencia migra

## Tensao arquitetural atual

- a direcao certa ja esta definida: backend real como fonte primaria
- o principal risco restante e a coexistencia entre seed local, fallback local e persistencia remota
- qualquer trabalho novo deveria responder duas perguntas:
  - o dominio ja existe no backend real?
  - o frontend ainda esta lendo do lugar certo ou so do fallback?
