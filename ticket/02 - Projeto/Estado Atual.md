---
tags:
  - projeto
  - status
---

# Estado Atual

Resumo derivado principalmente de `../progress.txt`.

## Ja existe hoje

- marketplace e discovery com home, busca e pagina de evento
- seat map pesado carregado sob demanda
- reservas temporarias, pedidos e bloqueio contra compra duplicada
- fluxo local de pagamento Pix, cartao e corporativo/manual
- emissao local de tickets com QR e barcode
- notificacoes e eventos de analytics locais
- area de operacao em `/operacao`
- area de produtor em `/produtor/meus-eventos` e `/organizador/meus-eventos`
- painel do produtor com bloco dedicado de informacoes do repasse, incluindo codigo da solicitacao, datas, tipo, valores, nome e CPF, com placeholders explicitos para cadastro bancario e solicitacao formal ainda nao implementados
- cockpit do produtor com charts de receita, pipeline operacional, composicao financeira, ocupacao, agenda comercial, preview, ranking financeiro e tabela detalhada por evento
- header com variante dedicada para a area do produtor, ocultando busca, pulse, carrinho, categorias e outras acoes de marketplace que nao ajudam no trabalho operacional
- account area com pedidos, pagamentos, tickets e suporte
- fundacao real de backend com Supabase/Postgres
- primeira camada HTTP/BFF com leitura e mutacao para partes centrais

## Parcial ou incompleto

- adocao total do backend real no frontend
- fluxo formal de solicitacao de repasse e cadastro bancario do produtor
- dashboard do produtor ainda le com snapshot financeiro, sem historico formal de repasse, exportacao e fechamento persistido
- antifraude e conciliacao de pagamentos
- notificacao com provedores reais
- governanca de operacao com permissoes e trilha forte
- analytics externo e observabilidade de producao

## Gargalo principal

O maior gap nao e mais modelagem ou UI. O gargalo agora e integrar tudo de ponta a ponta no backend real sem quebrar os contratos da aplicacao.

## Leitura pratica

Se for retomar o projeto depois de uma pausa, leia nesta ordem:

1. [[02 - Projeto/Visao Geral]]
2. [[04 - Operacao/Proximos Passos]]
3. [[03 - Engenharia/Mapa do Repositorio]]
4. `../progress.txt`
