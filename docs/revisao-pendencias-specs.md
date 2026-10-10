# Revisão das pendências das specs

Revisão documental em 2026-10-10 sobre `staging`, commit `bedb73a`.
Essa referência já incorpora tooling Prisma 7 pelo PR #7, tipos de auth pelo
PR #12, adoção HTTP pelo PR #13 e auditoria documental pelo PR #14.

Decisão posterior do usuário: paginação será adotada somente quando houver
necessidade; implementação e uso de repositories ficam para uma etapa futura.
Ambos foram retirados das pendências atuais, preservando a base já criada.

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
| Adoção de AppError/ErrorCode e sucesso em todos os endpoints backend | app.ts, controllers, middleware e services; sem reason/switch | Integrado em staging via PRs #13/#14 |
| Diagnóstico sanitizado fora de produção; produção status/message | error.contract.ts; handler global e parser 400/413 | Integrado em staging via PRs #13/#14 |
| Alinhamento Prisma CLI/client/adapter 7.10.0 e verificação offline | package/lockfile/config e prisma.tooling.test.mjs | Integrado em staging via PR #7/eea5f1d |

O PR #14 contém o resultado combinado de #12/#13; não exige reaplicar seus
mesmos commits. A resolução preserva os scripts atuais de testes e os caminhos
src/shared, além do tooling Prisma já integrado à staging.

## Pendências atuais

| Grupo | O que falta | Dependência ou limite |
| --- | --- | --- |
| Frontend consumidor (HTTP-04-B) | Ler data nos sucessos e message nos erros; retirar success e envelopes antigos | Explicitamente adiado; login, primeiro acesso, catálogo, perfil e planos afetados |
| Camadas auth/admin (MOD-04-C / TYP-02-C) | Retirar SQL/regras dos controllers para services; extrair tipo local restante de admin | O escopo de extração anterior cobria apenas user; não há autorização de implementação nesta auditoria |
| Modelo e tipagem (TYP-01 / TYP-04) | Definir campos, vínculos, restrições, invariantes e serialização/validação canônicas | Nome users confirmado; schema completo ainda não definido |
| Migrations (MIG-02 / MIG-03-C / MIG-04) | Decidir destino dos SQL antigos, criar schema/baseline e comandos operacionais | PostgreSQL novo, Prisma 7 SQL nativo e migration inversa já confirmados |
| Prova em PostgreSQL (MIG-05) | Aplicação do zero, reaplicação, status, falha e recuperação/inversa em banco temporário | Testes offline não comprovam esse ciclo |

## Evoluções fora das pendências atuais

- **Paginação — sob demanda (HTTP-03-A):** helpers e contrato permanecem
  disponíveis. Definir listagens, filtros e ordenação apenas quando uma
  funcionalidade precisar de paginação; não há adoção SQL nesta etapa.
- **Repositories — etapa futura (REP-02):** interfaces permanecem disponíveis;
  implementação e consumo pelos services ficam para mais adiante. SQL atual
  continua nos services; essa adoção não bloqueia as entregas atuais.

Nenhuma dessas evoluções foi marcada como concluída. Os IDs são preservados
para rastreabilidade, fora dos checklists de execução atuais.

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
as divergências registradas; nenhuma alteração de frontend foi autorizada.

## Limites e próximos passos

Atualizados estados/checklists sem declarar concluídas as partes ausentes.
Não foram alterados fonte, testes executáveis, dependências, schema ou migrations.
As evidências foram conferidas por subagentes e pela revisão do código.

As entregas de base e adoção backend já estão integradas em staging.
Escolher a próxima pendência atual de implementação.
A definição do modelo é necessária antes da baseline SQL; consumidores
frontend precisam de adaptação antes de considerar o fluxo integrado.
