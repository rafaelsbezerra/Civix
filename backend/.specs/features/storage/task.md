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

## Implementação original e homologação

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

## Evidências históricas da entrega original

- 124 testes backend aprovados, incluindo multipart HTTP, papéis, escopo entre empresas, assinatura de 300 segundos, concorrência e compensação.
- 35 testes frontend aprovados; TypeScript backend/frontend e lint frontend aprovados.
- Três testes offline do tooling Prisma aprovados; nenhuma migration aplicada.
- ST-16 original: a rota GET complementar era pública e limitada à capa vigente.
  A ampliação IMG-B02 abaixo acrescenta a logo; URLs também são retornadas nas
  consultas públicas de empresa.
- ST-17: router montado em /api/v1/storage após implementação dos handlers.
- Dependências multipart e detecção de arquivo instaladas com autorização.
- ST-18 continua pendente: testar credenciais/bucket privado R2 e SQL/constraints em PostgreSQL autorizado. Testes usam armazenamento substituto e persistência local.
- Build completo frontend encontra a verificação preexistente de dashboard.png ausente; TypeScript e bundle Vite passaram.
- Auditoria npm identifica quatro alertas altos transitivos do tooling Prisma fixado. Atualização de versão não foi autorizada nem aplicada.

Os itens ST-01 a ST-10 registram a entrega estrutural anterior; funções antes vazias agora têm implementação.

## Complemento logo e frontend — 2026-11-02

- [x] IMG-B01: aceitar cover|logo no service, atualizando a chave e caminho
  corretos, com autorização vigente e compare-and-swap independentes.
- [x] IMG-B02: GET público da imagem vigente de ambos os destinos; apresentar
  logo assinada no campo logo e capa em cover_image_url, sem chaves internas.
- [x] IMG-B03: manter rotas, SDK, bucket e esquema; nenhuma migration nova.
- [x] IMG-B04: registrar revisão, regressão e evidência do frontend no
  [arquivo de PR](../super-admin-dashboard/pr.md).
- [ ] IMG-B05: publicar e abrir PR staging. A criação do PR do dashboard
  retornou 404 no conector GitHub; repetir para imagens depois do push.

Fonte alterada em services/storage.service.ts e services/company.service.ts.
Teste de R2/PostgreSQL reais (ST-18) continua pendente.

Verificação do complemento: foundation 131/131, storage 47/47 e plataforma
67/67 no backend; 84 testes direcionados frontend (11 novos). TypeScript dos
dois pacotes, lint frontend e E2E Chrome/API/JSON com provedor R2 substituto
aprovados. Build compila/gera bundle, mas falha no gate herdado About/dashboard.png.
