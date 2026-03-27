---
tags:
  - operacao
  - backlog
---

# Proximos Passos

Esta nota traduz `../progress.txt` e `../checklist-roadmap.md` em sequencia de execucao.

## Leitura rapida

O projeto ja saiu da fase de prototipo local. O foco agora e remover pontos criticos que ainda dependem de fallback local e transformar o backend real na fonte principal de verdade.

## Ordem recomendada

1. Fechar adocao do backend real nas jornadas criticas.
2. Endurecer operacao, permissao e auditoria.
3. Melhorar pos-compra e comunicacao real.
4. Entrar em plataforma, SEO e confiabilidade.

## Agora

### Bloco 1 — Adocao total do backend real

Objetivo: garantir que conta, checkout, operacao e inventario leiam e gravem prioritariamente no backend HTTP/BFF.

Entrega esperada:

- [ ] mapear todos os pontos ainda apoiados em `localStorage` ou servicos locais
- [ ] documentar por rota quais fluxos ja estao em modo remote-first e quais ainda caem em fallback
- [ ] migrar holds, pedidos, leituras de conta e operacao residual para chamadas servidoras
- [ ] manter contratos de tela estaveis durante a troca de persistencia
- [ ] cobrir o caminho principal com smoke test ou contrato automatizado

Critério de pronto:

- comprador consegue navegar, comprar e rever pedido em outro dispositivo
- operacao consegue ler e agir sobre o mesmo estado persistido
- nao existe divergencia entre estado local e estado remoto em fluxo principal

Riscos:

- estados duplicados entre client e servidor
- regressao silenciosa em fallback
- inconsistencias de sessao/autenticacao

### Bloco 2 — Operacao, permissoes e auditoria

Objetivo: tirar o backoffice de um estado funcional-local e levar para um modelo minimamente governado.

Entrega esperada:

- [ ] criar papeis de acesso para backoffice e produtor
- [ ] registrar trilha de auditoria mais detalhada para aprovar, negar e cancelar
- [ ] definir ownership das acoes sensiveis
- [ ] enriquecer metadados de revisao manual
- [ ] preparar regras de fila ou atribuicao operacional

Critério de pronto:

- toda acao sensivel tem ator, data e contexto registrados
- usuario sem papel correto nao acessa operacao sensivel
- revisao manual deixa rastros suficientes para investigacao

### Bloco 3 — Pos-compra e comunicacao

Objetivo: fechar lacunas depois da compra, principalmente historico, entrega e suporte.

Entrega esperada:

- [ ] revisar a experiencia de meus pedidos, ingressos e suporte com backend como fonte primaria
- [ ] introduzir telemetria minima de entrega e falha de notificacao
- [ ] preparar integracao real de email/SMS/push
- [ ] detalhar fluxos de autosservico ainda ausentes

Critério de pronto:

- usuario consegue reencontrar pedido, ticket e suporte com consistencia
- operacao entende quando comunicacao falhou
- backlog de provedores reais fica claramente quebrado em etapas pequenas

## Depois

### Plataforma e crescimento

- [ ] SEO por evento, cidade e categoria
- [ ] estrategia de SSR ou rendering hibrido
- [ ] eventos de analytics de descoberta, PDP, mapa e checkout
- [ ] dashboard ou pipeline basico de BI

### Confiabilidade e seguranca

- [ ] logs estruturados
- [ ] alertas em fluxos criticos
- [ ] rate limiting
- [ ] protecao de PII
- [ ] base para antifraude e chargeback

## Sprint sugerida de curto prazo

### Semana 1

- [ ] auditar onde ainda existe persistencia local critica
- [ ] listar rotas, hooks e servicos que ainda divergem do backend real
- [ ] definir a matriz `rota -> origem de dados -> fallback -> risco`

### Semana 2

- [ ] migrar fluxos mais criticos de checkout e conta para backend prioritario
- [ ] validar historico cross-device no caminho principal
- [ ] ampliar smoke tests do BFF

### Semana 3

- [ ] reforcar backoffice com permissao e auditoria
- [ ] revisar suporte e comunicacao pos-compra
- [ ] atualizar status global do projeto

## Checklist de fechamento por marco

- [ ] Atualizar `../checklist-roadmap.md`
- [ ] Atualizar `../progress.txt`
- [ ] Registrar neste vault o que mudou, o que ainda falta e o principal risco restante
- [ ] Anotar como validar a entrega manualmente

## Bloco atual recomendado

Objetivo: finalizar a adocao real do backend nas jornadas mais sensiveis.

Escopo:

- conta
- checkout
- operacao
- inventario

Nao entrar ainda:

- SEO/SSR
- antifraude completo
- provedores reais finais de pagamento

Validacao:

- smoke do backend passando
- teste manual de compra e consulta do mesmo pedido em sessao diferente
- consulta da operacao refletindo o mesmo estado persistido

Links:

- [[02 - Projeto/Estado Atual]]
- [[03 - Engenharia/Arquitetura]]
- [[03 - Engenharia/Mapa do Repositorio]]
