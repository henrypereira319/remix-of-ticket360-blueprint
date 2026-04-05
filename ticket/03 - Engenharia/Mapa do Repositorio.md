---
tags:
  - engenharia
  - repositorio
---

# Mapa do Repositorio

## Pastas principais

- `src/`: app frontend React/Vite
- `src/components/`: componentes compartilhados, UI base e modulos por area
- `src/components/producer/`: cards e dialogos do painel do organizador
- `src/components/seat-journey/`: shell do mapa, checkout lateral e barra flutuante
- `src/components/social/`: experimento de camada social/mobile
- `src/pages/`: entrypoints principais da SPA
- `src/pages/social/`: paginas da experiencia social
- `src/hooks/`: hooks de leitura e sincronizacao das superficies principais
- `src/lib/`: utilitarios, auth local, social helpers, Google Maps e helpers de marketplace
- `src/data/`: seeds do catalogo, manifests e mocks sociais
- `src/server/`: camada local do app, com servicos baseados em `localStorage`
- `src/server/api/`: fronteira consumida pelo frontend para catalogo, organizer, orders, auth, support etc.
- `server/`: backend real em Node
- `server/http/`: servidor HTTP/BFF real
- `server/domain/`: dominios server-side reais
- `server/db/`: cliente e migracoes SQL
- `server/supabase/`: env e cliente admin do Supabase
- `docs/`: referencias, comparacoes e materiais brutos de importacao/benchmark
- `public/maps/`: geometria pesada de seatmaps
- `public/seatmaps/`: backgrounds SVG dos venues
- `public/media/`: videos e posters usados em superficies especificas
- `scripts/`: utilitarios, geradores, migracoes e smoke tests
- `ticket/`: vault Obsidian usado como memoria operacional

## Entradas mais importantes

- `src/main.tsx`: bootstrap React
- `src/App.tsx`: tabela real de rotas da SPA
- `server/http/app.mjs`: tabela real de endpoints HTTP
- `server/db/migrations/0001_ticketing_core.sql`: schema operacional principal
- `src/data/events.ts`: seed central do catalogo e mapa local

## Paginas de produto em `src/pages`

- `Index.tsx`: home marketplace
- `EventDetails.tsx`: detalhe do evento
- `EventSeatExperience.tsx`: jornada de mapa/assentos
- `EventCheckout.tsx`: checkout
- `AccountAccess.tsx`: login/cadastro
- `AccountDashboard.tsx`: conta, pedidos, wallet, notificacoes e suporte
- `OrganizerEventsDashboard.tsx`: painel do produtor
- `OperationsDashboard.tsx`: backoffice
- `PulseIndex.tsx`: vertical editorial alternativa

## Backend local do app em `src/server`

- `checkout.service.ts`: pedido local
- `payment.service.ts`: pagamento local
- `ticket.service.ts`: emissao local
- `seat-inventory.service.ts`: hold e disponibilidade local
- `organizer.service.ts`: snapshot local do painel do produtor
- `operations.service.ts`: snapshot local do backoffice
- `support.service.ts`: suporte local
- `analytics.service.ts`: eventos locais
- `notification.service.ts`: outbox local

## Backend real em `server/domain`

- `auth-backend.mjs`
- `account-backend.mjs`
- `catalog-backend.mjs`
- `catalog-view-backend.mjs`
- `ticketing-backend.mjs`
- `organizer-backend.mjs`
- `operations-backend.mjs`
- `support-backend.mjs`
- `helpers.mjs`

## Testes e validacao

- `src/test/`: testes Vitest de auth, checkout, organizer, backoffice e contratos de API
- `scripts/backend-http-smoke.mjs`: sobe o BFF e valida o fluxo HTTP ponta a ponta
- `scripts/backend-flow-smoke.mjs`: valida hold -> under_review -> approve -> issue e pix -> cancel no dominio real
- `playwright.config.ts`: preset base do Playwright/Lovable
- `Caddyfile`: fallback SPA e cache headers para deploy estatico

## Assets e referencias importantes

- `public/maps/teatro-municipal-geometry.json`
- `public/maps/teatro-bradesco-geometry.json`
- `public/seatmaps/teatro-municipal-background.svg`
- `public/seatmaps/teatro-bradesco-background.svg`
- `docs/event-details-comparison.md`
- `docs/theatro-municipal-seatmap-comparison.md`
- `docs/spec-importacao-mapa-bileto-sympla.md`

## Documentos chave

- `README.md`
- `roadmap.md`
- `checklist-roadmap.md`
- `progress.txt`

## Leitura recomendada por objetivo

### Entender o produto

- [[02 - Projeto/Visao Geral]]
- [[02 - Projeto/Estado Atual]]
- `docs/`

### Entender a execucao tecnica

- [[03 - Engenharia/Arquitetura]]
- [[03 - Engenharia/Rotas e Superficies]]
- [[03 - Engenharia/API, Fallback e Contratos]]
- [[03 - Engenharia/Testes e Deploy]]
- [[03 - Engenharia/Comandos]]
- `server/`
- `src/`

### Retomar o proximo bloco de trabalho

- [[04 - Operacao/Proximos Passos]]
- `progress.txt`
- `checklist-roadmap.md`
