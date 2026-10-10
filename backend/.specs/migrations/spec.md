# Base de migrations — Prisma 7

Estado: tooling implementado e verificado sem banco. Prisma 7.10.0 com SQL
nativo, PostgreSQL novo e nome canônico `users` aprovados. Campos, vínculos e
restrições do schema comercial: **Aguardando resposta**.

## Problema e escopo

O diagnóstico inicial encontrou CLI 6 com client/adapter 7. Esta entrega fixa
os três pacotes em 7.10.0 e preserva `prisma.config.ts`, validado com URL local
fictícia. O schema continua sem models; as duas migrations SQL existentes de
planos não são uma baseline completa e não foram alteradas ou aplicadas.

Prisma Migrate será o único responsável pelo histórico. Não haverá runner
TypeScript paralelo, funções up/down ou conversão de SQL por troca de extensão.
A aprovação de Prisma 8 foi substituída pela decisão por Prisma 7.

## Política aprovada

- Migration concluída: alterar o schema para o estado desejado e criar uma
  nova migration inversa. Preservar o histórico aplicado.
- Migration falha: inspecionar o estado, recuperar mudanças parciais quando
  necessário e reconciliar o histórico com `migrate resolve`. Marcar
  `--rolled-back` não desfaz SQL; `db execute` não registra migrations.
- Uma inversa de schema não recupera dados removidos. Preservação de dados e
  transações precisam ser avaliadas por mudança antes da aplicação.
- Não executar migrations automaticamente ao importar módulos ou iniciar API.
- Não conectar nem provisionar banco nesta entrega.

Referência: [recuperação de falhas no Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/patching-and-hotfixing).

## Tarefas e aceite

- [x] MIG-01: Confirmar mecanismo, versões e política de reversão.
  Prisma Migrate/SQL nativo; CLI/client/adapter exatos em 7.10.0.
- [x] MIG-02: Preparar dependências e verificar configuração sem banco.
  Manifesto/lockfile alinhados; TypeScript completo e validate passaram.
- [x] MIG-03: Verificar geração isolada de cliente e SQL de criação/inversão.
  `npm run test:prisma`: três testes, fixture MigrationProbe temporária,
  sem adicionar models/tabelas comerciais e sem aplicar SQL.
- [ ] MIG-04: Definir schema mínimo e baseline de banco vazio.
  **Aguardando resposta:** campos, relações e restrições; destino do histórico
  SQL de planos. O nome users já está confirmado.
- [ ] MIG-05: Discutir comandos operacionais após a implementação.
  `migrations:apply`, `migrations:show` e `migrations:rollback` são propostas;
  não há scripts com esses nomes nem rollback automático nesta entrega.
- [ ] MIG-06: Validar ciclo em PostgreSQL temporário autorizado.
  Aplicar do zero, reaplicar sem duplicação, consultar histórico, testar falha,
  recuperação e uma nova migration inversa. Esta evidência ainda não existe.

A geração de SQL não comprova execução ou recuperação em PostgreSQL.
Atualizar [operação](../../../docs/operacao.md) e
[padrões](../../../docs/padroes-backend.md) em cada etapa de adoção.