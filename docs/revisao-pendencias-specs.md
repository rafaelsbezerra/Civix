# Revisão das pendências das specs

Auditoria documental em 2026-10-10. Referências originais: staging `e2b3d8b`,
integração HTTP `ee74823` ([PR #14](https://github.com/rafaelsbe/Civix/pull/14))
e tooling Prisma `48eb252` ([PR #8](https://github.com/rafaelsbe/Civix/pull/8)).
Atualização após merges: staging 7b976d7 incorpora tooling Prisma via PR #7
(ea5f1d) e tipos de auth via PR #12. Os estados abaixo refletem essa integração.
A revisão compara specs, código, configurações e evidências das entregas;
não executa implementação, banco, migrations, frontend ou novos testes.

Um checkbox concluído indica a entrega descrita; não comprova merge ou
execução no banco. Os estados abaixo distinguem essas situações.

## Entregas que não precisam ser implementadas novamente

| Entrega | Evidência | Integração |
| --- | --- | --- |
| Convenções de arquivos/idioma, pastas por função e controllers independentes | AGENTS.md; company.routes/controller/service | Em staging |
| Empresas e usuários em routes → controller → service | Arquivos company.* e user.* | Em staging |
| Entidades Company/User/Plan, PlanRow e DTOs de usuário | entities/, interfaces/plan.row.ts, dtos/user.auth.dto.ts | Em staging |
| Interfaces UserRepository/CompanyRepository/PlanRepository | src/repositories/*.repository.ts; sem implementação | Em staging |
| Contratos de erro, sucesso e helpers de paginação | src/shared/contracts e src/shared/errors | Base em staging |
| Tipos de auth separados do controller | auth.invite.dto.ts e auth.user.row.ts | Integrado em staging via PR #12 |
| Adoção de AppError/ErrorCode e sucesso em todos os endpoints backend | app.ts, controllers, middleware e services; sem reason/switch | Implementado nos PRs #13/#14 |
| Diagnóstico sanitizado fora de produção; produção status/message | error.contract.ts; handler global e parser 400/413 | Implementado nos PRs #13/#14 |
| Alinhamento Prisma CLI/client/adapter 7.10.0 e verificação offline | package/lockfile/config e prisma.tooling.test.mjs | Integrado em staging via PR #7/eea5f1d |

O PR #14 contém o resultado combinado de #12/#13; não exige reaplicar seus
mesmos commits. A resolução preserva os scripts atuais de testes e os caminhos
src/shared, além do tooling Prisma já integrado à staging.

## Pendências reais do backend

| Grupo | O que falta | Dependência ou limite |
| --- | --- | --- |
| Frontend consumidor | Ler data nos sucessos e message nos erros; retirar success e envelopes antigos | Explicitamente adiado; login, primeiro acesso, catálogo, perfil e planos afetados |
| Paginação | Definir listagens abrangidas; LIMIT/OFFSET/COUNT, filtros e ordenação estável; testes de página além do fim e contagem filtrada | Helpers prontos; adoção no banco ainda não existe |
| Camadas auth/admin | Retirar SQL/regras dos controllers para services; extrair tipo local restante de admin | O escopo de extração anterior cobria apenas user; não há autorização de implementação nesta auditoria |
| Persistência | Implementar repositories e adotá-los nos services | Somente interfaces foram aprovadas/entregues nesta fase |
| Modelo e tipagem | Definir campos, vínculos, restrições, invariantes e serialização/validação canônicas | Nome users confirmado; schema completo ainda não definido |
| Migrations | Decidir destino dos SQL antigos, criar schema/baseline e comandos operacionais | PostgreSQL novo, Prisma 7 SQL nativo e migration inversa já confirmados |
| Prova em PostgreSQL | Aplicação do zero, reaplicação, status, falha e recuperação/inversa em banco temporário | Testes offline não comprovam esse ciclo |
| Padrões adicionais | Validação geral de inputs, datas/IDs/null, filtros e configuração; política operacional de logs/requestId | Diagnóstico sanitizado e requestId opcional já existem; novos padrões aguardam definição |

Prisma 8, espera por release estável e funções up/down não são pendências:
a decisão vigente é Prisma 7, SQL nativo e uma nova migration inversa.
A reversão não recupera automaticamente dados removidos; a política de cada
migration e sua prova de recuperação continuam necessárias.

A adoção HTTP foi verificada na entrega: 36 testes aprovados,
typecheck:foundation e typecheck:contracts aprovados. O TS2353 causado pela
CLI 6 era uma limitação da entrega original; foi corrigido pela integração
do tooling Prisma 7 e não representa uma tarefa de erro/sucesso pendente.

## Frontend: implementação preservada e divergências

Home conserva tokens/fontes, assets locais, ActionButton, menu responsivo,
formulário local e metadados. Sobre conserva conteúdo institucional,
princípios, componentes e tokens. Os relatórios PASS de agosto são históricos:
não validam automaticamente a composição atual de staging.

| Divergência observada | Evidência | Estado |
| --- | --- | --- |
| Sobre sem rota /sobre; incorporado na Home | AppRoute.tsx e pages/Home.tsx | Confirmar requisito vigente |
| Home incorpora outro main e h1 de About | pages/Home.tsx e pages/About.tsx | Diverge dos critérios de landmarks da Home |
| Header usa novos destinos, incluindo /planos sem rota | SiteHeader.tsx e AppRoute.tsx | Confirmar navegação vigente |
| Manifest/testes de Sobre esperam dashboard.png e macbook-silver.png, ausentes no código atual | src/assets/civix/about, AboutVisual e testes de assets | Confirmar assets vigentes e alinhar testes |
| Geometria, responsividade, zoom, CLS, contraste e bundle do checkout atual | Relatórios antigos e scripts presentes | Validação atual não executada nesta auditoria |
| Hashes crus de SVG dependem de CRLF/LF | Assets coincidem após normalização das quebras de linha | Conferir política de bytes ao alinhar testes |

**Orientação confirmada pelo usuário em 2026-10-10:** registrar as divergências
como aguardando confirmação, sem exigir retorno ao layout antigo. Essa
orientação não aprova automaticamente todos os detalhes da composição atual
nem reabre as tarefas históricas para restauração.

**Aguardando resposta:** definição dos requisitos vigentes de Home/Sobre,
incluindo navegação, rota, assets e composição. Até essa definição, manter
as divergências registradas; nenhuma alteração de frontend foi autorizada.

## Limites e próximos passos

Atualizados estados/checklists sem declarar concluídas as partes ausentes.
Não foram alterados fonte, testes executáveis, dependências, schema ou migrations.
As evidências foram conferidas por subagentes e pela revisão do código.

Integrar as entregas prontas e escolher a próxima pendência de implementação.
A definição do modelo é necessária antes da baseline SQL; consumidores
frontend precisam de adaptação antes de considerar o fluxo integrado.
