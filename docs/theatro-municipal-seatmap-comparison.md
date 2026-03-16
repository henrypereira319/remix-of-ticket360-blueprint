# Theatro Municipal Seat Map Comparison

## O que apareceu no HTML salvo

O HTML de `Theatro Municipal SP _ Orquestra Experimental de Repertorio Apresenta Revisitas...html` mostra um mapa de assentos com algumas caracteristicas bem claras:

1. Navegacao por setor, com grupos como `Plateia`, `Frisas - Setor 1` e `Anfiteatro`.
2. Controles explicitos de zoom, inclusive com rotulos acessiveis para aumentar e diminuir o mapa.
3. Metadados por assento via tooltip, indicando setor, area e codigo do lugar.
4. Diferenciacao de assentos especiais como `Cadeirante`, `Baixa Visao` e `Visao parcial`.
5. Leitura menos "grade pura" e mais orientada a contexto de sala teatral.

## Diferenca em relacao ao nosso mapa anterior

Antes deste ajuste, o `SeatMap` da base trabalhava bem para um blueprint de setores, mas era mais simples:

- blocos por setor com grade regular de fileiras;
- sem foco por setor;
- sem zoom;
- sem painel contextual do assento em hover ou foco;
- sem marcadores finos para visao parcial ou categorias assistivas.

## O que entrou na implementacao

Aplicamos apenas o que melhora de fato o produto atual:

- `src/components/SeatMap.tsx` agora tem foco por setor, controles de zoom e painel de leitura do assento;
- `src/data/events.ts` passou a suportar variante `theater`, descricao de setor e tags como `partial-view`, `wheelchair` e `low-vision`;
- o evento `Hamlet - Cia. Teatro Novo` ganhou uma malha inspirada no comportamento observado no Theatro Municipal;
- assentos como `A-1`, `Q-13`, `9-9.1` e `E-5` ajudam a aproximar a experiencia da referencia salva;
- o painel do mapa agora comunica melhor status, acessibilidade e visao parcial.

## O que ficou de fora de proposito

- reproducao literal do SVG do site salvo;
- dependencia de scripts externos do HTML arquivado;
- engenharia de venda em tempo real com reserva concorrente no front;
- regras completas de meia-entrada e politicas institucionais do Theatro Municipal.

Mantivemos o template da home como base e trouxemos apenas o que fortalece o modulo de `EventDetails`.
