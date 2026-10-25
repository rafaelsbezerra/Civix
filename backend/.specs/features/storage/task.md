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

## Implementação posterior

- [ ] ST-11: Fechar perfis/vínculos e validar autorização de empresa existente.
- [ ] ST-12: Implementar parser multipart e validação de conteúdo/tamanho.
- [ ] ST-13: Implementar adapters images JSON/PostgreSQL e metadados locais.
- [ ] ST-14: Implementar UPDATE real das chaves de empresa, com concorrência.
- [ ] ST-15: Conectar storage ao R2, persistir imagem e vincular pelo service
  de empresas; substituir/limpar sem excluir recurso vigente.
- [ ] ST-16: Implementar leitura pública de capa vigente e assinatura de 300s.
- [ ] ST-17: Definir retornos HTTP finais e montar o router após implementar
  handlers e verificações; não expor handlers vazios.
- [ ] ST-18: Verificar integração R2/PostgreSQL no ambiente autorizado e casos
  negativos; aplicar migrations somente mediante autorização específica.
- [ ] ST-19: Atualizar evidências e alinhar JSON/SQL e contratos frontend.

## Evidências

Nenhum upload real ou migration foi executado. Nenhuma dependência instalada.
As alterações locais anteriores de manifest, lockfile, configuração e cliente
R2 foram preservadas; somente o tratamento de erro do service R2 foi ajustado.

- Typecheck isolado de todo src e tests/storage.r2.test.ts aprovado, usando
  configuração temporária externa, com as opções do tsconfig atual e noEmit.
- 42 testes passaram: storage.r2.test.ts, contracts.test.ts,
  company.routes.test.ts e local.persistence.test.ts, executados pelo runner
  existente. Incluem quatro testes R2 sem rede, causa original preservada,
  serialização de produção e assinatura local com 300 segundos.
- Primeira execução no sandbox foi bloqueada por EACCES no localhost/EPERM
  nas fixtures. Repetição autorizada fora do sandbox passou com 42/42.
- npm run typecheck:foundation continua falhando em oito chamadas inválidas
  de AppLogger nos testes logging.test.ts/logging.http.test.ts, observadas
  antes das alterações. Os seis erros iniciais do R2 foram corrigidos.
- Conferência estática: dez colunas images correspondem aos dez campos de
  Image; router não está montado; git diff --check aprovado.
- Revisão independente sem bloqueadores no escopo estrutural.

Não realizados: aplicação/constraints em PostgreSQL, integração R2 real,
fluxo HTTP de storage, parser multipart, upload, autorização empresarial,
persistência dos novos métodos e suíte completa. Funções vazias são apenas
scaffold; não chamar os métodos como se já atualizassem dados.
