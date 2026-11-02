# Tarefas frontend — superadmin

[Spec](spec.md) · [SDD](../../../../backend/.specs/features/super-admin-dashboard/sdd.md) ·
[Plano E2E e revisão](../../../../backend/.specs/features/super-admin-dashboard/task.md).
Somente planejamento. Não commitar sem revisão. Commits abaixo são sugestões;
não repetir commits para os mesmos grupos do plano backend.

## FE-SA-01 — Shell, após G1

- [ ] Montar SuperAdminLayout.tsx e páginas/rotas privadas usando profile e
  ProtectedRoute, com loading/401/403/erro e logout local.
- [ ] Ajustar login.tsx e AppRoute.tsx; preservar acesso público e destinos
  existentes de outros perfis. Não oferecer abas de módulos indisponíveis.
- [ ] Testar acesso direto, reload, rede e teclado; revisar antes de commit.

Alterar frontend/src/{routes/AppRoute.tsx,pages/login.tsx}; criar
frontend/src/components/layout/SuperAdminLayout.tsx,
frontend/src/pages/super-admin/Overview.tsx e frontend/src/lib/platform.api.ts.
Sugestão: `feat(super-admin): add protected administration shell` (G2).

## FE-SA-02 — Planos e cadastro, junto de G3/G4

- [ ] Criar Plans.tsx, CompanyCreate.tsx, PlanForm.tsx e CompanyForm.tsx nos
  diretórios pages/super-admin e components/super-admin em frontend/src.
- [ ] Buscar planos ativos/positivos para cadastro; mostrar erros e resultado
  empresa/venda. Não hardcodar preços ou capacidade por plano.
- [ ] Repetir envio com a mesma operação segura, conforme contrato aprovado.
- [ ] Testar plano inativo, falha parcial e submit repetido; revisar grupo.

Completar frontend/src/lib/platform.api.ts. Sugestões (G3/G4):
`feat(plans): add commercial plan administration` e
`feat(companies): register company and initial sale atomically`.

## FE-SA-03 — Empresas e vendas, junto de G5

- [ ] Criar Companies.tsx, CompanyDetail.tsx, CompanyEdit.tsx, Sales.tsx e
  SaleCreate.tsx em frontend/src/pages/super-admin; SaleForm.tsx em
  frontend/src/components/super-admin.
- [ ] Mostrar aviso de venda manual ao editar empresa; link contextual não
  cria venda. Diferenciar valor comercial de pagamento recebido.
- [ ] Confirmar suspensão/arquivamento e preservar histórico visível no admin.
- [ ] Integrar filtros/paginação aprovados, loading/vazio/erro e conflito;
  testar troca de plano e valor histórico. Revisar antes de commit.

Sugestões (G5): `feat(companies): add platform lifecycle management` e
`feat(sales): add commercial sales and manual registration`.

## FE-SA-04 — Equipe e superadmins, junto de G6/G7

- [ ] Criar CompanyUsers.tsx/Administrators.tsx em pages/super-admin e
  CompanyUserForm.tsx/AdministratorForm.tsx em components/super-admin.
- [ ] Validar contexto empresarial, estados de convites e campos permitidos;
  mutações globais dependem de SA-P05. Não editar permissões indefinidas.
- [ ] Testar empresa A/B, retirada de acesso e informações não secretas;
  revisar grupos separadamente.

Sugestões: `feat(company-users): add platform team administration` (G6) e
`feat(platform-users): add reviewed administrator management` (G7).

## FE-SA-05 — Verificação da entrega

- [ ] Implementar testes de componentes nos diretórios correspondentes e
  cenários E2E com API/persistência isoladas; runner/local a confirmar em G8.
- [ ] Executar scripts existentes de testes, TypeScript, lint e build
  pertinentes; registrar limites e falhas atuais, sem reutilizar prova antiga.
- [ ] Atualizar docs/frontend-backend.md e specs da entrega após implementar.
- [ ] Revisar antes de commit; registrar revisor/evidências no task backend.

Sugestão: `test(super-admin): verify platform workflows end to end` (G8).

Backlog segue a spec canônica: billing, configurações sem definição,
trial e funcionalidades/limites/regras por plano. Nenhum código criado aqui.
