# Documentação do Civix

Baseline revisada em 2026-10-09: `staging`, commit
`5db3c5bb1a2400c687093b94b82440c7a6040764`.
A referência remota foi conferida com `git ls-remote` e coincide com a local.
A baseline documental foi commitada. A base de padrões está sendo entregue em branches com PRs para `staging`; sua adoção nos fluxos atuais será posterior.
A revisão e os links para fontes de código e specs se referem ao commit
da `staging` acima.

## Guia de leitura

- [Base de padrões do backend e etapa de adoção](padroes-backend.md).
- [Visão de produto e requisitos](produto.md).
- [Arquitetura, módulos e persistência atuais](arquitetura.md).
- [API e contratos observados](api.md).
- [Diagnóstico da integração staging](diagnostico.md).
- [Execução, infraestrutura e validação](operacao.md).
- [Decisões pendentes e preparação da próxima fase](decisoes.md).
- [Snapshot integral da página Civix no Notion](fontes/notion-civix.md).

## Fontes e limites

A busca por `Civix`, por `UrbanSync` e pelos descendentes da página Civix
retornou uma única página acessível, sem outras páginas de projeto.
O conteúdo retornado inclui requisitos, SQL, convenções, arquitetura,
telas e perguntas. Não houve indicador explícito de truncamento ou blocos
desconhecidos no resultado. A documentação disponível foi preservada;
isso não comprova a inexistência de páginas privadas fora do acesso do conector.

O [Notion](https://app.notion.com/p/3a05228ef45d80ba8ecef017c05f6e31)
informa última edição em 2026-09-03 e estado não verificado. As specs locais
de [Home](../frontend/.specs/features/home-hero/spec.md) e
[Sobre](../frontend/.specs/features/about-page/spec.md), seus contextos,
designs, tarefas e relatórios foram confrontados com o código atual.
Relatórios antigos de PASS não validam a união atual das features.

Nesta documentação, **atual** significa observado no código;
**previsto** significa descrito pelas fontes; **pendente** significa que
não existe decisão suficiente. Sugestões para a próxima fase não constituem
contratos aprovados. Na revisão inicial de 2026-10-09, nenhuma implementação, migration ou configuração de
infraestrutura foi alterada. A base posterior e suas verificações estão em [padrões do backend](padroes-backend.md).
