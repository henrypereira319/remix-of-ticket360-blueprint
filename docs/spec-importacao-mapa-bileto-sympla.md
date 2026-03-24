# Especificacao de Importacao de Mapas Bileto / Sympla

Status: draft operacional  
Data da analise: 2026-03-24  
Amostra analisada: [pagina publica do evento](https://bileto.sympla.com.br/event/115174/d/359615)

## Objetivo

Definir como importar para o nosso sistema eventos com mapa numerado publicados no stack Bileto / Sympla, com foco no formato observado no evento `ENTRE NOS - OS MENTALISTAS`.

Este documento cobre:

- o contrato de dados confirmado na fonte;
- o mapeamento para o nosso modelo canonico;
- a estrategia de importacao em duas etapas: catalogo/comercial e geometria;
- as lacunas que ainda precisam de engenharia reversa antes de publicar o mapa numerado completo.

## Resumo executivo

O formato Bileto / Sympla observado nao deve ser importado a partir do HTML renderizado da pagina. O HTML so monta a aplicacao cliente. O dado operacional util aparece em chamadas XHR para um BFF da propria plataforma.

O contrato confirmado ate aqui e:

- evento;
- venue;
- varias apresentacoes/sessoes;
- `schematic_map_id` por apresentacao;
- setores por apresentacao;
- SKUs comerciais por setor;
- totais agregados de capacidade, bloqueio e disponibilidade.

O contrato que ainda nao foi confirmado nesta rodada e:

- endpoint exato da geometria do mapa a partir de `schematic_map_id`;
- payload de assentos individuais com label, fileira, numero, coordenadas e status.

Conclusao pratica: ja podemos importar com confianca o catalogo, as sessoes, os setores e as regras comerciais. A geometria do mapa deve entrar como segunda fase do conector, com `geometry_pending` enquanto o endpoint de assentos nao estiver fechado.

## Fonte confirmada

Ao abrir a pagina publica do evento, a aplicacao faz chamada para um endpoint JSON do BFF:

- `GET https://bff-sales-api-cdn.bileto.sympla.com.br/api/v1/events/:eventId`

Observacoes operacionais:

- a chamada usa `accept: application/json`;
- a aplicacao envia `referer` da propria origem Bileto/Sympla;
- a aplicacao tambem envia `x-api-key`;
- o `x-api-key` e um detalhe de configuracao do conector, nao algo para hardcode no dominio.

### O que nao usar como fonte primaria

- scraping do HTML final;
- scraping visual do DOM do checkout;
- click automation para descobrir assentos em tempo real;
- parsing de SVG salvo manualmente como unica fonte de verdade.

Esses caminhos sao frageis e quebram facil quando a UI ou os web components mudam.

## Contrato confirmado na amostra

### Evento

Campos observados no payload:

```json
{
  "id": 115174,
  "name": "ENTRE NOS - OS MENTALISTAS",
  "status": "STARTED",
  "event_category_id": 1,
  "event_genre_id": 355,
  "sales_flow_type": 1,
  "date_summary": {
    "week": "Quarta as 20h30",
    "period": "1 de Abril a 6 de Maio"
  }
}
```

### Venue

O payload do evento traz venue embutido, com endereco e coordenadas:

```json
{
  "id": 5,
  "name": "Teatro Multiplan MorumbiShopping",
  "locale": {
    "address": "Av. Roque Petroni Jr., Piso G2,1089 - MORUMBISHOPPING",
    "postal_code": "04707-900",
    "lat": -23.6244033,
    "lon": -46.6995435,
    "city": {
      "id": 565,
      "name": "Sao Paulo"
    }
  },
  "external_id": 4
}
```

### Apresentacoes / sessoes

Na amostra existem 6 apresentacoes. Cada uma tem proprio `schematic_map_id`, mesmo pertencendo ao mesmo evento.

```json
{
  "id": 359615,
  "name": "ENTRE NOS - OS MENTALISTAS",
  "schematic_map_id": 133691,
  "presentation_local_date_time": "2026-04-01T20:30:00-03:00",
  "total_available": 1,
  "total_booked": 26,
  "total_blocked": 223,
  "total_capacity": 250
}
```

Implicacao importante:

- `schematic_map_id` deve ser tratado como uma versao externa de mapa por sessao;
- nao devemos assumir que um mesmo venue tem exatamente o mesmo mapa publicado em todas as datas;
- se duas sessoes compartilharem geometria, o conector pode deduplicar depois, mas a primeira importacao deve preservar a granularidade da fonte.

### Setores

Cada apresentacao traz setores, com ids comerciais e referencias ligadas ao mapa:

```json
{
  "id": 2428896,
  "name": "GOLD",
  "access_gate": "Portao",
  "lowest_price": {
    "currency": "BRL",
    "value": "9000"
  },
  "highest_price": {
    "currency": "BRL",
    "value": "12000"
  },
  "total_available": 1,
  "total_capacity": 120,
  "has_seats_available": true,
  "seats_map_id": 380977,
  "map_id": "883c6caa-615b-fc79-10f9-ce0dc230997f",
  "partial_table": false,
  "bookables": ["SEATS"]
}
```

Campos importantes:

- `seats_map_id`: identificador numerico do grupo de assentos do setor;
- `map_id`: identificador UUID do grupo visual/logico do setor;
- `bookables: ["SEATS"]`: sinal forte de que o setor opera por assentos individuais;
- `has_seats_available`: semantica comercial de disponibilidade;
- totais agregados do setor: capacidade, bloqueados, reservados, disponiveis.

### SKUs / tipos de ingresso

Cada setor carrega SKUs comerciais:

```json
{
  "id": 22201323,
  "name": "Clube Ifood 25%",
  "price": {
    "currency": "BRL",
    "value": "9000"
  },
  "full_price": {
    "currency": "BRL",
    "value": "9000"
  },
  "convenience_fee": {
    "currency": "BRL",
    "value": "1800"
  },
  "priority": 0,
  "discount": {
    "currency": "BRL",
    "value": "0"
  },
  "rules": [
    {
      "internal_type": "SIMPLE_COUPON",
      "type": "USER_INPUT"
    }
  ]
}
```

Campos importantes:

- `price.value`: valor em centavos;
- `full_price.value`: valor cheio;
- `convenience_fee.value`: taxa da plataforma/origem;
- `discount.value`: desconto aplicado no SKU;
- `rules`: restricoes, cupom, campos obrigatorios e outras regras de elegibilidade.

## O que ainda esta em aberto

Nesta rodada nao foi confirmado:

- o endpoint exato que resolve `schematic_map_id` para geometria;
- o payload com assentos individuais;
- a estrategia da fonte para labels de fileira e cadeira;
- o formato de viewport, camadas visuais e fundo do mapa;
- o contrato de atualizacao em tempo real da disponibilidade por assento.

Por isso, o conector deve separar claramente:

1. importacao do catalogo e das regras comerciais;
2. importacao da geometria e dos assentos.

## Modelo canonico proposto

### Mapeamento minimo para o backend atual

| Fonte Bileto / Sympla | Campo | Destino interno | Observacao |
| --- | --- | --- | --- |
| Event | `id` | `source_event_id` em metadata | manter snapshot bruto |
| Event | `name` | evento / serie comercial | nome canonico |
| Event | `venue.*` | `venues` | venue pode ser upsertado |
| Presentation | `id` | `event_sessions.external_source_id` | id da sessao na origem |
| Presentation | `presentation_local_date_time` | `event_sessions.starts_at` | timezone ja vem no payload |
| Presentation | `schematic_map_id` | `seatMapManifest.sourceMapId` ou `venue_map_version.external_id` | tratar como versao externa do mapa |
| Sector | `id` | `event_sections.external_source_id` | id do setor na origem |
| Sector | `name` | `event_sections.name` | nome comercial do setor |
| Sector | `seats_map_id` | metadata do setor | aponta para grupo de assentos |
| Sector | `map_id` | metadata do setor | UUID externo do grupo visual |
| Sector | `bookables` | metadata do setor | quando contem `SEATS`, exigir camada de assentos |
| SKU | `id` | `offer.external_source_id` | tipo de ingresso |
| SKU | `name` | `offer.name` | ex.: Inteira, Meia, Clube Ifood |
| SKU | `price.value` | `offer.gross_amount_cents` | centavos |
| SKU | `convenience_fee.value` | `offer.source_fee_cents` | snapshot da taxa da origem |
| SKU | `rules` | metadata / restrictions | regras de elegibilidade e input |

### Extensoes recomendadas

Para esse tipo de importacao frequente, vale introduzir camadas explicitas no dominio:

- `venue_maps`
- `venue_map_versions`
- `venue_map_import_runs`
- `venue_map_sections`
- `venue_map_seats`

Se nao quisermos criar tudo de uma vez, o minimo aceitavel e:

- armazenar `schematic_map_id`, `map_id`, `seats_map_id` e o raw payload em metadata;
- manter `seatMapManifest` com ponte para assets futuros;
- marcar sessoes importadas sem geometria como `geometry_pending`.

## Pipeline de importacao recomendado

### Fase 1 - catalogo e comercial

1. Receber a URL publica do evento.
2. Extrair o `eventId` e, se existir, o `presentationId` da URL.
3. Consultar o BFF `/api/v1/events/:eventId`.
4. Persistir o raw snapshot do payload com:
   - `source_name = bileto_sympla`
   - `source_event_id`
   - `fetched_at`
   - `parser_version`
   - headers operacionais usados pelo conector
5. Fazer upsert do venue.
6. Fazer upsert do evento/serie.
7. Para cada apresentacao:
   - criar ou atualizar `event_session`;
   - anexar `schematic_map_id` na sessao ou na versao de mapa;
   - importar os setores;
   - importar SKUs e regras comerciais.
8. Fechar a importacao em estado `catalog_only` se nao houver geometria.

### Fase 2 - geometria e assentos

1. Resolver a fonte da geometria a partir de `schematic_map_id`.
2. Persistir o asset bruto retornado pela origem.
3. Normalizar para o nosso formato:
   - `backgroundAssetPath`
   - `geometryPath`
   - `viewport`
   - `sections`
   - `seats`
   - `sourceMetadata`
4. Criar ou atualizar a versao de mapa.
5. Relacionar a versao de mapa com a sessao importada.
6. Materializar `event_seats` quando a fonte realmente expuser assentos individuais.
7. Mudar o estado para `review_required`.

### Fase 3 - revisao e publicacao

1. Validar capacidade por sessao e por setor.
2. Validar duplicidade de assentos.
3. Validar correspondencia entre setores comerciais e setores visuais.
4. Validar viewport, zoom e navegação.
5. Publicar a versao do mapa.
6. Mudar o estado para `publishable` ou `published`.

## Regras de validacao

### Integridade comercial

- `sum(total_capacity dos setores)` deve bater com `presentation.total_capacity`;
- `sum(total_available dos setores)` nao pode exceder `presentation.total_available`;
- `price.value`, `full_price.value`, `discount.value` e `convenience_fee.value` devem ser parseados como inteiros em centavos;
- cada setor deve ter pelo menos um SKU valido;
- cada SKU deve ter `currency = BRL` ou ser rejeitado com erro de parser;
- `bookables` contendo `SEATS` exige estado `geometry_pending` ate a geometria ser resolvida.

### Integridade do mapa

- cada `schematic_map_id` deve ser tratado como identidade externa de versao;
- cada setor importado deve guardar `seats_map_id` e `map_id`;
- assentos futuros devem ter chave estavel no formato `section + row + seat` ou chave externa equivalente;
- a publicacao deve falhar se houver setor comercial sem setor visual correspondente.

### Observabilidade

O importador deve registrar:

- URL de origem;
- `eventId` e `presentationId` de origem;
- `schematic_map_id` por sessao;
- quantidade de setores e SKUs importados;
- parser version;
- hash do payload bruto;
- estado final da importacao;
- erros por fase.

## Estrutura canonica sugerida para o manifest do mapa

Mesmo antes da geometria estar resolvida, vale reservar este shape:

```json
{
  "source": {
    "provider": "bileto_sympla",
    "eventId": 115174,
    "presentationId": 359615,
    "schematicMapId": 133691
  },
  "status": "geometry_pending",
  "backgroundAssetPath": null,
  "geometryPath": null,
  "viewport": null,
  "sections": [],
  "seats": [],
  "rawSnapshotPath": "imports/bileto-sympla/115174/359615/event.json"
}
```

Quando a geometria existir, o manifest passa a ser algo como:

```json
{
  "source": {
    "provider": "bileto_sympla",
    "eventId": 115174,
    "presentationId": 359615,
    "schematicMapId": 133691
  },
  "status": "review_required",
  "backgroundAssetPath": "maps/bileto-sympla/133691/background.svg",
  "geometryPath": "maps/bileto-sympla/133691/geometry.json",
  "viewport": {
    "minX": 0,
    "minY": 0,
    "width": 1200,
    "height": 900
  },
  "sections": [],
  "seats": []
}
```

## Decisoes de produto e engenharia

### 1. Nao inferir geometria a partir de setor comercial

Setor comercial e geometria nao sao a mesma coisa. O fato de um setor chamar `GOLD` nao nos diz nada sobre:

- posicao no mapa;
- fileiras;
- numeracao;
- assentos especiais;
- visao parcial;
- acessibilidade;
- orientacao do palco.

### 2. Nao assumir reutilizacao automatica entre sessoes

Na amostra, cada sessao veio com `schematic_map_id` diferente. Mesmo que visualmente o mapa pareca igual, o importador deve considerar cada id como versao distinta ate deduplicacao explicita.

### 3. Separar asset visual de geometria clicavel

Precisamos manter dois artefatos:

- fundo visual do venue/mapa;
- geometria clicavel e estruturada.

Isso deixa o conector mais resiliente e simplifica revisao manual.

### 4. Guardar snapshot bruto sempre

Toda importacao deve guardar o payload original. Isso ajuda em:

- auditoria;
- diff entre versoes;
- replay de parser;
- investigacao de bugs;
- defesa contra mudancas silenciosas na origem.

## Riscos e cuidados

- A origem e de terceiro; o uso deve respeitar direitos, contratos e autorizacoes comerciais.
- O `x-api-key` pode rotacionar; ele deve viver em configuracao de conector, nunca espalhado em regras de negocio.
- A UI publica da fonte pode mudar sem aviso; o conector deve depender do contrato BFF e nao do DOM.
- O endpoint de geometria ainda nao esta fechado; por isso o rollout deve aceitar `catalog_only` e `geometry_pending`.

## Backlog tecnico imediato

1. Criar `connector spec` versionado para `bileto_sympla`.
2. Implementar fetch do endpoint `/api/v1/events/:eventId`.
3. Persistir raw snapshots por import run.
4. Fazer upsert de venue, evento, sessoes, setores e SKUs.
5. Marcar mapas como `geometry_pending`.
6. Descobrir e documentar o endpoint que resolve `schematic_map_id`.
7. Normalizar o payload de geometria para `seatMapManifest`.
8. Construir tela de revisao/publicacao do mapa importado.

## Resultado esperado desta especificacao

Depois desta spec, o nosso sistema deve ser capaz de:

- importar eventos e sessoes desse stack sem depender de HTML;
- preservar referencias externas de mapa por sessao;
- importar setores e precificacao de forma confiavel;
- deixar a geometria como etapa separada, auditavel e publicavel;
- evitar que mapa numerado fique acoplado a scraping visual fragil.
