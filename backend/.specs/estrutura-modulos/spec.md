# Estrutura dos módulos e convenções

Estado: planejamento; inglês e pastas globais por função confirmados.
Nomes domínio.papel.ts e handlers independentes confirmados. Abrangência dos demais módulos permanece para adoção posterior.
A cadeia routes → controller → service está confirmada.

## Problema e escopo

`src/routes/empresaRoute.ts` possui handlers e acessa diretamente
`src/services/empresaService.ts`; empresas não possui controller.
Há nomes em português/inglês, camelCase/sufixos e `controller` no singular.
Controllers de user/auth/admin também contêm SQL e regras de aplicação.

Definir um padrão único e adequar empresas primeiro. Inventariar os demais
módulos; execução de MOD-04 aguarda confirmação de abrangência.
Manter pastas como `src/routes`, `src/controller` e `src/services`, sem
introduzir `src/modules`. Pastas de entities/interfaces/dtos dependem da
confirmação de nomes; não duplicar estruturas por domínio.
Não criar CRUD ou módulos
comerciais ausentes durante esta refatoração.

## Responsabilidades

- Routes: registrar URL/método e compor middlewares/controller.
- Controller: receber entrada validada, chamar service e traduzir resultado
  para HTTP; sem SQL ou regras comerciais.
- Service: coordenar caso de uso e regras existentes; sem Request/Response
  do Express ou construção de envelopes HTTP.
- Persistência: localização/adapter depende de BE-06; não colocar SQL em
  routes/controllers para resolver essa pendência.

## Tarefas e aceite

Nesta etapa, definir estrutura reutilizável e executar MOD-02/03 somente
para empresas, mantendo rotas/envelopes e regras atuais. Não aplicar os
contratos novos. MOD-04 permanece para adoção posterior.

- [ ] MOD-01: Aprovar idioma, nomes, pastas e um exemplo de módulo.
  Aceite: registrar regras de arquivos, exports/imports, funções/classes,
  tipos e constantes. Decidir estilo funcional versus classes.
- [x] MOD-02: Extrair controller de empresas e ajustar service/routes.
  Depende dos contratos HTTP e tipos aprovados.
  Aceite: handlers separados, erros preservam sua natureza, routes sem
  lógica de negócio e service sem dependência de HTTP.
- [x] MOD-03: Renomear/mover arquivos conforme o padrão aprovado.
  Aceite: imports ESM resolvem e casing funciona em Linux; endpoints mantidos
  ou alterados somente com decisão e atualização dos consumidores.
- [ ] MOD-04: Inventariar e adequar user/auth/admin/plans ao mesmo padrão.
  Aceite: nenhum SQL em routes/controllers, nenhuma duplicação de contratos;
  mudanças de regras de autenticação ficam fora desta tarefa.
- [x] MOD-05: Documentar convenções e atualizar arquitetura/diagnóstico.
  Aceite: novo módulo pode seguir exemplo curto com responsabilidades claras.

Verificação futura: typecheck e testes HTTP dos caminhos existentes de
empresas (listar, detalhe, filtros e busca), cobrindo ausência e falha de
persistência. Comparar inventário de rotas antes/depois; não considerar
regressões atuais como comportamento desejado.

## Implementação entregue

Empresas segue pastas globais por função com arquivos em inglês/domínio.papel.ts
conforme AGENTS.md. O estilo funcional existente foi preservado, sem
impor classes aos demais módulos. Queries e resultados legados continuam
no service; controller concentra HTTP e routes registra os sete endpoints.
Arquivos de entidade e resultados legados foram extraídos. A interface de query foi removida por não agregar contrato de domínio; o service usa diretamente o pool existente.
Nenhum contrato novo, frontend ou outro módulo foi adotado/refatorado.
MOD-01: nomes domínio.papel.ts e funções independentes de controller confirmados;
MOD-04 pertence à adoção posterior. Testes HTTP locais verificam preservação
de endpoints, mensagens, validações, ausência/vazio e falhas de persistência.

## Correção local após os merges — 2026-10-10

Controller em `src/controller/company.controller.ts` exporta handlers soltos
e importa `companyService` diretamente. Service exporta funções e usa
`db.query<Company>`; router registra handlers e exporta a instância. Sem
factories ou CompanyQuery. Mensagens de erro e comentários em português.
Testes usam mock do pool, sem banco real, preservando os sete endpoints.
Esta correção fica na staging existente, sem commit, PR ou nova worktree,
conforme exceção solicitada pelo usuário para esta tarefa.
