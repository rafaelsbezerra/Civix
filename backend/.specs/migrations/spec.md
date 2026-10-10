# Migrations — Prisma 7 e SQL nativo

Estado: mecanismo aprovado; tooling integrado à staging via PR #7 (eea5f1d),
presente na referência 7b976d7 e nesta baseline. CLI/client/adapter fixados
em 7.10.0; schema comercial e execução no banco continuam pendentes.
Schema comercial e execução em PostgreSQL permanecem pendentes.

## Decisões confirmadas

Prisma Migrate 7 com SQL nativo será o único dono do histórico; CLI/client/
adapter fixados em 7.10.0 na entrega do tooling. PostgreSQL criado do zero,
nome canônico users. Não usar runner TS paralelo ou funções up/down.
A decisão anterior por Prisma 8/TS e espera de versão estável foi substituída.

- Migration concluída: gerar nova migration inversa, preservando histórico.
- Migration falha: inspecionar/recuperar estado parcial e reconciliar o
  histórico com migrate resolve. --rolled-back não desfaz SQL; db execute
  não registra uma migration. Inversa não recupera dados removidos.
- Transações e preservação de dados devem ser avaliadas por mudança.
- Não aplicar migrations automaticamente na inicialização/importação da API.
- Não executar contra banco remoto ou produção nesta entrega.

## Situação e requisitos

prisma/schema.prisma não possui models. As duas migrations SQL de planos
não constituem uma baseline completa. Seu destino deve ser definido junto
com o schema; não apagar ou reexecutar esse histórico incidentalmente.

Cada migration deve ter identificação/ordem e registro de aplicação pelo
Prisma Migrate. Reexecução não deve duplicar mudanças; falha não deve ser
registrada como sucesso. Separar schema de seeds e dados de demonstração.
Banco vazio deve ser criado com chaves, vínculos, índices e restrições aprovados.

## Tarefas e aceite — IDs originais preservados

- [x] MIG-01: Confirmar runner, PostgreSQL, formato e reversão.
  Decisão: Prisma 7/SQL nativo, banco novo e migration inversa. Os detalhes
  transacionais são avaliados por migration; não são um runner pendente.
- [ ] MIG-02: Definir destino das migrations SQL e baseline canônica.
  Banco vazio já confirmado. **Aguardando resposta:** schema mínimo e
  preservação/substituição dos SQL atuais de planos antes da nova baseline.
- [ ] MIG-03: Configurar scripts, runner, histórico e ambiente completos.
  Parcial: dependências/configuração e provas offline entregues no PR #8;
  comandos operacionais e comportamento em banco pendentes.
- [x] MIG-03-A: Preparar dependências/configuração e provas isoladas.
  Concluído nos PRs #7/#8 e integrado à staging via eea5f1d. Manifesto/lockfile fixam 7.10.0;
  test:prisma possui três testes de validate/generate/SQL criação-inversa.
  A entrega registrou TypeScript completo aprovado em seu próprio worktree.
- [x] MIG-03-B: Integrar tooling à staging atual.
  Integrado via PR #7 em eea5f1d, preservando caminhos e scripts atuais.
- [ ] MIG-03-C: Discutir e implementar comandos operacionais aprovados.
  migrations:apply, migrations:show e migrations:rollback foram propostos
  pelo usuário para discussão posterior; não estão implementados/aprovados
  em detalhe. Não presumir um rollback automático do Prisma.
- [ ] MIG-04: Implementar schema mínimo e evolução de dados aprovada.
  **Aguardando resposta:** campos, relações, restrições e dados necessários.
  Resolver uso atual de user/users sem perpetuar duas identidades canônicas.
- [ ] MIG-05: Verificar ciclo em PostgreSQL temporário e atualizar operação.
  Aplicar do zero, reaplicar, consultar histórico, testar falha/recuperação
  e migration inversa. Nenhuma evidência de execução desse ciclo existe.

## Verificação e limites

PR #8 registra geração de cliente/SQL offline com fixture MigrationProbe e
URL fictícia; não cria modelos comerciais nem aplica SQL em PostgreSQL.
Esta auditoria não reexecutou testes. Geração ou typecheck não comprova
aplicação, atomicidade, recuperação ou reversão de dados no banco.

Referências: [avaliação e histórico](avaliacao-prisma.md),
[operação](../../../docs/operacao.md), [decisões](../STATE.md).
