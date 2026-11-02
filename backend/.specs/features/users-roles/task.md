# Usuários — tarefas de evolução dos papéis

Referência: [spec](spec.md). Implementação local concluída; homologação externa pendente.

## Documentação concluída

- [x] UR-D01: Registrar os quatro identificadores confirmados e os três
  dashboards previstos; cliente em backlog sem área logada.
- [x] UR-D02: Documentar dependência do upload e independência da leitura
  pública de capa com URL de 300 segundos.
- [x] UR-D03: Registrar os impactos em SQL, tipos, JSON, login, JWT,
  middleware, convites e consumidores; separar decisões pendentes.

## Implementação e homologação

- [x] UR-01: Definir preservação/conversão de usuários legados e política
  dos tokens atuais, incluindo corte e necessidade de novo login.
- [x] UR-02: Confirmar estado de aplicação das migrations e criar a evolução
  SQL apropriada para users.role, sem reescrever histórico aplicado.
- [x] UR-03: Atualizar UserRole, DTOs, validadores, interfaces e schema JSON
  para admin_empresa/super_admin/cliente/atendente.
- [x] UR-04: Alinhar adapters/consultas e fluxos de convite/ativação; impedir
  autoelevação de privilégio e associação arbitrária a empresa.
- [x] UR-05: Adaptar login aos três perfis autenticáveis, validar credenciais
  e estado e impedir emissão de sessão de acesso para cliente.
- [x] UR-06: Tipar e validar claims/contexto da requisição; role já existe
  no JWT/middleware, mas precisa acompanhar os novos contratos e o legado.
- [x] UR-07: Implementar resolução do vínculo único de admin_empresa/atendente
  e escopo de plataforma de super_admin, conforme modelo aprovado.
- [x] UR-08: Revisar verificações legadas nos módulos empresas/planos,
  convites e logs; aprovar permissões sem conversão mecânica de privilégios.
- [x] UR-09: Alinhar frontend de autenticação/guards ao contrato aprovado;
  sem criar dashboard ou área privada para cliente.
- [x] UR-10: Integrar autorização do upload com papéis/vínculos vigentes;
  garantir leitura pública da capa independente de autenticação.
- [x] UR-11: Testar quatro papéis, valores inválidos, ausência de login,
  duas empresas, vínculos revogados e legado segundo a política definida.
- [ ] UR-12: Homologar rollout/preservação de dados em ambiente autorizado,
  registrar evidências e atualizar specs dependentes. Não aplicar SQL agora.

## Evidências da implementação

- 124 testes de backend e 35 testes de frontend aprovados.
- TypeScript backend/frontend e lint frontend aprovados; três testes offline de tooling Prisma aprovados.
- UR-01/02: banco vazio confirmado; conversão de empresa para admin_empresa e corte dos tokens antigos aprovados. Migration de vínculo versionada e conversão JSON explícita com backup.
- UR-08: criação de empresa restrita a super_admin; seleção de plano preserva o fluxo do próprio admin_empresa. Router admin permanece sem montagem.
- UR-09: login e guard implementados; dashboards continuam em entregas próprias.
- Não executados: migrations e integração com PostgreSQL/R2 reais.
