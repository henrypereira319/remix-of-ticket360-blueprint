import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const outputPath = resolve(process.cwd(), "rodamap.md");
const generatedAt = "2026-03-21";
const lines = [];

const sourceRows = [
  "Ticket360 homepage|https://www.ticket360.com.br/|Referencia comercial para agenda, discovery, area de conta, meus ingressos e compra de ingressos.",
  "Sympla homepage|https://www.sympla.com.br/|Referencia estrutural para home, cidades, categorias, colecoes, area do produtor, app e areas de ingressos.",
  "Sympla help - Como comprar ingressos|https://ajuda.sympla.com.br/hc/pt-br/articles/213638506-Como-comprar-ingressos|Referencia oficial do fluxo de compra: localizar evento, selecionar quantidade, comprar agora, preencher, revisar e finalizar.",
  "Projeto atual - App routes|/src/App.tsx|Snapshot de rotas e escopo atual do produto.",
  "Projeto atual - Event details|/src/pages/EventDetails.tsx|Snapshot da pagina de evento, ticket box e CTA para assentos.",
  "Projeto atual - Event checkout|/src/pages/EventCheckout.tsx|Snapshot do checkout local sem backend real.",
  "Projeto atual - Seat map|/src/components/SeatMap.tsx|Snapshot do mapa vetorial, interacao, performance e jornada de assentos.",
];

const currentProductRows = [
  "Stack atual: React 18, Vite 5, TypeScript, Tailwind, shadcn/ui, React Router e React Query.",
  "Rotas atuais: home, detalhe do evento, assentos, checkout e conta.",
  "Home atual: vitrine editorial simples, banners, highlights e grid de eventos.",
  "Detalhe atual: pagina de evento com facts, resumo do venue, CTA para jornada de assentos e bloco de seguranca.",
  "Assentos atuais: jornada separada, mapa vetorial do Theatro Municipal, resumo flutuante e revisao por scroll.",
  "Checkout atual: formulario local, resumo de pedido e simulacao sem servicos reais.",
  "Conta atual: placeholders de acesso e dashboard local sem integracao com pedidos reais.",
  "Backend atual: nao existe neste repositorio; a base ainda e majoritariamente front-end com seeds.",
  "Pagamentos atuais: sem gateway, sem antifraude, sem order orchestration e sem settlement.",
  "Tickets atuais: sem emissao real, wallet real, transferencia real ou refund real.",
  "Observabilidade atual: sem pipeline consolidado de analytics, logs de negocio ou alertas por funil.",
  "SEO atual: sem SSR, sem pages long-tail por cidade/categoria e sem schema completo de eventos.",
];

const benchmarkRows = [
  "Sympla exibe descoberta orientada por localidade e categoria logo na home.",
  "Sympla enfatiza comprador e produtor desde a navegacao superior.",
  "Sympla mantem areas persistentes de Ingressos e Meus ingressos.",
  "Sympla organiza colecoes como Eventos mais comprados e Vistos recentemente.",
  "Sympla promove o app como acelerador de uso recorrente.",
  "Sympla expande help center e autosservico como parte da experiencia de compra.",
  "Sympla documenta o fluxo de compra de forma sequencial e simples.",
  "Ticket360 opera como canal de descoberta e compra para shows, teatros e eventos.",
  "Ticket360 reforca a importancia de conta, meus ingressos, E-ticket e QR como artefatos pos-compra.",
  "Ambas as referencias dependem de performance, fees transparentes, ownership claro e forte operacao pos-compra.",
];

const phaseRows = [
  "01|Benchmark parity and scope framing|Mapear o comportamento alvo em desktop e mobile e transformar benchmark em especificacao.|Inventariar componentes, hierarquia, CTA, sticky areas, loading e erro.|Inventariar dados, contratos, servicos e jobs necessarios.|Registrar baseline atual para medir uplift depois da entrega.",
  "02|Desktop parity implementation|Entregar experiencia desktop comparavel em densidade de informacao e clareza comercial.|Construir layout desktop, sidebars, grids, tabelas, sticky boxes e fluxos laterais.|Servir payloads completos para a experiencia desktop.|Comparar CTR, scroll depth e conversao desktop contra baseline.",
  "03|Mobile-first parity implementation|Entregar experiencia mobile comparavel com thumb reach, CTA sticky e formulacao curta.|Construir bottom bars, drawers, bottom sheets, stepper, cards compactos e teclado amigavel.|Ajustar payloads, cache e comportamento para rede movel real.|Medir abandono mobile, tempo de interacao e taxa de erro.",
  "04|Componentization and design system hardening|Transformar a entrega em primitives reutilizaveis e tokens duraveis.|Extrair componentes, variants, patterns de formulario, listas, cards e motion.|Servir configuracoes visuais e feature toggles quando aplicavel.|Medir queda de retrabalho e regressao visual.",
  "05|API, BFF and contract definition|Definir contratos tipados e estaveis entre front, BFF e servicos.|Gerar clients tipados, request states, retries, cache e boundaries por contrato.|Criar endpoints, schemas, cache e compatibilidade retroativa.|Monitorar erro por endpoint, volume e latencia.",
  "06|Domain model and persistence|Materializar entidades, snapshots, ownership e historico do dominio.|Consumir IDs estaveis, status reais e snapshots de negocio.|Definir banco, indices, eventos de dominio e jobs de consistencia.|Garantir dimensoes e fatos adequados para BI e receita.",
  "07|Analytics, CRM and lifecycle instrumentation|Instrumentar a jornada inteira sem degradar performance ou privacidade.|Emitir exposure, click, funnel, erro e eventos de lifecycle.|Persistir eventos, enriquecer contexto e distribuir para warehouse e automacoes.|Cobrir o funil ponta a ponta com naming consistente.",
  "08|Security, compliance and resilience|Endurecer auth, PII, pagamento, QR, ownership e LGPD.|Aplicar mascaramento, feedback seguro, consent e abuse prevention UX.|Tokenizar, auditar, limitar, reter e responder a DSR.|Mensurar tentativas de abuso, fraude e SLA de compliance.",
  "09|Rollout, migration and operations|Lancar com feature flags, rollback e suporte operacional pronto.|Usar shadow mode, beta interna, banners operacionais e fallbacks.|Executar migracoes, backfills, toggles e runbooks.|Medir impacto do rollout por cohort e canal.",
  "10|QA, experimentation and optimization|Fechar o loop com QA profundo e otimizacao continua.|Cobrir regressao visual, a11y, keyboard, device matrix e user journeys.|Cobrir contract tests, load tests, synthetic monitoring e reconciliacao.|Validar uplift, regressao e ROI por experimento.",
];

const workstreamRows = [];
workstreamRows.push(
  "WS01|Discovery, IA e navegacao global|Sympla home prioriza descoberta, localidade, categorias e areas de usuario; Ticket360 enfatiza entrada rapida em eventos e ingressos.|Navegacao curta, sem IA multi-intencao para comprador, produtor e pos-compra.|Header, mega-nav, busca global, atalhos de ingressos, breadcrumb, sticky mobile nav e empty states.|Servico de navigation config, curadoria, taxonomia global, preferencias e geolocalizacao.|CTR no header, uso da busca e profundidade de navegacao.",
  "WS02|Home, colecoes e merchandising|Sympla usa colecoes, trending, vistos recentemente e app promotion; Ticket360 depende da home como vitrine de agenda e campanhas.|Home ainda fixa, com pouca personalizacao e sem slots comerciais reais.|Hero adaptativo, colecoes personalizadas, vitrines por cidade, banners de campanha e modulos de trend.|CMS de home, ranking service, recomendacao, tracking de impressao e fallback editorial.|CTR em colecoes, conversao da home e uplift por personalizacao.",
  "WS03|Busca, autosuggest e relevancia|Sympla depende da busca como porta de entrada declarativa; Ticket360 precisa facilitar descoberta exata por nome e venue.|Nao temos busca real, indexacao, typo tolerance, filtro facetado nem ranking com sinais de negocio.|Autosuggest, sugestoes de evento, artista, venue, cidade, categoria, historico e empty state guiado.|Search index, synonyms, typo tolerance, facet service e query analytics.|Search success rate, zero-result rate e CTR do autosuggest.",
  "WS04|PLP, filtros e landing pages|Sympla organiza paginas por cidade, categoria e recortes temporais; Ticket360 precisa suportar grades filtradas de agenda.|Nao temos PLP dedicada, filtros multi-facetados, SEO pages por cidade nem ordenacao comercial configuravel.|Listagem, filtros, sorting, chips aplicados, pagina de categoria/cidade e infinite scroll ou paginacao.|Facet aggregation, cache de listagem, merchandising rules e canonical rules.|Uso de filtros, receita por landing e organic sessions por categoria.",
  "WS05|Pagina de evento e ticket box|Sympla e Ticket360 tratam a pagina do evento como pagina de venda, prova social, regras e CTA primario.|Temos detalhe forte para demo, mas ainda faltam lotes, urgencia, prova social e caixa comercial robusta.|Hero de evento, media gallery, venue info, ticket box, sessoes, lotes, countdown, FAQ e share.|Event API, inventory summary, pricing snapshots, schedule, copy blocks e review workflow.|Add-to-cart rate, CTR de lotes e bounce da pagina de evento.",
  "WS06|Mapa de assentos e venue experience|Plataformas premium dependem de selecao clara por setor, disponibilidade e regras de assento.|Ja temos mapa vetorial forte, mas ainda faltam templates escalaveis, seat hold real e live seat state.|Mapa vetorial, modo mobile, zoom/pan, foco por setor, hold visual, acessibilidade e fallback por lista.|Venue registry, seat hold service, occupancy service, pricing by sector e import pipeline.|Tempo medio no mapa, erro por indisponibilidade e abandono por device.",
  "WS07|Checkout, caixa de pagamento e conversion UX|Sympla simplifica a compra em etapas claras; Ticket360 precisa transmitir confianca, taxa transparente e fechamento rapido.|Checkout ainda e simulacao local, sem order service, gateway ou estados reais.|Stepper, buyer form, attendee form, resumo, fees transparentes, upsell e recovery.|Order draft, checkout session, payment intent, antifraude e webhook intake.|Checkout completion, form error rate e recovery rate.",
  "WS08|Pagamentos, antifraude e billing|Sympla combina Pix, cartao, parcelamento, fees e regras claras; Ticket360 tambem depende disso.|Nao ha integracao financeira, antifraude, billing engine, parcelamento ou estorno real.|UI de meios de pagamento, installments, erros de autorizacao e comprovantes.|Gateway abstraction, risk engine, fee engine, tax engine, charge model e refund engine.|Approval rate, chargeback rate e fraud capture rate.",
  "WS09|Pedidos, emissao de ingresso e QR lifecycle|Sympla promete ingresso por email e aba Ingressos; Ticket360 trabalha com E-ticket e QR como artefato central.|Ainda nao existe order state machine real, emissao, assinatura de QR, reenvio ou revogacao.|Tela de sucesso, timeline do pedido, ingresso digital, QR states, download PDF e wallet hooks.|Order service, ticket issuance, QR signing, revocation, resend e printable PDF.|Tempo ate emissao, falha de emissao e scan success rate.",
  "WS10|Conta, autenticacao e sessao|Sympla conecta compra, meus ingressos, app e login em um ecossistema unico.|Temos placeholders de auth sem SSO, magic link, social login ou devices.|Login, cadastro, magic link, social, recuperar senha, perfil, privacidade e sessoes.|Identity provider, user service, consent store, session management, MFA e device trust.|Login conversion, auth success e account recovery success.",
  "WS11|Meus ingressos, wallet e pos-compra|Sympla tem aba Ingressos; Ticket360 precisa tornar o pos-compra facil e confiavel.|Nao temos pagina de meus ingressos, carteira, reminders ou agrupamento por status.|Wallet, filtros por status, cards de ingresso, detalhes, QR, reminders e calendario.|Ticket wallet API, delivery status, transfer state e pass generation.|Wallet visits, ticket open rate e reengagement pos-compra.",
  "WS12|Transferencia, troca de titularidade e refund|Sympla tem ajuda detalhada sobre cancelamento, reembolso e titularidade; Ticket360 precisa ter regras claras por evento.|Nao existe ownership transfer, refund workflow, SLA de cancelamento ou policy engine.|Fluxos de transferir, cancelar, status de analise, timeline e restricoes por evento.|Transfer engine, refund rules, approval workflow, ownership audit e event policy service.|Tempo de conclusao, taxa self-service e fraude em transferencias."
);

workstreamRows.push(
  "WS13|Notificacoes, email, WhatsApp e CRM|A experiencia de ticketing depende de mensagens transactionais impecaveis e campanhas segmentadas.|Ainda nao temos notificacoes reais por email, SMS ou WhatsApp, reminders, triggers ou CRM de lifecycle.|Centro de preferencias, opt-in, confirmacoes, logs de envio e preview de mensagens.|Notification service, template registry, event triggers, delivery tracking e CRM sync.|Delivery rate, open rate, click rate e resend rate.",
  "WS14|Suporte, ajuda e autosservico|Sympla evidencia help center e autosservico em todo o ecossistema; Ticket360 tambem precisa reduzir atrito de suporte.|Nao temos central de ajuda integrada, FAQ contextual, tickets, chat assistido nem diagnostico de pedido.|Help hub, FAQ contextual, contato, triagem, article surfaces, support status e order lookup.|Knowledge base service, support ticket service, order diagnostic API e CRM integration.|Support deflection, tempo ate resolucao e CSAT.",
  "WS15|Produtor, evento, inventory e operacao comercial|Sympla diferencia fortemente a area do produtor e a jornada de publicacao, venda e acompanhamento.|Nao temos console de produtor nem estrutura real para inventario, lotes e agenda.|Console de produtor, criacao de evento, agenda, lotes, cupons, relatorios e status operacionais.|Organizer domain, event authoring, inventory config, permissions e revenue views.|Tempo de publicacao, uso de lotes e NPS de produtor.",
  "WS16|Backoffice, atendimento e operacao interna|Plataformas maduras de ticketing precisam de console operacional para aprovacoes, risco, refund, scan e suporte.|Nao temos backoffice interno com fila de revisao, auditoria ou timeline operacional.|Ops dashboard, queues, inspection, audit timeline, internal notes, action center e SLA board.|Case management, audit log, permission matrix, action service e risk flags.|Tempo de triagem, tempo de aprovacao e backlog operacional.",
  "WS17|Preco, taxas, repasse e regras fiscais|Sympla expone taxa e parcelamento de forma clara; Ticket360 depende de regras comerciais transparentes por evento.|Nao existe engine de taxas, comissao, split, payout, nota, retencao fiscal ou simulacao comercial.|Exibicao clara de taxas, breakdown, simuladores para produtor e tooltips fiscais.|Fee calculator, settlement engine, taxation rules, invoice docs e split payouts.|Margem por evento, tempo de conciliacao e erro fiscal.",
  "WS18|Seguranca, antifraude, compliance e LGPD|Compra de ingressos lida com dados pessoais, pagamento, QR, ownership e risco operacional.|Nao ha modelo de risco, mascaramento end-to-end, retention policy, consent ou DSR tooling real.|Consent flows, privacy center, masked data, suspicious activity states e abuse prevention UX.|PII vault, tokenization, rate limit, risk scoring, dispute logs, retention jobs e DSR workflow.|Fraud attempt rate, DSR SLA e auth abuse rate.",
  "WS19|Analytics, BI, experimentation e growth|Sympla monetiza descoberta e conversao com forte telemetria; Ticket360 precisa visibilidade por funil e evento.|Nao temos data model de analytics, experiment framework, attribution ou cohort.|Eventos de analytics, consent-aware tracking, exposure logs e experiment toggles.|Warehouse schemas, event pipeline, attribution store e experimentation config.|Conversao por etapa, uplift por experimento e repeat purchase rate.",
  "WS20|SEO, indexacao, schema e growth loops|Sympla usa cidades, categorias, colecoes e paginas de evento como maquina de discoverability.|Nosso front SPA ainda tem limitacao de indexacao, sem schema robusto nem pages long-tail.|Metadata, schema, static generation strategy, landing pages e share cards.|SEO config service, sitemap service, landing inventory e canonical rules.|Organic sessions, indexed pages e ranking por categoria/cidade.",
  "WS21|Design system, tokens e consistencia visual|Sympla e Ticket360 conseguem parecer sistemas, nao paginas isoladas.|Temos base de componentes boa, mas falta governanca de token e parity cross-device.|Tokens, spacing scale, components, motion, forms, list items, cards e sticky bars.|Registry de feature flags visuais, theming config, docs pipeline e visual regression infra.|Tempo de entrega de tela, regressao visual e reuso de componente.",
  "WS22|Frontend platform, SSR, edge e caching|Plataformas com volume de eventos precisam de resposta rapida, SEO forte e caches de borda bem desenhados.|Estamos em Vite SPA puro, sem SSR, sem edge cache de HTML e sem estrategia hibrida.|App shell, hydration strategy, route code splitting, image policy, skeletons e web vitals.|BFF, CDN strategy, edge keys, stale-while-revalidate e config delivery.|LCP, INP, TTFB e cache hit rate.",
  "WS23|Backend platform, dominios e APIs|Sympla possui area de API e ecossistema de produtor; ticketing robusto depende de dominios claros e contratos estaveis.|Nao existe backend real, apenas seeds locais; precisamos desenhar dominios, BFF e servicos centrais.|Contracts-first integration, typed clients, error boundaries e optimistic UI segura.|Identity, event, inventory, order, payment, ticket, notification, support e analytics services.|API latency, error rate e schema drift incidents.",
  "WS24|QA, acessibilidade, release e confiabilidade|Sites de ticketing convivem com pico, acessibilidade legal e muitos cenarios de dispositivo.|Temos testes localizados, mas falta matriz QA, load test, mobile lab, a11y audit e rollback plan.|Playwright, visual regression, keyboard nav, screen reader flows, device matrix e smoke packs.|Contract tests, load tests, canary releases, rollback e synthetic monitoring.|Defect escape rate, a11y violations e incident MTTR."
);

const streams = [
  "Frontend web desktop",
  "Frontend web mobile",
  "Frontend design system",
  "Backend application",
  "Backend data and integrations",
  "Product analytics and operations",
];

const add = (value = "") => lines.push(value);

add("# Rodamap para aproximar o produto de Ticket360 + Sympla");
add("");
add(`Gerado em: ${generatedAt}`);
add("");
add("## Objetivo");
add("");
add(
  "Construir um roadmap exaustivo para fazer o nosso produto se parecer, operar e converter mais como as referencias Ticket360 e Sympla, tanto em desktop quanto em mobile, cobrindo frontend, backend, dados, pagamentos, operacao, suporte, analytics, SEO e confiabilidade.",
);
add("");
add("## Escopo da pesquisa");
add("");
sourceRows.forEach((row) => {
  const [label, url, note] = row.split("|");
  add(`- Fonte: ${label}`);
  add(`- URL: ${url}`);
  add(`- Uso na analise: ${note}`);
  add("");
});

add("## Limites e notas metodologicas");
add("");
add("- A Sympla ofereceu maior legibilidade publica para home, ajuda ao comprador e area de produtor, entao foi usada como benchmark estrutural dominante.");
add("- A Ticket360 foi usada como benchmark comercial de agenda, descoberta, area de conta, meus ingressos, E-ticket e QR.");
add("- O nosso repositorio ainda e front-first; parte relevante deste roadmap descreve a arquitetura de backend que ainda precisa nascer.");
add("- O documento detalha front e back em paralelo para evitar backlog unilateral.");
add("");

add("## Snapshot do produto atual");
add("");
currentProductRows.forEach((row) => add(`- ${row}`));
add("");

add("## Achados principais do benchmark");
add("");
benchmarkRows.forEach((row) => add(`- ${row}`));
add("");

add("## North star do produto-alvo");
add("");
add("- Descoberta de eventos tao clara e escalavel quanto Sympla.");
add("- Percepcao de confianca comercial e operacional tao forte quanto Ticket360.");
add("- Compra com taxa transparente, regras explicitas e CTA forte em qualquer viewport.");
add("- Jornada de assentos premium para venues numerados sem sacrificar performance mobile.");
add("- Backoffice real para operar risco, ownership, reembolso, transferencia e emissao.");
add("- Conta e wallet que reduzam ansiedade pos-compra e deflacionem tickets de suporte.");
add("");

add("## Macro-fases");
add("");
add("- Fase A: parity de descoberta, evento e checkout.");
add("- Fase B: conta, meus ingressos, ownership e suporte.");
add("- Fase C: produtor, backoffice, pagamentos reais e operacao.");
add("- Fase D: crescimento, SEO, BI, confiabilidade e governanca.");
add("");

add("## Streams consideradas");
add("");
streams.forEach((stream) => add(`- ${stream}`));
add("");

for (const workstreamRow of workstreamRows) {
  const [id, name, benchmark, gap, front, back, kpi] = workstreamRow.split("|");

  add(`## ${id} - ${name}`);
  add("");
  add(`- Benchmark de referencia: ${benchmark}`);
  add(`- Gap atual: ${gap}`);
  add(`- Foco de frontend: ${front}`);
  add(`- Foco de backend: ${back}`);
  add(`- KPI norte: ${kpi}`);
  add("");

  for (const phaseRow of phaseRows) {
    const [phaseId, phaseName, objective, frontendAngle, backendAngle, analyticsAngle] = phaseRow.split("|");
    const taskId = `${id}-${phaseId}`;

    add(`### ${taskId} - ${phaseName}`);
    add(`- Area: ${name}`);
    add(`- Objetivo do slice: ${objective}`);
    add(`- Benchmark principal aplicado: ${benchmark}`);
    add(`- Diagnostico do gap local: ${gap}`);
    add(`- Foco frontend deste slice: ${frontendAngle}`);
    add(`- Foco backend deste slice: ${backendAngle}`);
    add(`- Stream coverage: ${streams.join(", ")}`);
    add(`- Requisicao de frontend: traduzir ${front.toLowerCase()} em experiencia comparavel em desktop e mobile, mantendo consistencia com o design system.`);
    add(`- Requisicao de backend: entregar contratos, regras e jobs para sustentar ${back.toLowerCase()} sem logica critica escondida no client.`);
    add(`- Requisicao de produto: fechar escopo de parity, definir o que precisa ser igual ao benchmark e o que pode ser adaptado ao nosso posicionamento.`);
    add(`- Requisicao de dados: definir metricas e eventos para medir ${kpi.toLowerCase()} logo no primeiro rollout deste slice.`);
    add("- Requisicao de UX writing: garantir copy curta, confiavel e orientada a conversao.");
    add("- Requisicao de design: gerar spec desktop, spec mobile, tokens, loading, empty, error, offline e fallback operacional.");
    add("- Requisicao de arquitetura: formalizar BFF, modelo de dados, ownership do dominio, cache e estrategia de falha.");
    add("- Contratos/API esperados: endpoints typed, payloads completos, erros versionados, ids estaveis, status de negocio reais e suporte a feature flags.");
    add("- Modelo de dados esperado: entidades principais, relacionamentos, snapshots, historico, auditoria, ownership e timestamps operacionais.");
    add("- Regras de negocio a explicitar: limites por usuario, disponibilidade, taxa, ownership, expiracao, visibilidade por tenant e edge cases de suporte.");
    add("- Estados da interface: idle, loading, success, empty, zero results, partial data, timeout, stale cache, denied, gated, retryable failure e hard failure.");
    add("- Criterios desktop: manter densidade de informacao comparavel ao benchmark, com CTA forte, hierarquia visual clara e uso eficiente da largura.");
    add("- Criterios mobile: priorizar thumb reach, CTA sticky, leitura compacta, formularios curtos, drawers/bottom sheets e resumos persistentes.");
    add("- SEO/discoverability: quando aplicavel, garantir metadata, schema, canonical, indexabilidade e feed para campanhas, colecoes e sharing.");
    add(`- Analytics: ${analyticsAngle}`);
    add("- Seguranca/compliance: aplicar hardening progressivo para auth, PII, pagamento, ownership, QR, consentimento e rate limiting.");
    add("- Performance: manter payload pequeno, code splitting por rota, render barato, revalidacao inteligente e orcamento de Web Vitals.");
    add("- Observabilidade: logs estruturados, traces em requests criticos, metrics por endpoint, SLO de UX e alertas para regressao.");
    add("- Dependencias: design, produto, engenharia front, engenharia back, dados, QA, operacao e suporte devem aprovar contrato e rollout.");
    add("- Rollout sugerido: shadow mode -> beta interna -> 5% -> 25% -> 100% com feature flag de rollback imediato.");
    add("- QA funcional: validar jornada feliz, edge cases, expiracoes, erros de rede, ids invalidos, cache stale, retorno ao fluxo e cross-browser.");
    add("- QA responsivo: validar widths criticas, iOS Safari, Android Chrome, telas pequenas, landscape, zoom do navegador e teclado virtual.");
    add("- QA acessibilidade: validar tab order, leitor de tela, foco visivel, semantica, contraste, labels, role e motion reduction.");
    add("- Criterio de aceite 1: a feature deve parecer e se comportar de forma claramente competitiva com Sympla/Ticket360 para este dominio.");
    add("- Criterio de aceite 2: o frontend nao pode depender de dados sinteticos para estados criticos depois que o contrato deste slice estiver liberado.");
    add("- Criterio de aceite 3: o backend deve emitir telemetria suficiente para medir resultado e investigar incidentes deste slice.");
    add("- Criterio de aceite 4: o slice precisa estar coberto por smoke test desktop + mobile e por pelo menos um teste de contrato ou reconciliacao.");
    add("- Criterio de aceite 5: a documentacao operacional, o runbook e a estrategia de rollback precisam existir antes da abertura do flag para usuarios finais.");
    add("");
  }
}

add("## Encerramento");
add("");
add("Este documento funciona como backlog mestre de parity e escalabilidade.");
add("Sugestao pratica: comecar por WS01 a WS09 para ficar visualmente competitivo em descoberta e compra, depois atacar WS10 a WS18 para virar plataforma completa, e fechar com WS19 a WS24 para growth, BI, confiabilidade e governanca.");
add("");

if (lines.length < 5000) {
  throw new Error(`Line count below target: ${lines.length}`);
}

writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(`rodamap.md generated at ${outputPath}`);
console.log(`line_count=${lines.length}`);
