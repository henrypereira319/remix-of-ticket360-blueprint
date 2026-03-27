---
tags:
  - engenharia
  - arquitetura
---

# Arquitetura

## Camadas principais

1. Frontend React para descoberta, compra, conta, produtor e operacao.
2. API HTTP/BFF em Node para expor os dominios reais.
3. Dominios server-side para catalogo, ticketing, pagamentos, suporte e conta.
4. Persistencia em Supabase/Postgres.

## Fluxo de alto nivel

```text
UI React
  -> camada de API do app
    -> HTTP backend
      -> dominios de negocio
        -> Supabase/Postgres
```

## Modulos mais importantes

- Catalogo: eventos, sessoes, publicacao e busca
- Inventario: assentos, holds e disponibilidade
- Orders: criacao e ciclo do pedido
- Payments: autorizacao, aprovacao, cancelamento e refund
- Tickets: emissao, leitura e cancelamento
- Notifications: registro e disparo futuro
- Support: abertura e historico de casos
- Organizer/Backoffice: visoes operacionais

## Norte tecnico

- manter contratos estaveis entre UI e backend
- mover regras criticas para o servidor
- tratar o frontend local como fallback, nao como fonte principal
- preservar a experiencia atual enquanto a persistencia migra
