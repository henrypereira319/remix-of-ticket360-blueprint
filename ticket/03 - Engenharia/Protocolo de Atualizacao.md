---
tags:
  - engenharia
  - documentacao
  - processo
---

# Protocolo de Atualizacao

## Regra principal

Toda alteracao relevante no projeto deve ser registrada no Obsidian, dentro do vault `ticket/`, no mesmo ciclo de trabalho.

`AGENTS.md` na raiz do repositorio agora funciona como instrução operacional resumida para qualquer agente que trabalhar no projeto.

## O que isso significa na pratica

- se algum arquivo fora de `ticket/` foi alterado, pelo menos uma nota Markdown dentro de `ticket/` tambem deve ser atualizada
- mudancas apenas em `ticket/.obsidian/workspace.json` nao contam como documentacao
- a nota escolhida deve refletir o que mudou, o impacto e o proximo estado do trabalho
- o agente deve trabalhar assumindo backend real como direcao principal, sem esconder regra sensivel apenas no client
- alteracoes relevantes de frontend devem considerar desktop e mobile

## Onde registrar

Escolha a nota mais proxima da mudanca:

- [[02 - Projeto/Estado Atual]]
- [[04 - Operacao/Proximos Passos]]
- uma nota tecnica em `03 - Engenharia`
- uma nota de area que venha a ser criada para a feature trabalhada

## Quando atualizar tambem fora do vault

Se a entrega mudou marco, completude ou ordem de execucao do projeto, atualizar tambem:

- `../progress.txt`
- `../checklist-roadmap.md`

## Regra de commit

O repositorio possui uma checagem de pre-commit que bloqueia commit de mudancas no projeto sem uma nota Markdown correspondente no vault.

## Leitura operacional recomendada para agentes

Antes de mexer forte no projeto, ler:

- `../progress.txt`
- `../checklist-roadmap.md`
- `../AGENTS.md`
- [[03 - Engenharia/Arquitetura]]
- [[04 - Operacao/Proximos Passos]]

## Template rapido de registro

Use pelo menos estes pontos:

- o que mudou
- por que mudou
- impacto tecnico ou de produto
- proximo passo
