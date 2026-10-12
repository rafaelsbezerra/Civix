# Diagnóstico do backend

Revisão estática do commit `5db3c5b`, em 2026-10-09.
INT-02 atualizado em 2026-10-12 para a branch codex/json-postgres-repositories;
isso não comprova merge em staging ou execução contra PostgreSQL.
Prioridades abaixo indicam a ordem sugerida de tratamento; não substituem
specs, decisão de produto ou execução dos testes.

## Problemas concretos

| ID | Prioridade | Evidência | Consequência |
| --- | --- | --- | --- |
| INT-02 | Resolvido no código da branch atual | Convite, ativação, login e recuperação usam users; JSON possui uma única coleção de usuários | Schema/baseline e aplicação no PostgreSQL permanecem pendentes |
| INT-03 | Resolvido nesta branch para convite | validateToken e firstAccess compartilham verificação JWT de convite, perfil/status e users.invite_token | Pré-validação corresponde ao convite; reenvio/reset divergente permanece em INT-04 |
| INT-04 | Alta | Reenvio grava JWT cru; reset espera SHA-256 e expiração no banco | Link reenviado não segue o fluxo principal de reset |
| INT-11 | Alta | Schema Prisma vazio, migrations apenas plans/ajuste de copy | Banco limpo não suporta as consultas existentes |

Fontes backend: [auth.controller](../../src/controller/auth.controller.ts),
[user.controller](../../src/controller/user.controller.ts),
[admin.controller](../../src/controller/admin.controller.ts).

## Autenticação, autorização e isolamento

- Login cliente concede JWT apenas pelo e-mail cadastrado, sem senha ou
  comprovação de posse. É necessário definir o propósito desse acesso.
- Na branch atual, login bloqueia status pending e preserva usuários sem status.
  O middleware ainda não valida empresa vinculada.
- Não existe isolamento tenant aplicado às consultas nem contexto tenant
  autenticado. O catálogo público precisa de DTO e política próprios.
- Convite e primeiro acesso usam segredo fallback fixo quando a variável
  falta; o router admin tem proteção comentada e está desmontado.
  Montá-lo sem definir autorização abriria a emissão de convites.
- CORS reflete qualquer origem com credentials true. Não há allowlist,
  rate limiting ou trilha de auditoria versionados.
- Seleção de plano é gravada no usuário, não na empresa, divergindo da
  associação empresa/plano descrita no Notion.

Fontes: [middleware](../../src/middlewares/auth.ts),
[server](../../src/server.ts),
[admin.routes](../../src/routes/admin.routes.ts),
[plan.service](../../src/services/plan.service.ts).

## Lacunas de produto

Faltam gestão de tenants, usuários/equipes, permissões, vendas, leads,
conversas, mensagens, IA/WhatsApp, handoff, auditoria, métricas e dashboards.
Planos não implicam assinatura, cobrança ou limites operacionais.
Arquivos de páginas legais/ajuda não demonstram validação jurídica ou
funcionalidade de suporte. O fluxo n8n/WAHA pode existir externamente;
o repositório não permite reproduzi-lo nem verificar seu isolamento.

## Atualização: camadas do catálogo

Empresas foi separado em `company.routes.ts`, `company.controller.ts`,
`company.service.ts`, entidade, tipos observados; a interface genérica de consulta foi removida.
A mistura de handlers e registro de rotas foi resolvida nesse domínio;
as inconsistências dos demais módulos permanecem.

A extração inicial preservou contratos legados e documentou falhas SQL
como 200/404. A adoção atual corrige isso: infraestrutura retorna 500,
ausência 404; sucesso usa data. O adiamento inicial de frontend foi
substituído pela integração autorizada dos consumidores existentes, que
corrige INT-08/INT-10. Login continua excluído e incompatível (ver api.md).
Nenhuma tabela/migration foi criada.

Os quatro testes HTTP locais passaram com persistência simulada. O
typecheck completo estava bloqueado, na extração inicial, pela configuração Prisma existente
(`datasource` incompatível com o PrismaConfig instalado); a checagem
isolada dos arquivos de empresas e seus testes passou.

A camada global de erro/sucesso substitui a ausência de padronização
da revisão inicial. Stack/details/code fora de produção são sanitizados;
produção retorna apenas status/message. Testes históricos de extração
não substituem a validação da adoção, registrada em operacao.md.

## Padronização e qualidade

**Registro histórico da revisão inicial:** os parágrafos abaixo descrevem
o checkout auditado antes da manutenção dos manifests e das camadas.

Existem três manifests/lockfiles sem workspaces declarados, versões
diferentes de ferramentas e dependências de backend no frontend.
O desalinhamento anterior entre Prisma CLI 6 e client/adapter 7 foi corrigido; os três pacotes estão fixados em 7.10.0. A estrutura mistura
userRoute, empresaRoute, auth.routes e controllers com camelCase e pontos.
Português/inglês e formatos de campos variam entre os domínios.

Os workflows de frontend/backend têm apenas workflow_dispatch e jobs
com steps sem comandos executáveis. Não fornecem gates de união, testes,
build, deploy ou migrations.

Diagnóstico frontend e verificações de integração: [frontend](../../../frontend/.specs/reviews/diagnostico.md).


## Manutenção posterior do frontend

Dependências de servidor e start backend foram retirados do manifest
frontend. Registro de verificação e limites na
[spec de manutenção](../../../frontend/.specs/features/dependency-maintenance/spec.md).
O histórico acima não representa o manifest frontend atual.
