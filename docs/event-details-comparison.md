# Event Details Comparison

## Referencia extraida do HTML salvo

O HTML da pagina `Steve Hackett & Genetics - Ticket360.html` mostra quatro blocos principais no detalhe:

1. Hero informativo com calendario, titulo, abertura, inicio, local, endereco, organizador, classificacao e imagem.
2. CTA de compra logo abaixo do hero.
3. Bloco expansivel de `Informacoes` com descricao longa, servico, local, horarios, vendas e observacoes importantes.
4. Tabela de setores, capacidade e valores, seguida por politica de ingresso e regras de meia-entrada.

## Estado anterior da nossa base

Antes do ajuste, o `EventDetails` tinha:

- hero com titulo, horario, local e descricao curta;
- mapa de sala integrado;
- resumo lateral da selecao;
- notas de seguranca e operacao.

Faltavam principalmente:

- metadados operacionais do evento no topo;
- CTA principal logo apos o hero;
- area dedicada a informacoes, politicas e setores;
- camada de dados para organizador, endereco, classificacao e abertura.

## O que entrou na implementacao

- enrich do mock de eventos com `details` em `src/data/events.ts`;
- hero de detalhe mais completo em `src/pages/EventDetails.tsx`;
- CTA principal de compra/selecionar assentos logo abaixo do hero;
- acordeao com `Informacoes do evento`, `Setores e valores` e `Politicas de ingresso` em `src/components/EventInfoAccordion.tsx`;
- tabela de setores usando a malha real do seat map;
- limpeza de textos com codificacao quebrada na home e nos carrosseis.

## O que ficou de fora de proposito

- conteudo HTML bruto e gigante do evento original;
- politicas legais ultra detalhadas por categoria de meia-entrada;
- dependencias externas do site salvo, anuncios, scripts de marketing e recursos de terceiros.

Mantivemos a linguagem visual da base atual e absorvemos apenas o que melhora a arquitetura e a experiencia do detalhe do evento.
