---
tags:
  - engenharia
  - frontend
  - rotas
---

# Rotas e Superficies

## Tabela principal de rotas

As rotas vivem em `src/App.tsx`.

- `/`: marketplace principal
- `/pulse`: vitrine editorial alternativa
- `/demo/glass-button`: demo visual isolada
- `/eventos/:slug`: detalhe do evento
- `/eventos/:slug/assentos`: mapa e selecao de assentos
- `/eventos/:slug/checkout`: checkout
- `/conta/acesso`: login, cadastro e Google login
- `/conta`: area do comprador
- `/organizador/meus-eventos`: painel do organizador
- `/produtor/meus-eventos`: alias da mesma superficie do organizador
- `/operacao`: backoffice da plataforma
- `/app`: shell da experiencia social/mobile
- `/app/amigos`
- `/app/tickets`
- `/app/mapa`
- `/app/perfil`
- `/app/bar`
- `/app/divisoes`

## Superficies publicas

### Home marketplace

- arquivo principal: `src/pages/Index.tsx`
- usa busca, rails, hero, cards e curadoria
- conversa com hooks de catalogo

### Pagina do evento

- arquivo principal: `src/pages/EventDetails.tsx`
- exibe hero, metadata, politicas, FAQ e entrada para o mapa/checkout
- depende de `use-catalog-event` e da separacao entre manifesto leve e geometria pesada

### Jornada de mapa e assentos

- arquivo principal: `src/pages/EventSeatExperience.tsx`
- shell modular em `src/components/seat-journey/`
- responsavel por pan/zoom, selecao, resumo e transicao para checkout

### Checkout

- arquivo principal: `src/pages/EventCheckout.tsx`
- trabalha com hold, buyer info, titulares, metodo de pagamento e criacao do pedido

## Superficies autenticadas

### Conta do comprador

- arquivo principal: `src/pages/AccountDashboard.tsx`
- agrega:
  - pedidos
  - pagamentos
  - tickets/wallet
  - notificacoes
  - suporte
  - atividade da conta

### Acesso da conta

- arquivo principal: `src/pages/AccountAccess.tsx`
- trabalha com registro, login, Google login e persistencia de sessao
- o provider fica em `src/hooks/auth-provider.tsx`

## Superficies operacionais

### Organizador / produtor

- arquivo principal: `src/pages/OrganizerEventsDashboard.tsx`
- componentes principais:
  - `OrganizerEventCard.tsx`
  - `OrganizerEventEditorDialog.tsx`
  - `OrganizerModuleCard.tsx`
  - `OrganizerPayoutInfoCard.tsx`
- consolida:
  - portfolio de eventos
  - publicacao/despublicacao
  - CRUD de evento
  - sinais comerciais
  - comunicacao
  - bloco inicial de repasse

### Backoffice

- arquivo principal: `src/pages/OperationsDashboard.tsx`
- focado em administracao da plataforma, nao no produtor
- lida com revisao manual, cancelamento e diagnosticos operacionais

## Vertentes e experimento social

### Pulse

- arquivo principal: `src/pages/PulseIndex.tsx`
- recorte editorial sobre o catalogo principal
- usa `marketplace-verticals.ts` para filtrar e recortar eventos

### Experiencia social/mobile

- shell: `src/components/social/SocialShell.tsx`
- paginas:
  - `SocialHome.tsx`
  - `FriendsPage.tsx`
  - `TicketsPage.tsx`
  - `MapPage.tsx`
  - `ProfilePage.tsx`
  - `BarPage.tsx`
  - `SplitsPage.tsx`
- helpers: `src/lib/social-backend.ts`
- status: experimental e acoplado ao catalogo/pedidos/tickets existentes

## Hooks que sustentam as superficies principais

- `use-catalog-events.tsx`
- `use-catalog-event.tsx`
- `use-event-runtime.tsx`
- `use-organizer-events.tsx`
- `use-backoffice-snapshot.tsx`
- `use-account-orders.tsx`
- `use-account-payments.tsx`
- `use-account-tickets.tsx`
- `use-account-notifications.tsx`
- `use-support-cases.tsx`

## Leitura operacional

Se a tarefa for de UX ou pagina, comece por:

1. `src/App.tsx`
2. a pagina em `src/pages`
3. o hook que abastece a pagina
4. a API em `src/server/api`
5. o fallback local ou o endpoint remoto correspondente
