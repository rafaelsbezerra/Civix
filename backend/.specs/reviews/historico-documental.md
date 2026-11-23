# Histórico documental e verificações

## Validação histórica da revisão inicial

- Commit local e remoto de staging conferidos: `5db3c5b`.
- Código de entrada, routers, controllers, services, schema/migrations,
  manifests, configs, UI/consumidores e specs locais examinados.
- Documentação acessível do Notion lida e preservada com origem e data.
- Revisão de referências e integridade dos arquivos docs realizada.

Não há node_modules nos diretórios das aplicações. Testes, lint, build,
browser e consultas ao banco não foram executados. Os achados são
estáticos; não se afirma aprovação de execução ou disponibilidade do
produto. Relatórios históricos de PASS foram lidos apenas como fontes.

## Histórico do escopo documental — 2026-10-10

Paginação será usada somente quando necessário; implementação e consumo de
repositories ficam para uma etapa futura. Ambos estão fora das pendências
atuais. Frontend, camadas de auth/admin, schema/baseline, comandos operacionais
e prova de migrations em PostgreSQL permanecem no relatório de pendências.
Esta atualização altera apenas Markdown; não reexecuta testes, build ou
migrations e não altera as evidências históricas de execução.

## Entrega

Commit documental antes da implementação. Tarefas em branches e worktrees;
dependências reunidas em branch de integração. PRs para `staging`, com o que,
como, por quê, verificações, próximos passos e SQL quando houver nova tabela.

Specs e decisões: [backend/.specs](../README.md).
Verificação desta adoção é reportada na entrega; testes históricos abaixo são da extração anterior.

## Índice documental anterior

# Documentação do Civix

A revisão inicial de 2026-10-09 foi feita na staging 5db3c5b e permanece
como histórico. A atualização de 2026-10-10 reflete staging bedb73a, que já
incorpora base Prisma 7, tipos de auth, adoção HTTP e auditoria documental.
Paginação será usada somente quando necessário, fora das pendências atuais.
Em 2026-10-12, o modo local foi autorizado e implementado no checkout staging,
sem commit: adapters JSON/PostgreSQL, caixa de saída e cadastro de empresas.
Essa necessidade antecipou o uso de repositories nos módulos atuais.

Consulte a [revisão de pendências das specs](revisao-pendencias-specs.md):
itens integrados, pendências atuais, evoluções futuras e divergências do frontend.

## Guia de leitura

- [Modo local persistido em JSON e configuração da flag](../../../docs/dados-locais.md).

- [Base de padrões do backend e etapa de adoção](../../../docs/padroes-backend.md).
- [Visão de produto e requisitos](../../../docs/produto.md).
- [Arquitetura, módulos e persistência atuais](../../../docs/arquitetura.md).
- [API e contratos observados](../../../docs/api.md).
- [Diagnóstico da integração staging](diagnostico.md).
- [Execução, infraestrutura e validação](../../../docs/operacao.md).
- [Decisões pendentes e preparação da próxima fase](../decisions/decisoes.md).
- [Snapshot integral da página Civix no Notion](../../../docs/fontes/notion-civix.md).

## Fontes e limites

A busca por `Civix`, por `UrbanSync` e pelos descendentes da página Civix
retornou uma única página acessível, sem outras páginas de projeto.
O conteúdo retornado inclui requisitos, SQL, convenções, arquitetura,
telas e perguntas. Não houve indicador explícito de truncamento ou blocos
desconhecidos no resultado. A documentação disponível foi preservada;
isso não comprova a inexistência de páginas privadas fora do acesso do conector.

O [Notion](https://app.notion.com/p/3a05228ef45d80ba8ecef017c05f6e31)
informa última edição em 2026-09-03 e estado não verificado. As specs locais
de [Home](../../../frontend/.specs/features/home-hero/spec.md) e
[Sobre](../../../frontend/.specs/features/about-page/spec.md), seus contextos,
designs, tarefas e relatórios foram confrontados com o código atual.
Relatórios antigos de PASS não validam a união atual das features.

Nesta documentação, **atual** significa observado no código;
**previsto** significa descrito pelas fontes; **pendente** indica implementação,
verificação ou decisão ainda necessária. Quando faltar aprovação, registra-se
**Aguardando resposta**. Não presumir que toda pendência é uma pergunta ainda aberta.
Sugestões para a próxima fase não constituem contratos aprovados.
A auditoria das specs é documental; não altera implementação, migrations ou infraestrutura.

## Frontend: integração e animações

- [Integração com o backend](../../../docs/frontend-backend.md): contratos dos consumidores existentes e limites do escopo.
- [Plano de animações](../../../frontend/.specs/features/entry-animations/design.md): mapa das entradas por página/componente e biblioteca sugerida, aguardando aprovação.
