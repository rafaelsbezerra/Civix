# Estrutura dos módulos e convenções

Estado: convenções confirmadas; empresas, usuários e planos alinhados nas
camadas existentes. Em 2026-10-12, auth/admin foram separados em services e adapters de persistência, sem montar admin.

## Escopo e responsabilidades

Manter pastas globais por função: routes, controller, services, entities,
interfaces, dtos e repositories; infraestrutura compartilhada em shared.
Não introduzir src/modules, CRUD novo ou módulos comerciais ausentes.

- Routes registram URLs/métodos e compõem middlewares/controllers.
- Controller recebe entrada, chama service diretamente e traduz HTTP.
- Service coordena regras existentes, sem Express/envelopes HTTP.
- Repositories contêm interfaces; persistence/json e persistence/postgres contêm implementações tipadas com arquivos domínio.repository.ts.
  O modo local autorizado antecipou a implementação/adoção em 2026-10-12.
  Controllers importam services diretamente; SQL fica nos adapters reais.

Arquivos seguem domínio.papel.ts, como company.service.ts. Identificadores
em inglês; comentários e erros em português. Handlers independentes,
sem factories por padrão; usar dois espaços e separar blocos lógicos.

## Tarefas e aceite

- [x] MOD-01: Aprovar idioma, arquivos, pastas e estilo funcional.
  Evidência: AGENTS.md e docs/padroes-backend.md; convenções confirmadas.
- [x] MOD-02: Extrair controller e adequar service/routes de empresas.
  Evidência: company.controller.ts, company.service.ts, company.routes.ts.
  O catálogo mantém sete GETs; POST autorizado foi acrescentado no modo local. Service não depende de HTTP.
- [x] MOD-03: Renomear/mover os arquivos da extração conforme o padrão.
  Evidência: arquivos domínio.papel.ts e imports ESM; testes/typecheck locais.
  Execução em Linux não foi registrada e não é alegada por essa verificação.
- [x] MOD-04: Completar adequação dos módulos atuais ao mesmo padrão.
  User, plans, auth e admin usam services; SQL está nos adapters PostgreSQL.
  O tipo local de admin foi removido. Admin permanece desmontado.
- [x] MOD-04-A: Extrair camadas/tipos de usuários e planos existentes.
  Evidência: user.{routes,controller,service}.ts, entidades/DTOs e
  plan.{controller,service}.ts; extração de usuários integrada em staging.
- [x] MOD-04-B: Extrair tipos do controller auth.
  Evidência: auth.invite.dto.ts e auth.user.row.ts; PR #12, incluído na
  baseline de adoção HTTP; auth.service.ts foi acrescentado no modo local.
- [x] MOD-04-C: Extrair SQL/regras de auth/admin para services e tipos úteis.
  auth.service.ts/admin.service.ts preservam regras e usam AuthRepository.
  Os adapters reais preservam consultas; controllers tratam HTTP/entrada.
  Implementação local em 2026-10-12, sem commit e sem expor novas rotas admin.
- [x] MOD-05: Documentar convenções, arquitetura e diagnóstico.
  Evidência: AGENTS.md, docs/padroes-backend.md, docs/arquitetura.md,
  backend/.specs/reviews/diagnostico.md e docs/auth-types.md.

## Entregas e limites

Empresas, usuários e contratos de repositories estão integrados em staging
na referência e2b3d8b. CompanyQuery foi removida por não agregar contrato útil;
services utilizam o pool atual. Interfaces não precisam existir para tudo.

A correção local de empresas inicialmente foi feita sem commit por instrução
específica; depois o usuário autorizou o commit. Essa exceção é histórica.
A adoção de AppError/sucesso está integrada em staging pelos PRs #13/#14,
referência bedb73a. Frontend consumidor permanece pendente. Repositories
operacionais foram adotados na implementação local autorizada em 2026-10-12.
Testes da entrega usam persistência simulada, sem banco real.
