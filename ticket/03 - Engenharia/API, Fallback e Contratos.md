---
tags:
  - engenharia
  - api
  - backend
---

# API, Fallback e Contratos

## Ideia central

O frontend nao conversa diretamente com `server/domain`. Ele passa por uma fronteira propria em `src/server/api`.

Essa fronteira tem tres papeis:

1. manter contratos estaveis para as telas
2. tentar o backend remoto quando `VITE_BACKEND_URL` existir
3. cair em fallback local quando o backend remoto falhar ou nao estiver configurado

## Chave de modo remoto

- `src/lib/backend-http.ts` centraliza `VITE_BACKEND_URL`
- quando a URL existe, `requestBackendJson` fala com o BFF
- quando nao existe, o app volta para as implementacoes locais em `src/server/*.service.ts`

## Fronteira do app em `src/server/api`

- `auth.api.ts`: register, login, Google login, logout, profile
- `catalog.api.ts`: listagem, detalhe, runtime e busca do catalogo
- `inventory.api.ts`: holds e release
- `orders.api.ts`: criacao e listagens de pedidos
- `payments.api.ts`: leitura de pagamentos
- `tickets.api.ts`: leitura de tickets
- `notifications.api.ts`: leitura de notificacoes
- `support.api.ts`: abertura e listagem de casos
- `organizer.api.ts`: snapshot, CRUD, publish/unpublish/archive
- `operations.api.ts`: snapshot e acoes do backoffice
- `analytics.api.ts`: leitura dos eventos operacionais

## Camada local/fallback

`src/server/` ainda segura parte importante do comportamento local:

- `storage.ts`: leitura/escrita em `localStorage`
- `checkout.service.ts`: cria pedido local e aciona pagamento/notificacao/ticket
- `payment.service.ts`: simula pix, card e corporate
- `seat-inventory.service.ts`: hold, reserva e venda local
- `ticket.service.ts`: emissao, cancelamento, wallet e QR
- `notification.service.ts`: outbox local
- `analytics.service.ts`: eventos de negocio locais
- `organizer.service.ts`: snapshot local do painel do produtor
- `operations.service.ts`: snapshot local do backoffice

## Backend HTTP real

O BFF real fica em `server/http/app.mjs`.

### Rotas principais expostas

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `GET /api/backoffice`
- `POST /api/organizer/snapshot`
- `GET /api/organizer/events/:eventSlug/editor`
- `POST /api/organizer/events`
- `PUT /api/organizer/events/:eventSlug`
- `POST /api/organizer/events/:eventSlug/publish`
- `POST /api/organizer/events/:eventSlug/unpublish`
- `POST /api/organizer/events/:eventSlug/archive`
- `GET /api/catalog/events`
- `GET /api/catalog/events/:eventSlug`
- `POST /api/catalog/events/:eventSlug/runtime`
- `POST /api/catalog/runtime-event`
- `POST /api/catalog/publication-state`
- `POST /api/catalog/search`
- `POST /api/inventory/holds`
- `POST /api/inventory/holds/:holdToken/release`
- `POST /api/orders`
- `GET /api/accounts/:accountId/profile`
- `PUT /api/accounts/:accountId/profile`
- `GET /api/accounts/:accountId/orders`
- `GET /api/accounts/:accountId/payments`
- `GET /api/accounts/:accountId/tickets`
- `GET /api/accounts/:accountId/notifications`
- `GET /api/accounts/:accountId/support-cases`
- `POST /api/support/cases`
- `POST /api/backoffice/orders/:orderId/approve`
- `POST /api/backoffice/orders/:orderId/deny`
- `POST /api/backoffice/orders/:orderId/cancel`

## Dominios reais por endpoint

- catalogo: `catalog-backend.mjs` + `catalog-view-backend.mjs`
- ticketing: `ticketing-backend.mjs`
- organizer: `organizer-backend.mjs`
- operations: `operations-backend.mjs`
- auth/account: `auth-backend.mjs` + `account-backend.mjs`
- support: `support-backend.mjs`

## Bootstrap remoto ainda importante

O catalogo remoto ainda usa seeds locais como bootstrap em alguns fluxos:

- `src/server/api/catalog.api.ts` envia snapshots dos eventos seed para sincronizar publication state e busca
- `src/server/api/organizer.api.ts` tambem usa snapshots locais para sincronizacao inicial

Isso significa:

- o backend real ja existe
- mas a aplicacao ainda depende de bootstrap local em partes do catalogo e do organizer

## Riscos arquiteturais atuais

- coexistencia de seed local e estado remoto
- fallback silencioso escondendo falha do backend
- auth local ainda sobrevivendo como plano B
- parte do inventario e dos snapshots ainda misturando fonte local com remota

## Como depurar qualquer fluxo

1. ver qual pagina chama qual hook
2. ver qual hook chama qual arquivo em `src/server/api`
3. confirmar se `VITE_BACKEND_URL` esta ativo
4. identificar se a execucao caiu no backend remoto ou no fallback local
5. se for remoto, seguir em `server/http/app.mjs` e no dominio correspondente
6. se for local, seguir no servico de `src/server/*.service.ts`
