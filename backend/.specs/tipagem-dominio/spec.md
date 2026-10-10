# Entidades, interfaces e DTOs

Estado: extrações existentes e interfaces de repositories implementadas;
modelo canônico e validação abrangente permanecem pendentes. Implementação
e adoção de repositories ficam fora das pendências atuais, para etapa futura.
Idioma, arquivos, pastas e interfaces úteis já foram confirmados (BE-04/05/06).
BE-09/10 permanecem parcialmente pendentes; não pedir novamente decisões feitas.

## Escopo e requisitos

Separar tipos úteis dos controllers/services, sem inventar modelos de leads,
conversas, vendas ou dashboards. Os tipos atuais descrevem consultas observadas;
não representam aprovação de campos, vínculos e invariantes de um novo schema.

- Entidades não dependem de Express, envelopes HTTP ou cliente de banco.
- DTOs descrevem entradas/saídas; tipos de persistência descrevem linhas SQL.
- Validação runtime é necessária quando aprovada: casts não validam payloads.
- Interfaces de repositories expressam métodos de domínio. Implementações
  e adapters foram explicitamente adiados; não criar interface para tudo.
- Evitar any e casts para ocultar diferenças; estreitar erros com unknown.

## Tarefas e aceite

- [ ] TYP-01: Aprovar modelo mínimo canônico e invariantes.
  Parcial: PostgreSQL novo e nome users confirmados; campos obrigatórios,
  IDs/datas, vínculos, enums completos e restrições: **Aguardando resposta**.
- [ ] TYP-02: Completar extração de tipos úteis dos módulos existentes.
  Parcial: empresas/usuários/planos/auth extraídos; admin mantém UserRow local.
- [x] TYP-02-A: Extrair entidades/DTOs/linhas de empresas, usuários e planos.
  Evidência: entities/{company,user,plan}.entity.ts, user.auth.dto.ts,
  interfaces/plan.row.ts. PublicUser não expõe password_hash; o token do
  login é campo separado e intencional do contrato de autenticação.
- [x] TYP-02-B: Extrair payload de convite e linhas SQL de auth.
  Evidência: dtos/auth.invite.dto.ts, interfaces/auth.user.row.ts e imports
  tipados do controller; integrado em staging via PR #12, presente em bedb73a.
- [ ] TYP-02-C: Separar os tipos úteis ainda locais de admin, quando sua
  refatoração for autorizada; não criar interfaces sem necessidade.
- [x] TYP-03: Criar interfaces de persistência dos módulos implementados.
  Evidência: repositories/{user,company,plan}.repository.ts, já em staging.
  O adapter de teste sugerido originalmente foi retirado do escopo atual
  pela decisão explícita de criar somente interfaces. Implementação/adoção
  futura não deve ser confundida com conclusão da persistência operacional.
- [ ] TYP-04: Completar mapeamento e validação canônica aprovados.
  Parcial: plan.service.ts possui toPlan/parseFeatures/parseLimits; guards
  atuais validam alguns campos. Política geral camelCase/snake_case,
  null/ausente, datas, enums e schemas runtime: **Aguardando resposta**.
- [x] TYP-05: Documentar os tipos e responsabilidades extraídos.
  Evidência: docs/arquitetura.md, docs/padroes-backend.md, docs/auth-types.md
  e spec usuarios-repositories. Atualizar novamente quando o modelo mudar.

## Verificação e limites

Company mantém nomes legados e consulta db.query<Company>; não há mapper
camelCase do catálogo ou invariantes novas. O DTO de resposta legado de
empresas foi removido na adoção HTTP e substituído pelo contrato compartilhado.
CompanyQuery foi removida; testes simulam o pool, sem adapter novo.

A implementação registrou testes/typecheck isolados das extrações e adoção.
Esta auditoria não executou novamente checks nem validou um schema no banco.
