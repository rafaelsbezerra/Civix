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
frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx,
frontend/src/pages/dashboard-super-admin/Overview.tsx; estender frontend/src/lib/api.ts existente.
Sugestão: `feat(super-admin): add protected administration shell` (G2).

## FE-SA-01D — Identidade visual e temas, junto de G2

- [ ] Aplicar o [design](design.md): branco/marfim, azul e amarelo do site;
  tema claro padrão e escuro de base azul-marinho.
- [ ] Mapear tokens em frontend/src/index.css e aplicá-los ao
  SuperAdminLayout.tsx e componentes administrativos, incluindo portais.
- [ ] Implementar alternância acessível em components/dashboard-super-admin/ThemeToggle.tsx
  se necessário. Definir persistência da preferência antes de implementá-la.
- [ ] Conferir tipografia, responsividade, estados e contraste nos dois temas;
  verificar que o site público não muda. Revisar antes de commit.

Sugestão após revisão: `feat(super-admin): add brand-aligned light and dark themes`.
Nenhum CSS ou componente foi alterado nesta tarefa documental.

## FE-SA-01L — Layout raiz compartilhado

- [ ] Criar SuperAdminLayout.tsx, SuperAdminSidebar.tsx e SuperAdminHeader.tsx
  em frontend/src/components/dashboard-super-admin/layout, com rotas filhas via Outlet e região main.
- [ ] Sidebar com marca, itens aprovados/ativos e acesso ao perfil; header
  com título, identidade, alternância de tema, perfil e saída.
- [ ] Integrar navegação aninhada em frontend/src/routes/AppRoute.tsx;
  verificar comportamento responsivo, drawer/foco/teclado e os dois temas.
- [ ] Revisar antes do commit; sem menus/ações sem suporte no backend.

Sugestão: `feat(super-admin): add shared sidebar and header layout` (G2).

## FE-SA-01P — Configurações do perfil

- [ ] Criar frontend/src/pages/dashboard-super-admin/ProfileSettings.tsx e
  frontend/src/components/dashboard-super-admin/ProfileForm.tsx para nome/e-mail.
- [ ] Integrar leitura/gravação do próprio usuário em
  frontend/src/lib/api.ts, reutilizando contrato de sessão aprovado.
- [ ] Tratar erros, e-mail duplicado e mudança do contexto/header; alinhar
  sessão após mudar e-mail com o backend. Não manter claims divergentes.
- [ ] Verificar isolamento do próprio perfil, teclado e ambos os temas;
  revisar antes do commit. Senha fica em backlog, sem formulário ativo.

Sugestão: `feat(profile): add personal name and email settings`.
Dependência: regra e endpoint do perfil no SDD; sem nova área de configurações globais.

## FE-SA-02 — Planos e cadastro, junto de G3/G4

- [ ] Criar Plans.tsx, CompanyCreate.tsx, PlanForm.tsx e CompanyForm.tsx nos
  diretórios pages/dashboard-super-admin e components/dashboard-super-admin em frontend/src.
- [ ] Buscar planos ativos/positivos para cadastro; mostrar erros e resultado
  empresa/venda. Não hardcodar preços ou capacidade por plano.
- [ ] Repetir envio com a mesma operação segura, conforme contrato aprovado.
- [ ] Testar plano inativo, falha parcial e submit repetido; revisar grupo.

Completar frontend/src/lib/api.ts. Sugestões (G3/G4):
`feat(plans): add commercial plan administration` e
`feat(companies): register company and initial sale atomically`.

## FE-SA-03 — Empresas e vendas, junto de G5

- [ ] Criar Companies.tsx, CompanyDetail.tsx, CompanyEdit.tsx, Sales.tsx e
  SaleCreate.tsx em frontend/src/pages/dashboard-super-admin; SaleForm.tsx em
  frontend/src/components/dashboard-super-admin.
- [ ] Mostrar aviso de venda manual ao editar empresa; link contextual não
  cria venda. Diferenciar valor comercial de pagamento recebido.
- [ ] Não criar edição de venda. Implementar confirmação de exclusão
  definitiva e acesso a novo lançamento; explicar correção de plano errado
  no cadastro sem disparar venda automática após editar empresa.
- [ ] Confirmar suspensão/arquivamento e preservar histórico visível no admin.
- [ ] Integrar filtros/paginação aprovados, loading/vazio/erro e conflito;
  testar troca de plano sem venda, exclusão e relançamento manual, além dos
  valores históricos das vendas preservadas. Revisar antes de commit.

Sugestões (G5): `feat(companies): add platform lifecycle management` e
`feat(sales): add commercial sales and manual registration`.

## FE-SA-04 — Equipe e superadmins, junto de G6/G7

- [ ] Criar Users.tsx em frontend/src/pages/dashboard-super-admin e UserForm.tsx
  em frontend/src/components/dashboard-super-admin, reutilizados pelos contextos
  de empresa e superadmins sem duplicar tela/formulário por papel.
- [ ] Validar contexto empresarial, estados de convites e campos permitidos;
  mutações globais dependem de SA-P05. Não editar permissões indefinidas.
- [ ] Testar empresa A/B, retirada de acesso e informações não secretas;
  revisar grupos separadamente.

Sugestões: `feat(users): add company-scoped administration` (G6) e
`feat(users): add reviewed superadmin management` (G7).

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

## Regra de organização

Manter todas as funções HTTP no frontend/src/lib/api.ts existente, com
nomes que indiquem ação e escopo. Componentes exclusivos usam
frontend/src/components/dashboard-super-admin; compartilháveis por outros
dashboards (busca, botões, campos genéricos) seguem a estrutura atual do
projeto. Não criar pastas/arquivos novos apenas por papel de usuário.
