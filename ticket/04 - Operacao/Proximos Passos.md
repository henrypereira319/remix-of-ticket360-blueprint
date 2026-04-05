---
tags:
  - operacao
  - backlog
---

# Proximos Passos

Esta nota traduz `../progress.txt` e `../checklist-roadmap.md` em sequencia de execucao.

## Leitura rapida

O projeto ja saiu da fase de prototipo local. O foco imediato agora e produtor e repasse: o dashboard ficou forte, mas ainda precisa virar operacao financeira real no backend.

## Ordem recomendada

1. Fechar produtor e repasse como modulo confiavel.
2. Fechar adocao do backend real nas jornadas criticas.
3. Endurecer operacao, permissao e auditoria.
4. Melhorar pos-compra e comunicacao real.
5. Entrar em plataforma, SEO e confiabilidade.

## Agora

### Bloco 0 - Produtor e repasse

Objetivo: transformar o dashboard do produtor em ferramenta de trabalho real, nao so em painel de leitura.

Entrega esperada:

- [x] consolidar cockpit com charts, agenda, preview, tabela detalhada e bloco visivel de repasse
- [ ] criar fluxo formal de solicitacao de repasse
- [ ] persistir dados bancarios do produtor e do artista
- [ ] registrar historico de repasses com status e auditoria
- [ ] preparar exportacoes e fechamento financeiro por evento e lote

Criterio de pronto:

- produtor entende bruto, taxa e liquido sem abrir varias telas
- pedido de repasse tem estado, ator, data e historico
- dashboard deixa claro o que e leitura operacional e o que e dado financeiro fechado

### Bloco 1 - Adocao total do backend real

Objetivo: garantir que conta, checkout, operacao e inventario leiam e gravem prioritariamente no backend HTTP/BFF.

Entrega esperada:

- [ ] mapear todos os pontos ainda apoiados em `localStorage` ou servicos locais
- [ ] documentar por rota quais fluxos ja estao em modo remote-first e quais ainda caem em fallback
- [ ] migrar holds, pedidos, leituras de conta e operacao residual para chamadas servidoras
- [ ] manter contratos de tela estaveis durante a troca de persistencia
- [ ] cobrir o caminho principal com smoke test ou contrato automatizado

Criterio de pronto:

- comprador consegue navegar, comprar e rever pedido em outro dispositivo
- operacao consegue ler e agir sobre o mesmo estado persistido
- nao existe divergencia entre estado local e estado remoto em fluxo principal

### Bloco 2 - Operacao, permissoes e auditoria

Objetivo: tirar o backoffice de um estado funcional-local e levar para um modelo minimamente governado.

Entrega esperada:

- [ ] criar papeis de acesso para backoffice e produtor
- [ ] registrar trilha de auditoria mais detalhada para aprovar, negar e cancelar
- [ ] definir ownership das acoes sensiveis
- [ ] enriquecer metadados de revisao manual
- [ ] preparar regras de fila ou atribuicao operacional

### Bloco 3 - Pos-compra e comunicacao

Objetivo: fechar lacunas depois da compra, principalmente historico, entrega e suporte.

Entrega esperada:

- [ ] revisar a experiencia de meus pedidos, ingressos e suporte com backend como fonte primaria
- [ ] introduzir telemetria minima de entrega e falha de notificacao
- [ ] preparar integracao real de email, SMS ou push
- [ ] detalhar fluxos de autosservico ainda ausentes

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

- [ ] modelar `payout_requests`, dados bancarios e status do repasse
- [ ] definir contrato `dashboard -> repasse -> auditoria`
- [ ] listar quais campos do dashboard ainda sao apenas snapshot

### Semana 2

- [ ] ligar solicitacao de repasse ao backend
- [ ] persistir historico e timeline de status
- [ ] ampliar tabela financeira por evento e lote

### Semana 3

- [ ] reforcar permissao e auditoria
- [ ] revisar suporte e comunicacao pos-compra
- [ ] atualizar status global do projeto

## Checklist de fechamento por marco

- [ ] Atualizar `../checklist-roadmap.md`
- [ ] Atualizar `../progress.txt`
- [ ] Registrar neste vault o que mudou, o que ainda falta e o principal risco restante
- [ ] Anotar como validar a entrega manualmente

## Bloco atual recomendado

Objetivo: sair do dashboard forte para a operacao real do produtor e do repasse.

Escopo:

- repasse
- dados bancarios
- fechamento do produtor
- conta, checkout, operacao e inventario como suporte ao mesmo estado persistido

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
