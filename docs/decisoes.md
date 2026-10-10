# Decisões pendentes e próxima fase

Este registro reúne questões para specs futuras. Não aprova padrões,
provedores ou arquitetura novos.

## Decisões necessárias

| ID | Tema | Questão a resolver |
| --- | --- | --- |
| DEC-01 | Produto | Consolidar Civix/UrbanSync e fronteira catálogo versus SaaS; serviços versus três produtos/projetos/imóveis |
| DEC-02 | Identidade | Autenticação própria, Auth0 ou Neon Auth? Qual comprovação de acesso cliente? |
| DEC-03 | Papéis | Mapear superadmin, admin empresa, vendedor e cliente para permissões explícitas |
| DEC-04 | Tenant | Vínculos usuário/empresa, contexto autenticado, filtros SQL, IA e acesso público |
| DEC-05 | Persistência | Prisma 7/SQL nativo/inversa, PostgreSQL novo e nome users confirmados; campos/vínculos/restrições, baseline e SQL antigos pendentes; tooling integrado via PR #7 |
| DEC-06 | API | Envelope, erro/status e enum backend integrados; faltam frontend e serialização/validação geral. Paginação somente quando necessário, fora das pendências atuais |
| DEC-07 | Onboarding | Convite, primeiro acesso, reenvio, reset, expiração, uso único, sessão e revogação |
| DEC-08 | Planos/vendas | Plano por empresa ou usuário, mensalidade/setup, venda automática/manual, exclusão, cobrança e limites |
| DEC-09 | Trial | Regra de sete dias, campos, bloqueio e conversão ao plano |
| DEC-10 | Conversas/leads | Estados, qualificação, funil, resultado, prioridade, reabertura e concorrência ao assumir |
| DEC-11 | IA/WhatsApp | Workflow versionado, contexto por empresa, confiança, limites, handoff, retries e idempotência |
| DEC-12 | Integrações | Banco direto pelo n8n ou API; API key/HMAC; integração com sistemas existentes |
| DEC-13 | Assets | Armazenamento de fotos, upload, R2 ou alternativa e limites |
| DEC-14 | Operação | Hospedagem, ambientes, CI/CD, migrations, backups/restore, observabilidade e segredos |
| DEC-15 | Convenções | Confirmadas: inglês, arquivos domínio.papel.ts, erros/comentários em português, pastas por função e handlers independentes; aplicação completa em auth/admin permanece parcial |
| DEC-16 | Escala | Cache, volume por empresa, latência, disponibilidade, RPO/RTO e retenção |
| DEC-17 | Dashboards | Funcionalidades/rotas por perfil e definição das métricas |

Notion apresenta simultaneamente vendas “imutáveis” e rotas POST/DELETE;
empresa como tenant e usuário com role empresa; planos associados à empresa
e implementação associada ao usuário. Esses conflitos exigem decisão
explícita antes de expandir os módulos.

As convenções já escritas no Notion são Conventional Commits, PascalCase
para classes/interfaces/types, camelCase para funções/variáveis,
UPPER_SNAKE_CASE para constantes globais. A regra local posterior registrada
no AGENTS.md usa arquivos domínio.papel.ts, identificadores em inglês,
comentários/erros em português e controllers com funções independentes.

## Sequência sugerida

1. Especificar e corrigir a integração existente: URLs, rotas, casing,
   configuração frontend, assets e coerência dos fluxos de acesso.
2. Definir modelo de dados, identidade, papéis e isolamento tenant antes
   de criar entidades operacionais. Planejar baseline de banco novo, conforme confirmado pelo usuário.
3. Adaptar consumidores frontend aos contratos já adotados no backend e
   completar a separação de auth/admin em services. Schemas/OpenAPI exigem
   definição de escopo; verificar compatibilidade dos consumidores.
4. Consolidar instalação, scripts e gates da staging; definir ambientes,
   deploy, secrets, migrations, observabilidade e recuperação.
5. Especificar módulos de empresa/usuários/equipes, planos/vendas/trial e
   dashboards, incluindo permissões e critérios de aceite.
6. Especificar conversas/leads/mensagens e integrar IA/WhatsApp com
   isolamento, transições, handoff, auditoria e processamento assíncrono.

## Conteúdo mínimo de cada spec futura

Problema e escopo; atores/permissões; regras e estados; entradas/saídas;
contrato HTTP; schema/migration; estratégia tenant; falhas e concorrência;
critérios de aceite verificáveis; testes pertinentes; plano de rollout e
atualização dos documentos afetados. Registrar decisões e alternativas
em ADRs apenas quando forem aprovadas.

A baseline documental, as extrações, o tooling Prisma 7 e a adoção HTTP já
estão integrados em staging bedb73a. Consulte a [auditoria das specs](revisao-pendencias-specs.md)
para distinguir tarefas restantes de decisões já aprovadas.


## Evoluções fora das pendências atuais

Decisão do usuário em 2026-10-10: usar paginação somente quando necessário;
implementar e consumir repositories em etapa futura. A base existente fica
preservada; nenhuma dessas adoções bloqueia a etapa atual. Sua definição
será retomada na tarefa correspondente, sem marcar implementação como concluída.

## Decisões posteriores — 2026-10-10

DEC-05: users e banco criado do zero confirmados. CLI/client/adapter Prisma
fixados em 7.10.0 com migrations SQL nativas; tooling integrado à staging
via PR #7. Campos e vínculos do schema continuam aguardando confirmação.
