# 🚀 Roadmap Definitivo: Clone Ticket360 & Sympla (Desktop & Mobile)

Este documento contém o escopo completo, arquitetura, modelagem de dados e todas as tarefas necessárias para construir uma plataforma de venda de ingressos massiva e escalável.

## 🏗️ 1. Arquitetura do Sistema

### 1.1. Frontend (Web & Mobile)
- **Frameworks:** React (Vite) para Desktop/Mobile Web, React Native (Expo) para os Apps Nativos (iOS/Android).
- **Estilização:** Tailwind CSS + Shadcn UI para componentes consistentes e design system robusto.
- **Gerenciamento de Estado:** Zustand (estado global conciso) e React Query (para cache e chamadas de API).
- **Comunicação:** Axios para REST APIs, WebSockets para atualizações de disponibilidade de ingressos em tempo real.
- **PWA (Progressive Web App):** Suporte offline básico e instalação na tela inicial.

### 1.2. Backend (APIs & Microserviços)
- **Linguagem/Framework:** Node.js com NestJS ou Express, Typescript obrigatório.
- **Microserviços:**
  - `User Service:` Autenticação, perfis e ACL (Access Control List).
  - `Event Service:` CRUD de eventos, upload de banners, categorias, busca facetada (Elasticsearch).
  - `Ticketing Service:` Motor de reservas de alta concorrência (com Redis para lock de lote de ingressos).
  - `Payment Service:` Integração com gateways (Stripe, Mercado Pago, PIX via Banco Central).
  - `Notification Service:` Push notifications, emails transacionais (AWS SES, Sendgrid) e SMS.
  - `Wallet/Ticket Service:` Geração de QR Codes dinâmicos com rotação de chaves para evitar fraudes/prints.

### 1.3. Banco de Dados & Infraestrutura
- **RDBMS (Principal):** PostgreSQL (Transações financeiras e relacionamentos fortes).
- **NoSQL:** MongoDB para logs, histórico de alterações de eventos e dados não estruturados de analytics.
- **Cache & Fila:** Redis (Filas de processamento com BullMQ, filas de espera VIP, sessões e rate limiting).
- **Mensageria:** Apache Kafka ou RabbitMQ para comunicação assíncrona entre microserviços (ex: `payment_succeeded` dispara emissão de ingresso).
- **Storage:** AWS S3 ou Cloudflare R2 para imagens, banners e mapas de assentos.

---

## 🗄️ 2. Modelagem de Dados (Schema Simplificado)

### `Users`
- `id` (UUID), `name`, `email`, `password_hash`, `cpf`, `phone`, `role` (ADMIN, PRODUCER, CUSTOMER), `created_at`, `updated_at`

### `Events`
- `id`, `producer_id`, `title`, `description`, `category_id`, `cover_image_url`, `status` (DRAFT, PUBLISHED, CANCELLED, SOLD_OUT), `start_date`, `end_date`, `location_id`, `is_online`, `stream_url`

### `Tickets_Batches` (Lotes de Ingressos)
- `id`, `event_id`, `name` (Ex: Lote 1 - Meia Entrada), `price`, `fee_percentage`, `total_quantity`, `available_quantity`, `start_sales_date`, `end_sales_date`

### `Orders`
- `id`, `user_id`, `total_amount`, `status` (PENDING, PAID, FAILED, REFUNDED), `payment_method`, `gateway_transaction_id`, `created_at`

### `Tickets`
- `id`, `order_id`, `batch_id`, `owner_user_id`, `qr_code_hash`, `status` (VALID, SCANNED, TRANSFERRED, CANCELLED), `scanned_at`

---

## 📋 3. Board de Tarefas (Kanban) - Épicos e Histórias

### Fase 1: Fundação & Autenticação (Sprints 1-2)
- [ ] **TSK-101:** Configurar repositório monorepo (Turborepo) com Frontend, Backend e pacotes compartilhados.
- [ ] **TSK-102:** Implementar Design System base com TailwindCSS (cores, tipografia, espaçamentos inspirados em ingressos premium).
- [ ] **TSK-103:** Criar componentes base (Button, Input, Modal, Toast, Skeleton, Dropdown).
- [ ] **TSK-104:** Modelagem e migrações iniciais do banco de dados (Prisma ORM ou TypeORM).
- [ ] **TSK-105:** API de Registro de Usuários (com validação de CPF e força de senha).
- [ ] **TSK-106:** API de Login (Emissão e Refresh de JWT).
- [ ] **TSK-107:** Tela de Login/Cadastro Responsiva (Mobile First).
- [ ] **TSK-108:** Fluxo de "Esqueci minha senha" (Envio de email com token).

### Fase 2: Gestão de Eventos para Produtores (Sprints 3-4)
- [ ] **TSK-201:** Dashboard do Produtor (Métricas base, layout lateral).
- [ ] **TSK-202:** Formulário multi-step para criação de evento (Detalhes gerais, data/hora, local).
- [ ] **TSK-203:** Integração com Google Maps API para busca de endereços (Autosuggest).
- [ ] **TSK-204:** Upload de imagens de capa e galeria com crop na vanguarda (Integração AWS S3).
- [ ] **TSK-205:** Criação e configuração de Lotes de Ingressos (Tipos, preços, limites por usuário).
- [ ] **TSK-206:** Mapa de assentos interativo (Se for o caso de teatro) utilizando Canvas/SVG.
- [ ] **TSK-207:** Listagem e gerenciamento de eventos criados.

### Fase 3: Loja - Descoberta e Vitrine (Sprints 5-6)
- [ ] **TSK-301:** Home Page: Banner Hero Carrossel (Destaques).
- [ ] **TSK-302:** Home Page: Seção "Eventos em alta", "Próximos em sua região" (Com geolocalização do browser).
- [ ] **TSK-303:** Componente Card de Evento (Data destada, título, local, preço inicial).
- [ ] **TSK-304:** Página de Busca Avançada (Filtros por categoria, data, preço, cidade).
- [ ] **TSK-305:** Página de Detalhes do Evento (Responsividade extrema, botão flutuante "Comprar" no mobile).
- [ ] **TSK-306:** Skeleton loading dinâmico para a Home e Detalhes.
- [ ] **TSK-307:** SEO Automático (Tags Open Graph, JSON-LD Schema de Evento para Google).

### Fase 4: Checkout e Pagamento (Missão Crítica) (Sprints 7-8)
- [ ] **TSK-401:** Lógica de Lock de Ingressos (Ao colocar no carrinho, reservar no Redis por 15 min).
- [ ] **TSK-402:** Fluxo do Carrinho (Resumo dos ingressos, tempo restante).
- [ ] **TSK-403:** Sistema de Taxa de Conveniência (Cálculo em tempo real).
- [ ] **TSK-404:** Integração PIX (QR Code Copy/Paste, verificação automática via Webhook).
- [ ] **TSK-405:** Integração Cartão de Crédito (Pagamento Transparente, 3DS Authentication).
- [ ] **TSK-406:** Tela de Sucesso de Compra.
- [ ] **TSK-407:** Prevenção de dupla cobrança (Idempotency Keys).

### Fase 5: Carteira (Wallet) e Uso dos Ingressos (Sprints 9-10)
- [ ] **TSK-501:** Área "Meus Ingressos" (Listagem paginada, filtros Ativos/Passados).
- [ ] **TSK-502:** Visualização do Ingresso (QR Code, Código de Barras).
- [ ] **TSK-503:** Sistema Antifraude Visual (QR Code dinâmico, animações na tela do ingresso ativo limitando printscreens).
- [ ] **TSK-504:** Transferência de titularidade de ingresso (Via email, geração de link único).
- [ ] **TSK-505:** Download de Ingresso em PDF (Para fallback offline).
- [ ] **TSK-506:** Integração com Apple Wallet e Google Wallet.

### Fase 6: Controle de Acesso (App Organizador) (Sprints 11-12)
- [ ] **TSK-601:** App para Staff/Portaria.
- [ ] **TSK-602:** Leitor de QR Code usando a câmera nativa de alta velocidade.
- [ ] **TSK-603:** Validação online/offline (Sincronização de base de boletos/entradas via SQLite no app).
- [ ] **TSK-604:** Tela de Status Rápido: Válido (Verde), Já Usado (Vermelho), Falso/Não Encontrado (Preto).
- [ ] **TSK-605:** Dashboard em tempo real do Organizador: Entraram X de Y.

## 📱 4. Requisitos de UI/UX (Concorrência direta com Sympla e Ticket360)

### 4.1 UI Desktop
- Header minimalista, barra de busca persistente gigante no topo.
- Modos Claro e Escuro bem definidos.
- Grelhas de cartões fluídas (CSS Grid) para fácil visualização.
- Páginas de pagamento com distrações mínimas (Layout de Checkout focado).

### 4.2 UI Mobile
- Bottom Navigation Bar no app/PWA.
- Drawer Lateral em vez de Navbar densa no topo.
- Thumbnails quadrados perfeitos ou 4:3 para aproveitar a tela pequena.
- Componentes touch-friendly (Tamanho mínimo dos botões: 48x48px).

---

## 🔒 5. Requisitos Não Funcionais & Segurança

1. **Escalabilidade:** O evento X do cantor Y vai causar picos. O sistema deve escalar os pods no Kubernetes baseado em gargalos na CPU ou na Fila do Redis.
2. **Rate Limiting:** Prevenção de Bots para scalping (compra massiva pra revenda) através de Cloudflare e Throttling no backend.
3. **PCI Compliance:** Nunca salvar CVV de cartão, usar tokens com as operadoras.
4. **LGPD:** Exclusão total de conta (e anonimização de dados de compra histórica).
5. **Observabilidade:** Logs centralizados no Datadog/Sentry para caçar erros na conversão de checkout.

---

*(Nota: Este é um documento arquitetural e de roadmap tático focado na construção da plataforma, cobrindo o ciclo ponta-a-ponta, inspirado nas melhores práticas de sistemas de alta concorrência como Sympla e Ticket360).*
