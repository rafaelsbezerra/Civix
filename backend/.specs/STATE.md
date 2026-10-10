# Decisões do backend

## Confirmado pelo usuário

- Commit documental antes da implementação; tarefas em branches/worktrees,
  integração das dependências e PRs para `staging` (substitui sem commit).
- Implementar a base sem adotá-la nos fluxos atuais; atualizar docs sempre.
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
- Prisma 8 com migrations TypeScript nativas e reversão por migration inversa
  aprovado; substitui exigência literal de funções `up`/`down`.
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
| BE-02 | Erro | status/message em produção; diagnóstico sanitizado fora de produção aprovado; catálogo específico futuro | Confirmado |
| BE-03 | Paginação | Parâmetros, limites, meta, vazio, além do fim e ordem nome/ID aprovados; campos extras de ordenação e abrangência pendentes | Parcialmente confirmado |
| BE-04 | Idioma e arquivos | Inglês aprovado; kebab-case, sufixos e estilo funcional/classes pendentes | Parcialmente confirmado |
| BE-05 | Pastas | Manter pastas globais por função; nomes de novas pastas transversais pendentes | Parcialmente confirmado |
| BE-06 | Persistência desacoplada | Interface de repositório e adapter em memória para testes; SQL no adapter | Aguardando resposta |
| BE-07 | Migrations | Prisma 8 TS e migration inversa aprovados; versão publicada e configuração a verificar | Parcialmente confirmado |
| BE-08 | Banco e baseline | PostgreSQL confirmado; existência de dados e baseline por confirmar | Parcialmente confirmado |
| BE-09 | Modelo canônico | Resolver `users` versus `user`, identidade versus empresa, campos e vínculos mínimos | Aguardando resposta |
| BE-10 | Padrões adicionais | Validação, serialização, filtros/ordenação, requestId/logs e configuração | Aguardando resposta |

Respostas iniciais registradas acima. Questões adicionais foram apresentadas
para resolver runner/Prisma, detalhes HTTP, abrangência e banco novo.
Detalhes não respondidos permanecem **Aguardando resposta**.
BE-09 depende do modelo de identidade; não escolher tabela pelo uso atual.
BE-10 é sugestão de escopo, ainda não aprovada.

## Estado da entrega

Specs atualizadas para implementação da base passiva. Nenhuma tarefa de implementação concluída. Nenhum banco
provisionado, migration executada, dependência alterada ou contrato aplicado.
O código possui consultas SQL/Neon; sua presença não comprova banco pronto.

## Respostas posteriores à criação das specs

- Produção retorna exatamente status/message; fora de produção permite
  diagnóstico sanitizado. A base HTTP está implementada sem ativação nas rotas.
- Empresas: extração de camadas/tipos autorizada, sem mudar contratos atuais.
- Prisma 8: aguardar versão estável; não instalar release candidate. Tooling,
  schema definitivo, baseline e migrations de tabelas ficam pendentes.
- Adoção de contratos e frontend pertence à etapa seguinte.
