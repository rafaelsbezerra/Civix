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

- [Modo local persistido em JSON e configuração da flag](dados-locais.md).

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
**previsto** significa descrito pelas fontes; **pendente** indica implementação,
verificação ou decisão ainda necessária. Quando faltar aprovação, registra-se
**Aguardando resposta**. Não presumir que toda pendência é uma pergunta ainda aberta.
Sugestões para a próxima fase não constituem contratos aprovados.
A auditoria das specs é documental; não altera implementação, migrations ou infraestrutura.

## Frontend: integração e animações

- [Integração com o backend](frontend-backend.md): contratos dos consumidores existentes e limites do escopo.
- [Plano de animações](plano-animacoes.md): mapa das entradas por página/componente e biblioteca sugerida, aguardando aprovação.
