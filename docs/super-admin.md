# Planejamento de entrega do superadmin

Data: 2026-11-02. G0 a G4 e perfil próprio implementados na branch feat/super-admin-dashboard; G5 a G8 foram autorizados para continuação e ainda não estão concluídos.

- [Spec: escopo, decisões e aceite](../backend/.specs/features/super-admin-dashboard/spec.md).
- [SDD: fluxos, contratos propostos e localização do código](../backend/.specs/features/super-admin-dashboard/sdd.md).
- [Tasks: ordem, arquivos e commits sugeridos por grupo](../backend/.specs/features/super-admin-dashboard/task.md).
- [Telas e integração frontend](../frontend/.specs/features/super-admin-dashboard/spec.md).

Superadmin administra empresas e seus funcionários, planos comerciais,
registros de venda e usuários administrativos da plataforma. Cadastrar
empresa gera uma venda inicial; trocar plano exige venda manual, com aviso
no formulário. Valores são BRL, sem planos gratuitos nesta entrega.
Vendas não podem ser editadas: correção exige exclusão definitiva e
relançamento manual, inclusive quando a venda automática nasceu com plano
errado. A exclusão de uma venda não apaga a empresa nem altera seu plano.
Suspensão bloqueia acesso empresarial e catálogo. Exclusão de empresa preserva
o histórico por soft delete, incluindo vendas que não foram excluídas
explicitamente. Gestão não dá acesso a conversas empresariais.

Assinaturas, cobrança e pagamentos ficam em backlog. Também ficam em
backlog a arquitetura de teste gratuito e as capacidades, limites de uso e
regras específicas por plano. Configurações globais aguardam definição.
As decisões funcionais SA-P01 a SA-P05 estão resolvidas. Configurações
globais (SA-P06) continuam em backlog. Os contratos SA-P07 foram adotados para G0 a G4; grupos posteriores continuam sujeitos à implementação e revisão.

A ordem parte da coerência de autenticação/schema, depois shell, planos,
cadastro com venda, gestão de empresas/vendas, equipe, superadmins e E2E.
Os contratos implementados estão detalhados no SDD.
**Não commitar sem revisão.** Duas migrations incrementais e testes foram criados na implementação, sem aplicação de SQL no banco. Os resultados atuais e limites estão no task backend.

Organização confirmada: cadastro com plano/venda nos arquivos existentes de
company; usuários empresariais e superadmins nos arquivos existentes de user,
com funções nomeadas por operação/escopo. API frontend permanece em lib/api.ts.
Arquivos exclusivos do dashboard usam pages/dashboard-super-admin e
components/dashboard-super-admin; elementos compartilháveis mantêm a estrutura atual.

Decisões complementares: empresas podem ser reativadas/restauradas; desativar
empresa ou usuário exige motivo. Superadmins podem criar/desativar outros,
mesmo que a plataforma comece com uma só conta, mas não podem desativar a
própria conta nem o último superadmin ativo. Backend deve garantir essas duas
proteções sob concorrência. Venda pelo plano atual usa seu preço; venda por
valor manual exige descrição/motivo, inclusive para plano antigo. Data passada
é permitida e todas as datas do sistema usam UTC.
Layout raiz é exclusivo das telas do dashboard superadmin.

SA-P01 a SA-P05 resolvidas: planos demo com preços atuais são referência,
sem bloquear módulos por dados de banco; restaurar empresa mantém desativação
até reativação explícita e convites antigos não voltam a valer; papel
admin_empresa/atendente pode mudar e último admin empresarial pode ser
desativado. Atendentes podem ser excluídos/desativados, finalizando atendimentos
atribuídos. Superadmins entram por convite para definir senha, podem ser
reativados por outro ativo e têm poderes iguais, sem editor individual.

## Estado da implementação G0 a G4

Rotas privadas em `/super-admin`: início, planos, cadastro de empresa e perfil.
Tema claro inicial e preferência claro/escuro persistida neste navegador.
Alterar nome atualiza o header; alterar e-mail exige novo login.

A API `/api/v1/platform` revalida identidade e exige super_admin.
Planos permitem consulta, criação, edição e ativação com preço positivo.
POST `/companies` recebe os campos empresariais, `planId` e `operationId` UUID;
a resposta contém `company`, `sale` e `replayed`. O mesmo ator/operação/payload
reutiliza o resultado, sem nova venda. Alterar o payload na mesma operação gera 409.
JSON grava o conjunto sob lock; PostgreSQL usa uma conexão e transação única.
O POST existente `/api/v1/empresas` adota o mesmo contrato, sem permitir contornar a venda.

As migrations `20261102000200_company_administration` e
`20261102000300_create_sales` ainda precisam ser aplicadas pelo responsável
no ambiente autorizado antes de usar essas operações com PostgreSQL.
Companies reutiliza `status`; não existe coluna `administrative_status`.
A inicialização do cliente R2 ocorre quando uma operação de imagem o exige.

Gestão de empresas existentes, vendas manuais/exclusão, equipe e outros
superadmins continuam em G5 a G7; não há menus dessas operações nesta rodada.
