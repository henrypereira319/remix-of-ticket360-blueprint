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
- account area com pedidos, pagamentos, tickets e suporte
- fundacao real de backend com Supabase/Postgres
- primeira camada HTTP/BFF com leitura e mutacao para partes centrais

## Parcial ou incompleto

- adocao total do backend real no frontend
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
