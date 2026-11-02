# Storage — tarefas

Referência: [spec](spec.md). [US-54](https://rafa12bezerra01.atlassian.net/browse/US-54).
Checkbox estrutural não indica caso de uso funcionando.

## Estrutura desta tarefa

- [x] ST-01: Documentar contratos, SQL e alterações em empresas/auth.
- [x] ST-02: Declarar funções vazias no controller e service de storage.
- [x] ST-03: Definir StorageRepository e DTOs sem lógica de persistência.
- [x] ST-04: Declarar router de upload e URL assinada, sem montá-lo no app.
- [x] ST-05: Adicionar cover_key/logo_key na criação de companies.
- [x] ST-06: Criar migration images e interface TypeScript correspondente.
- [x] ST-07: Declarar atualização de chaves no módulo empresas e adapters.
- [x] ST-08: Conferir claims JWT e role já expostos pelo middleware.
- [x] ST-09: Corrigir AppError no R2StorageService preservando causa original.
- [x] ST-10: Verificar estrutura, tipagem, regressões relevantes e revisar.

## Implementação e homologação

- [x] ST-11: Integrar a evolução de usuários descrita em
  [users-roles](../users-roles/task.md): papéis confirmados, vínculo vigente e
  autorização de upload admin_empresa/super_admin; negar atendente/cliente.
- [x] ST-12: Implementar parser multipart e validação de conteúdo/tamanho.
- [x] ST-13: Implementar adapters images JSON/PostgreSQL e metadados locais.
- [x] ST-14: Implementar UPDATE real das chaves de empresa, com concorrência.
- [x] ST-15: Conectar storage ao R2, persistir imagem e vincular pelo service
  de empresas; substituir/limpar sem excluir recurso vigente.
- [x] ST-16: Retornar URL assinada da capa vigente (300s) na consulta pública
  da empresa, sem login/role; alinhar campo/abrangência e decidir se a rota
  GET separada do storage continuará necessária.
- [x] ST-17: Definir retornos HTTP finais e montar o router após implementar
  handlers e verificações; não expor handlers vazios.
- [ ] ST-18: Verificar integração R2/PostgreSQL no ambiente autorizado e casos
  negativos; aplicar migrations somente mediante autorização específica.
- [x] ST-19: Atualizar evidências e alinhar JSON/SQL e contratos frontend.

## Evidências atuais

- 124 testes backend aprovados, incluindo multipart HTTP, papéis, escopo entre empresas, assinatura de 300 segundos, concorrência e compensação.
- 35 testes frontend aprovados; TypeScript backend/frontend e lint frontend aprovados.
- Três testes offline do tooling Prisma aprovados; nenhuma migration aplicada.
- ST-16: a rota GET complementar permanece pública e limitada à capa vigente. URLs também são retornadas nas consultas públicas de empresa.
- ST-17: router montado em /api/v1/storage após implementação dos handlers.
- Dependências multipart e detecção de arquivo instaladas com autorização.
- ST-18 continua pendente: testar credenciais/bucket privado R2 e SQL/constraints em PostgreSQL autorizado. Testes usam armazenamento substituto e persistência local.
- Build completo frontend encontra a verificação preexistente de dashboard.png ausente; TypeScript e bundle Vite passaram.
- Auditoria npm identifica quatro alertas altos transitivos do tooling Prisma fixado. Atualização de versão não foi autorizada nem aplicada.

Os itens ST-01 a ST-10 registram a entrega estrutural anterior; funções antes vazias agora têm implementação. Logo permanece apenas como campo reservado, sem upload funcional.
