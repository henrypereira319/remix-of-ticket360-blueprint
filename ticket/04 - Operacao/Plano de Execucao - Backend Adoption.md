---
tags:
  - operacao
  - execucao
  - backend
---

# Plano de Execucao - Backend Adoption

## Missao

Fazer o produto operar com backend real como fonte principal de verdade sem quebrar os contratos do frontend.

## Perguntas que este bloco precisa responder

- Quais telas ainda dependem de dados locais?
- Quais mutacoes continuam acontecendo no browser em vez do servidor?
- Onde o fallback local ainda e aceitavel?
- Onde o fallback local ja virou risco de produto?

## Inventario inicial de frentes

### Conta

- autenticacao
- perfil
- pedidos
- pagamentos
- tickets
- suporte

### Checkout

- hold de assento
- criacao de pedido
- orquestracao de pagamento
- retorno de status

### Operacao

- fila de revisao
- aprovacao e negacao
- cancelamento
- leitura de trilhas

### Catalogo e inventario

- publicacao
- detalhe do evento
- runtime de disponibilidade
- consistencia do seat map

## Sequencia tecnica sugerida

1. Catalogar chamadas e fontes de dados em `src/`.
2. Confirmar quais rotas ja existem em `server/http/`.
3. Medir onde o app ainda escreve localmente.
4. Trocar primeiro as mutacoes de maior risco comercial.
5. So depois limpar os fallbacks que forem seguros de remover.

## Sinais de que o bloco foi bem executado

- o mesmo pedido aparece em outra sessao/dispositivo
- a operacao le o mesmo estado que o comprador enxerga
- falhas de backend nao geram estado fantasma no client
- logs e testes ajudam a isolar regressao rapidamente

## Sinais de alerta

- pedido criado localmente mas invisivel para operacao
- hold local sem reflexo no servidor
- tela parecer correta com backend indisponivel e falhar silenciosamente em producao
- divergencia entre status do pagamento e status do pedido

## Atualizacoes esperadas quando este bloco avancar

- [[04 - Operacao/Proximos Passos]]
- [[02 - Projeto/Estado Atual]]
- `../checklist-roadmap.md`
- `../progress.txt`
