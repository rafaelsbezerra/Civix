# Decisões do backend

## Confirmado pelo usuário

- Commit documental antes da implementação; tarefas em branches/worktrees,
  integração das dependências e PRs para `staging` (substitui sem commit).
- A base inicial sem adoção é histórica. Adoção de erro/sucesso em todos os
  endpoints backend agora aprovada; frontend explicitamente adiado.
- Criar specs simples no backend, agrupadas por assunto.
- Padronizar erros, respostas e paginação.
- Seguir routes → controller → service; adequar o módulo de empresas.
- Criar arquivos de entidades/interfaces e melhorar a tipagem.
- Usar scripts executáveis de migration no lugar de arquivos SQL isolados.
- Usar SDD leve + DDD leve e subagentes para tarefas secundárias.
- Perguntar antes de decidir; registrar pendências nos documentos.
- Sucesso `{ data, meta? }`; erro `{ status, message }` em produção e diagnóstico adicional fora de produção.
- Paginação `page`/`pageSize`, base 1, padrão 20, máximo 100, total e
  ordenação estável; adaptação coordenada dos consumidores frontend.
- Código em inglês; manter pastas por função, como routes/controllers/services.
- Prisma 7 com SQL nativo e reversão por nova migration inversa aprovado;
  substitui a decisão histórica por Prisma 8 e funções `up`/`down`.
- Erros em produção: `{ status, message }`. Fora de produção, acrescentar
  `code`, `details`, `requestId` e `stack`, sanitizando credenciais.
- Exceção: reorganizar empresas em route/controller/service/entity/interface,
  mantendo HTTP e comportamento existentes. Frontend na próxima etapa.
- Instalação/configuração da base Prisma autorizada; sem novas tabelas
  comerciais, sem banco remoto; schema definitivo na próxima etapa.
- Validação e paginação inválida retornam 400; criação retorna 201 com data;
  operação sem corpo retorna 204; lista vazia ou página além do fim retorna
  `data: []`. Empresas ordenadas por nome e ID. Metadados:
  `page`, `pageSize`, `total`, `totalPages`. Manter `/api/v1` e adaptar frontend.

## Aguardando resposta

As propostas abaixo não são contratos aprovados.

| ID | Decisão | Proposta para discussão | Estado |
| --- | --- | --- | --- |
| BE-01 | Sucesso e adoção | Envelope, frontend, 201/204 e manutenção de /api/v1 aprovados | Confirmado |
| BE-02 | Erro | status/message em produção; diagnóstico sanitizado fora; enum ErrorCode e handler global aprovados | Confirmado |
| BE-03 | Paginação | Parâmetros, limites, meta, vazio, além do fim e ordem nome/ID aprovados; campos extras de ordenação e abrangência pendentes | Parcialmente confirmado |
| BE-04 | Idioma e arquivos | Identificadores em inglês; arquivos domínio.papel.ts; comentários/erros em português; controller com funções independentes | Confirmado |
| BE-05 | Pastas | Manter pastas globais por função; nomes de novas pastas transversais pendentes | Parcialmente confirmado |
| BE-06 | Persistência desacoplada | Repositories somente interfaces; SQL atual nos services; implementações futuras | Confirmado |
| BE-07 | Migrations | Prisma 7 SQL nativo e migration inversa aprovados; integração do tooling pendente neste checkout | Confirmado |
| BE-08 | Banco e baseline | PostgreSQL e banco criado do zero confirmados; baseline depende do schema | Confirmado |
| BE-09 | Modelo canônico | Nome canônico users confirmado; campos, vínculos e restrições pendentes | Parcialmente confirmado |
| BE-10 | Padrões adicionais | Validação, serialização, filtros/ordenação, requestId/logs e configuração | Aguardando resposta |

Respostas iniciais registradas acima. Questões adicionais foram apresentadas
para resolver runner/Prisma, detalhes HTTP, abrangência e banco novo.
Detalhes não respondidos permanecem **Aguardando resposta**.
BE-09 depende do modelo de identidade; não escolher tabela pelo uso atual.
BE-10 é sugestão de escopo, ainda não aprovada.

## Estado da entrega

Base HTTP e extrações implementadas; adoção de erro/sucesso aprovada e
implementada e verificada nesta tarefa. Frontend, paginação e repositories operacionais
continuam posteriores. Nenhum banco/migration/dependência alterado nesta adoção.
O código possui consultas SQL/Neon; sua presença não comprova banco pronto.

## Respostas posteriores à criação das specs

- Produção retorna exatamente status/message; fora de produção permite
  diagnóstico sanitizado. A restrição inicial sem ativação foi substituída
  pela adoção HTTP de todos os endpoints backend.
- Empresas: extração de camadas/tipos autorizada, sem mudar contratos atuais.
- Prisma 7/SQL nativo substituiu a decisão anterior de aguardar Prisma 8.
  Integração do tooling, schema definitivo, baseline e migrations ficam pendentes neste checkout.
- Contratos de erro/sucesso agora são adotados no backend. Frontend fica
  para a etapa seguinte por decisão explícita; paginação não foi aplicada.

## Convenções confirmadas após os merges — 2026-10-10

Arquivos domínio.papel.ts, nunca camelCase/PascalCase; comentários e erros em
português, identificadores/códigos em inglês. Controller com funções soltas,
importando service diretamente. Sem abstração CompanyQuery; interfaces apenas
para contratos úteis. Correção local na staging, sem commit/PR/worktree nesta
tarefa, conforme instrução explícita. O alvo de migrations é Prisma 7/SQL
nativo; a instalação atual desta staging ainda tem CLI 6 até a integração
da tarefa de tooling.

## Adoção HTTP — 2026-10-10

AppError e ErrorCode substituem reason/switch; erros inesperados usam 500
com causa preservada. JSON de sucesso contém data/meta, sem success/plan/plans
duplicados. Auth/admin preservam regras; admin segue desmontado. Ver
[spec de adoção](adocao-http/spec.md). 36 testes e typechecks isolados passaram; full typecheck bloqueado pelo Prisma preexistente.
