# Planejamento de entrega do superadmin

Data: 2026-11-02. Documentação de planejamento, sem implementação nesta tarefa.

- [Spec: escopo, decisões e aceite](../backend/.specs/features/super-admin-dashboard/spec.md).
- [SDD: fluxos, contratos propostos e localização do código](../backend/.specs/features/super-admin-dashboard/sdd.md).
- [Tasks: ordem, arquivos e commits sugeridos por grupo](../backend/.specs/features/super-admin-dashboard/task.md).
- [Telas e integração frontend](../frontend/.specs/features/super-admin-dashboard/spec.md).

Superadmin administra empresas e seus funcionários, planos comerciais,
registros de venda e usuários administrativos da plataforma. Cadastrar
empresa gera uma venda inicial; trocar plano exige venda manual, com aviso
no formulário. Valores são BRL, sem planos gratuitos nesta entrega.
Suspensão bloqueia acesso empresarial e catálogo. Exclusão preserva o
histórico por soft delete. Gestão não dá acesso a conversas empresariais.

Assinaturas, cobrança e pagamentos ficam em backlog. Também ficam em
backlog a arquitetura de teste gratuito e as capacidades, limites de uso e
regras específicas por plano. Configurações globais aguardam definição.
Preços e algumas políticas administrativas continuam pendentes na spec.

A ordem parte da coerência de autenticação/schema, depois shell, planos,
cadastro com venda, gestão de empresas/vendas, equipe, superadmins e E2E.
As propostas de URLs/schema/transação exigem revisão antes da implementação.
**Não commitar sem revisão.** Nenhuma migration ou teste executável foi
criado/aplicado para produzir esses documentos.
