# Checklist operacional derivado de `rodamap-definitivo.md`

## Acordo de uso

- Este arquivo passa a ser a referência operacional do projeto.
- Cada avanço relevante deve refletir aqui e em `progress.txt`.
- Só marque como concluído o que estiver implementado, validado e observável no produto ou no backend local.
- Não marque como concluído o que ainda depende de backend real, provedor real ou operação real, quando isso for parte essencial do item.

## Guardrails obrigatórios

- [x] Toda feature crítica de compra deve ter contrato claro entre frontend e backend.
- [ ] Nenhuma etapa crítica deve depender de dado sintético quando o domínio já existir no backend.
- [ ] Todo fluxo importante deve ter estados `idle`, `loading`, `success`, `empty`, `timeout`, `retryable error` e `hard failure`.
- [x] Desktop e mobile devem ser tratados como produtos completos, não como adaptação tardia.
- [ ] Todo slice deve prever analytics, observabilidade, QA e rollback antes de rollout amplo.
- [x] Toda regra de negócio sensível deve estar explícita no servidor, nunca escondida apenas no client.
- [ ] Todo item com impacto comercial deve ter critério de aceite mensurável.

## Fase A — Paridade de descoberta, evento e checkout

### 1. Descoberta e navegação global

- [x] Header global com busca, categorias, cidades e acesso rápido para comprador.
- [x] Header mobile com drawer, busca funcional e CTA persistente.
- [x] Navegação com taxonomia consistente entre home, listagem, detalhe e busca.
- [ ] Curadoria e coleções orientadas por cidade, categoria, popularidade e contexto.
- [ ] Preferências de localidade e cidade persistidas no produto.
- [ ] Busca global com contrato de backend próprio.
- [x] Sugestões, autocomplete e zero-results com qualidade comercial.
- [ ] Telemetria de CTR no header, uso de busca e profundidade de navegação.

### 2. Home marketplace

- [x] Home com hero, descoberta por categorias, trilhos e coleções.
- [x] Trilhos orientados a comportamento, localidade e afinidade.
- [x] Cards de evento com metadata útil, prova social e CTA forte.
- [x] Estrutura coerente com benchmark desktop.
- [x] Estrutura coerente com benchmark mobile.
- [ ] Skeletons e estados vazios de home.
- [ ] Feed de campanhas, banners e destaques controlado por configuração.
- [x] Performance da home dentro de orçamento de payload.

### 3. Busca, filtros e listagens

- [ ] Busca por termo, cidade, categoria, período e venue.
- [ ] Filtros persistentes e compartilháveis via URL.
- [ ] Ordenação por relevância, data, preço e popularidade.
- [x] Zero result com sugestões reais.
- [ ] Resultados paginados ou com infinite loading consistente.
- [ ] Telemetria de uso de filtro e refinamento.
- [ ] Contrato de backend para indexação e busca.

### 4. Página do evento

- [x] Hero do evento com arte, data, venue, cidade e CTA forte.
- [x] Bloco de compra sticky no desktop.
- [ ] Bloco de compra mobile com CTA persistente.
- [x] Descrição, regras, políticas e FAQs visíveis.
- [x] Transparência de taxas e preços.
- [ ] Sessões, datas e lotes apresentados com clareza.
- [x] Setores e disponibilidade por setor.
- [x] PDP consome manifesto leve do mapa sem depender da geometria pesada para renderizar.
- [ ] Telemetria de CTR em CTA principal e scroll de PDP.

### 5. Jornada de assentos

- [x] Mapa responsivo em desktop.
- [x] Mapa responsivo em mobile.
- [x] Geometria pesada carregada sob demanda.
- [x] Assentos separados de disponibilidade/inventário.
- [x] Fundo vetorial pesado externalizado como asset estático separado da geometria clicável e renderizado em camada própria no mapa.
- [x] Exportação do fundo vetorial em SVG válido, sem entidades HTML que corrompam o asset externo.
- [x] Fundo do Teatro Municipal recomposto a partir do SVG original preservando palco, áreas setoriais e legendas, sem hotspots de assentos no asset estático.
- [x] Performance de pan, zoom e clique aceitável em venues pesados.
- [x] Estados de assento: disponível, reservado, vendido, acessível.
- [x] Resumo de seleção sem poluir a leitura do mapa.
- [ ] Foco e acessibilidade para navegação por teclado.
- [x] Inventário sincronizado em runtime.
- [x] Segurança para impedir dupla compra do mesmo assento.

### 6. Checkout

- [x] Comprador, titulares e resumo do pedido.
- [x] Taxas e total claramente exibidos.
- [x] Checkout funcional em desktop.
- [x] Checkout funcional em mobile.
- [x] Estados de pagamento por método.
- [x] Pedido não pode ser criado com assento inconsistente.
- [x] Volta para o mapa preservando seleção.
- [ ] Telemetria de abandono do checkout.
- [x] Erros de validação com UX clara.

## Fase B — Conta, wallet, pós-compra e suporte

### 7. Conta e autenticação

- [x] Área da conta com perfil, pedidos e ingressos.
- [x] Login/cadastro consistente com jornada de compra.
- [x] Sessão persistente e segura.
- [x] Atualização de perfil refletindo nas áreas da conta.
- [x] Vínculo entre conta e pedidos.
- [x] Registro de atividade da conta.

### 8. Meus pedidos

- [x] Lista de pedidos com status real.
- [ ] Filtro por status.
- [ ] Detalhe do pedido com itens, setores, pagamento e logs principais.
- [x] Status de revisão, aprovado, cancelado e afins.
- [ ] Histórico confiável entre devices.

### 9. Meus ingressos / wallet

- [x] Lista de tickets emitidos.
- [x] QR/barcode por ticket.
- [x] Wallet/pass data por ingresso.
- [x] Status do ticket: emitido, usado, cancelado.
- [x] Ingresso vinculado ao pedido certo.
- [x] Estados claros quando ticket ainda não foi emitido.

### 10. Notificações e comunicação

- [x] Confirmação de pedido.
- [x] Confirmação de emissão de ticket.
- [x] Comunicação de pagamento em revisão.
- [x] Comunicação de cancelamento/reembolso.
- [x] Outbox com rastreabilidade.
- [x] Templates por tipo de evento de negócio.

### 11. Suporte e autosserviço

- [ ] FAQs por evento e por checkout.
- [ ] Central de ajuda / support surface.
- [ ] Trilhas de autoatendimento para pedido, pagamento e ingresso.
- [ ] Base para abrir solicitação de suporte.
- [ ] Logs mínimos para investigação.

## Fase C — Backend real, produtor e operação

### 12. Domínios de backend

- [x] Domínio de identidade/autenticação.
- [ ] Domínio de catálogo de eventos.
- [x] Domínio de inventário de assentos e setores.
- [x] Domínio de pedidos.
- [x] Domínio de pagamentos.
- [x] Domínio de tickets.
- [x] Domínio de notificações.
- [ ] Domínio de suporte.
- [x] Domínio de analytics operacional.
- [x] Fronteira de API local separando consumo do frontend e regras internas por domínio.

### 13. Inventário

- [x] Hold temporário com expiração.
- [x] Reserva de revisão manual.
- [x] Confirmação de venda.
- [x] Liberação de assento em cancelamento.
- [x] Snapshot de disponibilidade por evento.
- [x] Regras de concorrência contra dupla compra.

### 14. Pagamentos

- [x] Orquestração de pagamento separada do pedido.
- [x] Pix com expiração.
- [x] Cartão com autorização.
- [x] Fluxo corporativo/manual em revisão.
- [x] Refund/cancelamento.
- [ ] Reconciliação.
- [ ] Estrutura pronta para antifraude.
- [x] Logs e status financeiros consistentes.

### 15. Pedidos

- [x] Criação de pedido.
- [x] Status submitted / under_review / approved / cancelled.
- [x] Ligação com pagamento.
- [x] Ligação com inventário.
- [x] Ligação com tickets.
- [x] Ligação com notificações.
- [ ] Trilhas de auditoria.

### 16. Emissão de tickets

- [x] Emissão condicionada a pagamento ou aprovação.
- [x] Cancelamento de tickets.
- [x] QR/barcode e payloads estáveis.
- [x] Vínculo com comprador/titular.
- [ ] Estrutura para validação futura na portaria.

### 17. Backoffice / operação

- [x] Backoffice para revisar pedidos.
- [x] Aprovar ou negar pedidos corporativos.
- [x] Cancelar pedidos.
- [x] Consultar pagamentos.
- [x] Consultar tickets.
- [x] Consultar notificações.
- [x] Consultar trilha de analytics operacional.
- [ ] Runbooks de operação.

### 18. Produtor / administração de eventos

- [ ] CRUD de eventos real.
- [ ] Publicação / despublicação.
- [ ] Gerenciamento de venues e mapas.
- [ ] Regras de lote, taxa e políticas.
- [ ] Configuração de disponibilidade e sessões.
- [ ] Papéis e permissões.

## Fase D — Crescimento, plataforma e confiabilidade

### 19. SEO e discoverability

- [ ] Metadata de evento.
- [ ] Schema de evento.
- [ ] Canonical.
- [ ] Indexabilidade de páginas importantes.
- [ ] Páginas por cidade/categoria.
- [ ] Long-tail pages.

### 20. SSR / edge / caching

- [ ] Estratégia de SSR ou híbrida.
- [ ] Cache de HTML.
- [ ] Cache de APIs.
- [ ] Stale-while-revalidate quando fizer sentido.
- [x] Code splitting por rota.
- [x] Servidor estático explícito com fallback SPA e cache control para assets com hash.
- [ ] Política de imagens.

### 21. Analytics e BI

- [ ] Eventos de descoberta.
- [ ] Eventos de PDP.
- [ ] Eventos de mapa e seleção.
- [ ] Eventos de checkout.
- [x] Eventos de pagamento.
- [x] Eventos de emissão e cancelamento.
- [ ] Funil de compra.
- [ ] Baseline e comparação por experimento.

### 22. Observabilidade e confiabilidade

- [ ] Logs estruturados.
- [ ] Traces em fluxos críticos.
- [ ] Métricas por domínio.
- [ ] Alertas para falhas de compra.
- [ ] Alertas para drift de schema.
- [ ] Alertas para regressão de performance.
- [ ] SLOs de UX e de API.

### 23. Segurança e compliance

- [ ] Hardening de auth.
- [ ] PII protegida e mascarada.
- [ ] Rate limiting.
- [ ] Auditoria de operação sensível.
- [ ] Ownership claro de pedido/ticket.
- [ ] Consentimento e política de dados.
- [ ] Estrutura para antifraude e chargeback.

### 24. QA, rollout e experimentação

- [ ] Smoke tests desktop.
- [ ] Smoke tests mobile.
- [x] Testes de contrato.
- [ ] Testes de regressão visual.
- [ ] Testes de acessibilidade.
- [ ] Testes cross-browser.
- [ ] Rollout por feature flag.
- [ ] Plano de rollback.
- [ ] Shadow mode / beta interna quando necessário.
- [ ] Runbook antes de abrir para usuários.

## Definição de pronto para cada bloco

- [x] Frontend implementado em desktop e mobile.
- [x] Backend correspondente implementado ou contrato formalizado.
- [x] Telemetria disponível.
- [x] QA funcional executado.
- [ ] QA responsivo executado.
- [ ] QA de acessibilidade executado.
- [x] Build e testes passando.
- [ ] Rollback possível.
- [x] Documentação operacional atualizada.
- [x] Deploy estático validado com fallback SPA e política de cache coerente.

## Ordem recomendada de execução

- [x] Discovery e navegação
- [x] PDP e checkout
- [x] Conta e meus ingressos
- [x] Backend real de inventário/pedido/pagamento/ticket
- [ ] Backoffice
- [ ] SEO/SSR/edge
- [ ] Growth, BI e otimização contínua
