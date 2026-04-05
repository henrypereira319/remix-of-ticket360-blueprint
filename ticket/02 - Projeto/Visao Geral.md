---
tags:
  - projeto
  - overview
---

# Visao Geral

## O que estamos construindo

Uma plataforma de venda de ingressos inspirada em Ticket360 e Sympla, com foco em:

- descoberta de eventos
- pagina de detalhe com mapa de assentos
- checkout com reserva temporaria
- emissao de tickets e wallet
- operacao e backoffice
- area de produtor e catalogo publico
- uma vertente social/mobile experimental para descoberta, feed e coordenacao de grupo

## Stack atual

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, shadcn-ui
- Estado e dados: React Query
- Backend atual: Node, Express, Supabase e Postgres
- Testes e suporte: Vitest, Playwright e scripts de smoke

## Objetivo de produto

Chegar a uma base confiavel para:

- catalogo publico de eventos
- compra com controle de estoque
- historico de conta entre dispositivos
- operacao interna para aprovacao, cancelamento e suporte
- evolucao futura para ambiente mais proximo de producao

## Superficies do produto no repo

- `/`: home marketplace principal
- `/eventos/:slug`: pagina de detalhe do evento
- `/eventos/:slug/assentos`: jornada de mapa e selecao de assentos
- `/eventos/:slug/checkout`: checkout da compra
- `/conta/acesso`: acesso de comprador
- `/conta`: pedidos, pagamentos, tickets, notificacoes e suporte
- `/organizador/meus-eventos` e `/produtor/meus-eventos`: painel do produtor
- `/operacao`: backoffice da plataforma
- `/pulse`: vitrine editorial alternativa
- `/app/*`: experiencia social/mobile experimental

## Direcao tecnica real

- o frontend preserva contratos de tela e usa uma camada propria de API em `src/server/api`
- quando `VITE_BACKEND_URL` esta configurada, a aplicacao tenta operar em modo remote-first
- quando o backend remoto falha ou nao existe, parte dos fluxos ainda usa fallback local em `src/server/*`
- a fundacao real do backend fica em `server/` com Express, dominios Node e Supabase/Postgres

## O que e importante nao esquecer

- `src/server/` nao e o backend HTTP real; e a camada local/fallback usada pelo app
- `server/` e o backend real com HTTP, dominio e banco
- `src/data/events.ts` continua sendo uma fonte importante de seeds, manifests e bootstrap de catalogo
- `public/maps` e `public/seatmaps` guardam a geometria pesada e os backgrounds dos mapas oficiais

## Fontes de contexto

- `../README.md`: stack e setup basico
- `../roadmap.md`: roadmap arquitetural completo
- `../progress.txt`: fotografia do estado real mais recente
- `../checklist-roadmap.md`: guia operacional de execucao
- [[03 - Engenharia/Arquitetura]]: como as camadas conversam
- [[03 - Engenharia/Rotas e Superficies]]: onde cada experiencia vive
- [[03 - Engenharia/API, Fallback e Contratos]]: como o frontend chega no backend
