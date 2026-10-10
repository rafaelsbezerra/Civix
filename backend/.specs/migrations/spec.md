# Migrations — base Prisma 7

Estado: tooling implementado nesta branch e alinhado à staging e2b3d8b.
CLI/client/adapter fixados em 7.10.0; SQL nativo, banco novo PostgreSQL e
nome canônico users confirmados. Schema comercial e aplicação no banco
continuam pendentes. Os PRs #7/#8 permanecem abertos para merge pelo usuário.

## Decisões e limites

Prisma Migrate é o único responsável pelo histórico. Não criar runner TS
paralelo ou funções up/down; a decisão anterior por Prisma 8 foi substituída.
Migration concluída é revertida por uma nova inversa. Migration falha exige
inspeção/recuperação e reconciliação; migrate resolve não desfaz SQL.
Uma inversa não recupera dados removidos. Transações e preservação de dados
precisam ser avaliadas por mudança.

prisma/schema.prisma continua sem models. As duas migrations SQL de planos
foram preservadas; não são uma baseline completa e não foram aplicadas.
Não executar migrations automaticamente ao importar/iniciar a API, nem
contra banco remoto ou produção.

## Tarefas e aceite — IDs originais preservados

- [x] MIG-01: Confirmar runner, PostgreSQL, formato e reversão.
  Prisma 7/SQL nativo, nova migration inversa, PostgreSQL criado do zero.
- [ ] MIG-02: Definir destino das migrations SQL e baseline canônica.
  Banco novo confirmado. **Aguardando resposta:** schema mínimo e destino
  dos SQL atuais de planos antes da baseline.
- [ ] MIG-03: Configurar scripts, runner, histórico e ambiente completos.
  Parcial: tooling/dependências/configuração e testes offline implementados;
  comandos operacionais e prova de histórico no banco ainda pendentes.
- [x] MIG-03-A: Preparar dependências/configuração e provas offline.
  Manifesto/lockfile fixam 7.10.0; test:prisma verifica validate/generate,
  SQL de criação/inversão e versões. Sem modelos comerciais ou banco real.
- [ ] MIG-03-B: Integrar esta entrega à staging remota.
  Conflitos resolvidos nas branches existentes dos PRs #7/#8; merge é do usuário.
- [ ] MIG-03-C: Discutir/implementar comandos operacionais.
  migrations:apply/show/rollback são propostas para discussão posterior;
  não estão disponíveis nem representam rollback automático nesta base.
- [ ] MIG-04: Implementar schema mínimo e evolução de dados aprovada.
  **Aguardando resposta:** campos, vínculos, restrições e dados. Nome users
  confirmado não autoriza mudar consultas user/users nesta resolução.
- [ ] MIG-05: Verificar ciclo em PostgreSQL temporário e atualizar operação.
  Aplicar do zero, reaplicar, consultar status, testar falha/recuperação e
  inversa. Geração offline de SQL não comprova esse ciclo.

## Verificação

O teste tests/prisma.tooling.test.mjs usa fixture temporária MigrationProbe
e URL fictícia, sem carregar a configuração real ou aplicar SQL. Sua limpeza
valida que os caminhos permanecem dentro da fixture criada pelo teste.
Resolução verificada: test:prisma (3 testes) e test:foundation (27 testes)
aprovados; typecheck:foundation, typecheck:contracts e TypeScript completo
passaram. Diff contra staging sem problemas. Sem acesso a banco remoto
ou execução de migrations.

Referências: [avaliação](avaliacao-prisma.md), [operação](../../../docs/operacao.md)
e [padrões](../../../docs/padroes-backend.md).
