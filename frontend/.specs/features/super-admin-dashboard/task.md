# Tarefas frontend — superadmin

[Spec](spec.md) · [SDD](../../../../backend/.specs/features/super-admin-dashboard/sdd.md) ·
[Plano E2E e revisão](../../../../backend/.specs/features/super-admin-dashboard/task.md).
G0 a G4 e equivalentes concluídos. G5 a G8 autorizados para continuação,
com decisões pendentes no SDD/task backend. Não commitar sem revisão. Commits abaixo são sugestões;
não repetir commits para os mesmos grupos do plano backend.

## FE-SA-01 — Shell, após G1

- [x] Montar SuperAdminLayout.tsx e páginas/rotas privadas usando profile e
  ProtectedRoute, com loading/401/403/erro e logout local.
- [x] Ajustar login.tsx e AppRoute.tsx; preservar acesso público e destinos
  existentes de outros perfis. Não oferecer abas de módulos indisponíveis.
- [x] Testar acesso direto, reload, rede e teclado; revisar antes de commit.

Alterar frontend/src/{routes/AppRoute.tsx,pages/login.tsx}; criar
frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx,
frontend/src/pages/dashboard-super-admin/Overview.tsx; estender frontend/src/lib/api.ts existente.
Sugestão: `feat(super-admin): add protected administration shell` (G2).

## FE-SA-01D — Identidade visual e temas, junto de G2

- [x] Aplicar o [design](design.md): branco/marfim, azul e amarelo do site;
  tema claro padrão e escuro de base azul-marinho.
- [x] Mapear tokens em frontend/src/index.css e aplicá-los ao
  SuperAdminLayout.tsx e componentes administrativos, incluindo portais.
- [x] Implementar alternância acessível em components/dashboard-super-admin/ThemeToggle.tsx
  se necessário. Persistir preferência neste navegador, conforme aprovação.
- [x] Conferir tipografia, responsividade, estados e contraste nos dois temas;
  verificar que o site público não muda. Revisar antes de commit.

Sugestão após revisão: `feat(super-admin): add brand-aligned light and dark themes`.
CSS e componentes implementados com tema restrito ao dashboard.

## FE-SA-01L — Layout raiz compartilhado

- [x] Criar SuperAdminLayout.tsx, SuperAdminSidebar.tsx e SuperAdminHeader.tsx
  em frontend/src/components/dashboard-super-admin/layout, com rotas filhas via Outlet e região main.
- [x] Sidebar com marca, itens aprovados/ativos e acesso ao perfil; header
  com título, identidade, alternância de tema, perfil e saída.
- [x] Integrar navegação aninhada em frontend/src/routes/AppRoute.tsx;
  verificar comportamento responsivo, drawer/foco/teclado e os dois temas.
- [x] Revisar antes do commit; sem menus/ações sem suporte no backend.

Sugestão: `feat(super-admin): add shared sidebar and header layout` (G2).

## FE-SA-01P — Configurações do perfil

- [x] Criar frontend/src/pages/dashboard-super-admin/ProfileSettings.tsx e
  frontend/src/components/dashboard-super-admin/ProfileForm.tsx para nome/e-mail.
- [x] Integrar leitura/gravação do próprio usuário em
  frontend/src/lib/api.ts, reutilizando contrato de sessão aprovado.
- [x] Tratar erros, e-mail duplicado e mudança do contexto/header; alinhar
  sessão após mudar e-mail com o backend. Não manter claims divergentes.
- [x] Verificar isolamento do próprio perfil, teclado e ambos os temas;
  revisar antes do commit. Senha fica em backlog, sem formulário ativo.

Sugestão: `feat(profile): add personal name and email settings`.
Dependência: regra e endpoint do perfil no SDD; sem nova área de configurações globais.

## FE-SA-02 — Planos e cadastro, junto de G3/G4

- [x] Criar Plans.tsx, CompanyCreate.tsx, PlanForm.tsx e CompanyForm.tsx nos
  diretórios pages/dashboard-super-admin e components/dashboard-super-admin em frontend/src.
- [x] Buscar planos ativos/positivos para cadastro; mostrar erros e resultado
  empresa/venda. Não hardcodar preços ou capacidade por plano.
- [x] Repetir envio com a mesma operação segura, conforme contrato aprovado.
- [x] Testar plano inativo, falha parcial e submit repetido; revisar grupo.

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
- [ ] Exigir motivo ao desativar empresa, oferecer reativação/restauração
  permitidas; restaurada continua desativada até reativar explicitamente.
  Convites antigos inválidos e motivo vazio/espaços não envia.
- [ ] Venda por plano atual com preço somente leitura e motivo opcional;
  venda por valor manual com montante e descrição/motivo obrigatórios.
  Permitir data comercial passada e UTC em entrada/exibição/filtros.
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
  exigir motivo para desativar usuários/superadmins. Criação por outro
  superadmin usa convite para definir senha; permitir reativação por outro
  ativo, com poderes iguais. Sem editor de permissões individuais.
- [ ] Permitir troca admin_empresa/atendente e desativar último admin da
  empresa; exclusão/desativação de atendente finaliza seus atendimentos
  atribuídos quando o domínio existir. Não duplicar módulo de atendimento.
- [ ] Impedir pela UI desativação da própria conta superadmin e do último
  superadmin ativo, tratando também recusa da API sob concorrência. Testar
  motivo vazio e início com somente uma conta. Não editar permissões indefinidas.
  A proteção do último ativo é de superadmin, não de admin empresarial.
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
trial e funcionalidades/limites/regras por plano. G5 a G8 autorizados e ainda não concluídos.

## Regra de organização

Manter todas as funções HTTP no frontend/src/lib/api.ts existente, com
nomes que indiquem ação e escopo. Componentes exclusivos usam
frontend/src/components/dashboard-super-admin; compartilháveis por outros
dashboards (busca, botões, campos genéricos) seguem a estrutura atual do
projeto. Não criar pastas/arquivos novos apenas por papel de usuário.

Planos demo atuais são referência; dados/planos ativos no banco não bloqueiam
construção dos módulos. Testes usam fixtures; cadastro real valida existência
do plano e a UI trata catálogo vazio sem bloquear navegação administrativa.

Evidências G0 a G4 e limites de build/integração real estão registrados no
[task backend](../../../../backend/.specs/features/super-admin-dashboard/task.md#evidências-da-implementação--2026-11-02).
