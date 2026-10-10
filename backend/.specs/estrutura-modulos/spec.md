# Estrutura dos módulos e convenções

Estado: convenções confirmadas; empresas, usuários e planos alinhados nas
camadas existentes. Auth/admin ainda possuem SQL/regras nos controllers.

## Escopo e responsabilidades

Manter pastas globais por função: routes, controller, services, entities,
interfaces, dtos e repositories; infraestrutura compartilhada em shared.
Não introduzir src/modules, CRUD novo ou módulos comerciais ausentes.

- Routes registram URLs/métodos e compõem middlewares/controllers.
- Controller recebe entrada, chama service diretamente e traduz HTTP.
- Service coordena regras existentes, sem Express/envelopes HTTP.
- Repositories possuem somente interfaces por decisão do usuário; os
  services mantêm SQL até a implementação posterior da persistência.

Arquivos seguem domínio.papel.ts, como company.service.ts. Identificadores
em inglês; comentários e erros em português. Handlers independentes,
sem factories por padrão; usar dois espaços e separar blocos lógicos.

## Tarefas e aceite

- [x] MOD-01: Aprovar idioma, arquivos, pastas e estilo funcional.
  Evidência: AGENTS.md e docs/padroes-backend.md; convenções confirmadas.
- [x] MOD-02: Extrair controller e adequar service/routes de empresas.
  Evidência: company.controller.ts, company.service.ts, company.routes.ts.
  Routes registram sete endpoints; service não depende de HTTP.
- [x] MOD-03: Renomear/mover os arquivos da extração conforme o padrão.
  Evidência: arquivos domínio.papel.ts e imports ESM; testes/typecheck locais.
  Execução em Linux não foi registrada e não é alegada por essa verificação.
- [ ] MOD-04: Completar adequação de user/auth/admin/plans ao mesmo padrão.
  Estado parcial: user e plans possuem services e tipos separados;
  auth/admin ainda executam SQL/regras no controller. Admin mantém UserRow
  local. Não expor admin, atualmente desmontado, durante futura extração.
- [x] MOD-04-A: Extrair camadas/tipos de usuários e planos existentes.
  Evidência: user.{routes,controller,service}.ts, entidades/DTOs e
  plan.{controller,service}.ts; extração de usuários integrada em staging.
- [x] MOD-04-B: Extrair tipos do controller auth.
  Evidência: auth.invite.dto.ts e auth.user.row.ts; PR #12, incluído na
  baseline de adoção HTTP. Não equivale à extração de um auth.service.ts.
- [ ] MOD-04-C: Extrair SQL/regras de auth/admin para services e tipos úteis.
  Escopo futuro; preservar URLs/regras e confirmar a tarefa antes do código.
- [x] MOD-05: Documentar convenções, arquitetura e diagnóstico.
  Evidência: AGENTS.md, docs/padroes-backend.md, docs/arquitetura.md,
  docs/diagnostico.md e docs/auth-types.md.

## Entregas e limites

Empresas, usuários e contratos de repositories estão integrados em staging
na referência e2b3d8b. CompanyQuery foi removida por não agregar contrato útil;
services utilizam o pool atual. Interfaces não precisam existir para tudo.

A correção local de empresas inicialmente foi feita sem commit por instrução
específica; depois o usuário autorizou o commit. Essa exceção é histórica.
A adoção de AppError/sucesso foi entregue no PR #14 e está na baseline desta
auditoria, sem presumir merge. Frontend e repositories operacionais ficam
posteriores. Testes usam persistência simulada, sem banco real.
