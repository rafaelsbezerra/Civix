# Migrations executáveis

Estado: Prisma 7, PostgreSQL e banco criado do zero confirmados. Nome canônico `users`. Formato SQL nativo aprovado; campos/vínculos **Aguardando resposta**. Não aplicar ao banco remoto.

## Problema e escopo

`prisma/schema.prisma` não possui models. Existem duas migrations SQL para
planos, sem criação completa de users/user/empresas. O package não define
comandos de migration; Prisma CLI e client têm versões principais distintas.

Criar scripts versionados executados por um runner com histórico. Apenas
trocar extensão de SQL ou chamar um arquivo isolado não atende à tarefa.
Scripts podem precisar de SQL para operações específicas; confirmar se o
usuário exige builder/ORM também nas operações internas.

As versões declaradas no projeto (CLI 6 e client 7) precisam ser alinhadas.
O [fluxo documentado do Prisma 7](https://docs.prisma.io/docs/orm/v7/prisma-migrate)
usa migrations SQL; a [documentação atual](https://www.prisma.io/docs/orm/migrations/how-migrations-work)
descreve outra geração do fluxo. Não presumir compatibilidade entre versões.
A decisão atual é Prisma 7; a aprovação anterior de Prisma 8 foi substituída. SQL nativo com Prisma Migrate confirmado; nenhum runner paralelo.
A [avaliação inicial](avaliacao-prisma.md) registra os resultados e a decisão
ainda necessária. Um único mecanismo deve
ser responsável por aplicar e registrar cada migration.

Não conectar nem provisionar banco nesta entrega. Testes reais de migrations
pertencem à implementação, em PostgreSQL temporário/local autorizado.

## Requisitos

- MIG-01: Cada migration possui identificação única, ordem determinística,
  execução pelo runner e registro de aplicação; repetir execução não reaplica
  migrations já concluídas.
- MIG-02: Comandos documentados permitem criar, aplicar e consultar status.
  Reversão e transações obedecem política aprovada, com falhas explícitas.
- MIG-03: Banco vazio é inicializado a partir do modelo mínimo aprovado,
  respeitando chaves, vínculos, índices e restrições necessários.
- MIG-04: Separar mudanças de schema de seeds/dados de demonstração; preservar
  evolução de dados de planos se necessária. Não inserir segredos nos scripts.
- MIG-05: Não apagar ou substituir histórico aplicado antes de confirmar
  existência de banco e política de compatibilidade.
- MIG-06: Migration nunca roda automaticamente por efeito colateral de
  importar módulo ou iniciar API, salvo decisão explícita futura.

## Tarefas e aceite

Etapa atual: preparar tooling/configuração e validação isolada. MIG-02/04 e
o ciclo em banco de MIG-05 dependem da definição do schema e da adoção.
Preservar histórico SQL atual sem reexecutar ou apagar.

- [ ] MIG-01: Escolher runner e confirmar PostgreSQL, Prisma e SQL interno.
  Aceite: alternativa aprovada com motivo; scripts TypeScript ou formato
  escolhido, versões compatíveis e política de transação/rollback registrada.
- [ ] MIG-02: Definir destino das migrations SQL e baseline canônica.
  Depende do modelo de domínio e da confirmação de banco existente.
  Aceite: plano para banco vazio; se houver banco aplicado, caminho de
  preservação sem reset destrutivo ou perda de dados.
- [ ] MIG-03: Configurar scripts, runner, histórico e ambiente.
  Aceite: comandos documentados; falta de configuração gera erro claro;
  reexecução não duplica histórico; falha não registra aplicação bem-sucedida.
- [ ] MIG-04: Implementar schema mínimo e evolução de dados aprovada.
  Aceite: todas as estruturas necessárias aos módulos existentes criadas,
  sem perpetuar a divergência `user`/`users` ou definir produto não aprovado.
- [ ] MIG-05: Verificar ciclo completo e atualizar operação/arquitetura.
  Aceite: aplicar do zero, reaplicar sem mudanças, consultar status e testar
  falha; validar rollback se suportado, ou recuperação explícita se irreversível.

Não declarar sucesso apenas por typecheck: a execução precisa de banco
temporário. Até existir essa evidência, registrar validação como pendente.

## Decisões atuais

Usar Prisma 7 e banco criado do zero; nome canônico users. A proposta é fixar CLI/client/adapter em 7.10.0. SQL nativo confirmado. Campos e relações do schema continuam pendentes. Comandos migrations:apply/show/rollback serão discutidos após a implementação; ainda não existem.

## Política aprovada de migrations

Prisma 7 com SQL nativo. Versões exatas propostas e adotadas nesta base:
CLI/client/adapter 7.10.0, sem ranges. Banco novo; tabela canônica users.

- Migration concluída: alterar schema para o estado desejado e gerar uma nova
  migration inversa. Não editar/apagar histórico aplicado nem usar resolve
  como se fosse desfazer SQL de uma migration concluída.
- Migration falha: inspecionar o estado, aplicar SQL de recuperação quando
  necessário e só então registrar rolled-back com migrate resolve.
- db execute não registra uma migration; resolve não desfaz SQL sozinho.
- Dados removidos exigem preservação/backup; rollback de schema não os restaura.

Nesta entrega: fixar pacotes, validar configuração e testar geração de SQL
com fixture isolada. Sem tabela comercial, banco remoto ou aplicação de
migrations. Schema completo e comandos npm de apply/show/rollback ficam
para a etapa posterior conforme combinado.
