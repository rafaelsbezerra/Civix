# Revisão das pendências das specs

Revisão atualizada em 2026-10-12 na branch codex/frontend-backend-integration,
dependente de e229843 (PR #16), com destino à staging. Baseline de merges: bedb73a, revisada em 2026-10-10.
Essa referência já incorpora tooling Prisma 7 pelo PR #7, tipos de auth pelo
PR #12, adoção HTTP pelo PR #13 e auditoria documental pelo PR #14.

Paginação continua sob demanda. O usuário autorizou antecipar repositories
para permitir JSON/PostgreSQL em todos os módulos atuais. Esse modo, caixa de
saída, comando local e cadastro de empresas foram publicados no PR #16.
Services auth/admin também foram separados. A integração atual adapta
consumidores frontend existentes; login foi excluído e schema segue posterior.

Um checkbox concluído indica a entrega descrita; não comprova merge ou
execução no banco. Os estados abaixo distinguem essas situações.

## Entregas que não precisam ser implementadas novamente

| Entrega | Evidência | Integração |
| --- | --- | --- |
| Convenções de arquivos/idioma, pastas por função e controllers independentes | AGENTS.md; company.routes/controller/service | Em staging |
| Empresas e usuários em routes → controller → service | Arquivos company.* e user.* | Em staging |
| Entidades Company/User/Plan, PlanRow e DTOs de usuário | entities/, interfaces/plan.row.ts, dtos/user.auth.dto.ts | Em staging |
| Interfaces e adapters de persistência | repositories + persistence; empresas/usuários/auth/planos | Publicados no PR #16; unificação users revisada nesta branch |
| Contratos de erro, sucesso e helpers de paginação | src/shared/contracts e src/shared/errors | Base em staging |
| Tipos de auth separados do controller | auth.invite.dto.ts e auth.user.row.ts | Integrado em staging via PR #12 |
| Adoção de AppError/ErrorCode e sucesso em todos os endpoints backend | app.ts, controllers, middleware e services; sem reason/switch | Integrado em staging via PRs #13/#14 |
| Diagnóstico sanitizado fora de produção; produção status/message | error.contract.ts; handler global e parser 400/413 | Integrado em staging via PRs #13/#14 |
| Alinhamento Prisma CLI/client/adapter 7.10.0 e verificação offline | package/lockfile/config e prisma.tooling.test.mjs | Integrado em staging via PR #7/eea5f1d |
| Modo local, cadastro protegido, outbox e bootstrap | spec dados-locais; services/adapters; POST empresas | Publicado no PR #16 |
| Services auth/admin e remoção do tipo local de admin | auth.service.ts, admin.service.ts, AuthRepository | Publicado no PR #16 |

O PR #14 contém o resultado combinado de #12/#13; não exige reaplicar seus
mesmos commits. A resolução preserva os scripts atuais de testes e os caminhos
src/shared, além do tooling Prisma já integrado à staging.

## Unificação de usuários — 2026-10-12

Na branch codex/json-postgres-repositories, consultas PostgreSQL e JSON usam
somente users para convite, ativação, login, recuperação e seleção de plano.
A divergência de nomes user/users (INT-02) está resolvida no código desta
branch; não afirmar merge em staging ou migração do banco. JSONs antigos são
modificados explicitamente para reunir seus registros em users, sem conversão
automática no carregamento.

Na entrega da unificação, schema/baseline e protocolos de tokens ainda
estavam pendentes. A integração posterior alinha pré-validação/ativação do
convite; reenvio/reset divergente e schema permanecem pendentes.
Login bloqueia pending e preserva contas atuais sem status; convites não
substituem contas ativas ou atuais sem status.
Esta atualização passou por code review independente antes da entrega no PR #16;
os resultados de testes abaixo são históricos até nova verificação.

## Pendências atuais

| Grupo | O que falta | Dependência ou limite |
| --- | --- | --- |
| Frontend consumidor (HTTP-04-B) | Adaptar login ao envelope e validar fluxo autenticado completo | Parcial: catálogo/perfil/planos, recuperação/reset e primeiro acesso adaptados nesta branch; login explicitamente excluído |
| Modelo e tipagem (TYP-01 / TYP-04) | Definir campos, vínculos, restrições, invariantes e serialização/validação canônicas | Nome users confirmado; schema completo ainda não definido |
| Migrations (MIG-02 / MIG-03-C / MIG-04) | Decidir destino dos SQL antigos, criar schema/baseline e comandos operacionais | PostgreSQL novo, Prisma 7 SQL nativo e migration inversa já confirmados |
| Prova em PostgreSQL (MIG-05) | Aplicação do zero, reaplicação, status, falha e recuperação/inversa em banco temporário | Testes offline não comprovam esse ciclo |

## Evoluções fora das pendências atuais

- **Paginação — sob demanda (HTTP-03-A):** helpers e contrato permanecem
  disponíveis. Definir listagens, filtros e ordenação apenas quando uma
  funcionalidade precisar de paginação; não há adoção SQL nesta etapa.

HTTP-03-A permanece fora dos checklists ativos e não foi marcado como concluído.
REP-02 foi concluído no escopo dos módulos atuais pelo modo local autorizado;
SQL está nos adapters PostgreSQL. A execução de um banco real não é comprovada
por esses testes e continua no grupo de migrations/schema.

## Propostas que aguardam definição

Geração/propagação de requestId, logging central e configuração runtime/CI
continuam propostas de BE-10, sem aprovação de implementação. O diagnóstico
sanitizado e o requestId opcional já existem. Validação e serialização canônicas
estão na pendência de modelo/tipagem, sujeitas à definição de sua política.

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
as divergências registradas; nenhuma mudança de requisitos/layout Home/Sobre
foi autorizada. A integração de consumidores existentes não resolve AD-002.

## Limites e próximos passos

A revisão documental original alterou somente Markdown. A entrega de
2026-10-12 altera código, scripts e testes do backend para o modo local, sem
instalar dependências, mudar schema ou executar migrations. Fonte e testes
foram revisados por subagentes. Guia: [dados locais](dados-locais.md).

As entregas de base e adoção backend já estão integradas em staging.
Escolher a próxima pendência atual de implementação.
A definição do modelo é necessária antes da baseline SQL; o consumidor
frontend de login ainda precisa de adaptação antes de considerar o fluxo
autenticado completo integrado.

## Verificação do modo local — 2026-10-12

50 testes de foundation aprovados; typechecks foundation e contratos passaram.
TypeScript completo passou em fixture com as dependências declaradas Prisma
7.10.0 já disponíveis. A instalação desta checkout ainda contém CLI 6.12.0 e
mantém a incompatibilidade de prisma.config.ts no check completo local.
Não houve instalação, banco real, envio externo, migration ou commit.
## Organização dos repositories — 2026-10-12

Implementações JSON e PostgreSQL separadas em persistence/json e
persistence/postgres, com arquivos domínio.repository.ts e exports terminados
em Repository. As interfaces existentes em repositories foram preservadas;
implementações e seletores continuam explicitamente tipados por elas.
Imports dos services/testes foram ajustados, sem alterar contratos ou dados.
A reorganização inicialmente local foi publicada no PR #16, base da branch
de integração atual. Nenhum merge em staging é presumido. Estrutura e links em
[dados locais](dados-locais.md).

## Integração parcial dos consumidores — 2026-10-12

Concluídos nesta branch: data/message nos helpers e páginas existentes
exceto login; base de API comum, prefixos corretos, busca com q, campos
snake_case e link de recuperação. Pré-validação e ativação compartilham
JWT de convite, perfil/status e invite_token; INT-03 resolvido para esse fluxo.
ResetTokenRow/consulta de reset na pré-validação foram removidos.

Continuam pendentes: login explicitamente excluído; reenvio com protocolo
divergente (INT-04); dashboard/rotas ausentes; modelo/schema/migrations;
requisitos Home/Sobre AD-002. Não marcar HTTP-04-B como concluído integralmente.
Sem UI nova de seleção de plano ou cadastro de empresas.

Passaram 25 testes direcionados frontend e 60 backend, typechecks
frontend/foundation/contratos e Vite. Build completo falha no gate histórico
de assets Sobre; lint falha em SignSelect preexistente. Sem dependências novas
ou banco real. Ver [integração](frontend-backend.md).
