# Telas do superadmin

Data: 2026-11-02. Estado: planejadas; nenhuma tela implementada nesta tarefa.
[Spec de negócio](../../../../backend/.specs/features/super-admin-dashboard/spec.md),
[SDD canônico](../../../../backend/.specs/features/super-admin-dashboard/sdd.md) e
[tarefas frontend](task.md). Decisões de negócio pendentes são mantidas na
spec de negócio; detalhes visuais ficam em [design](design.md).

## Base e objetivo

frontend/src/routes/AppRoute.tsx não monta dashboards. Login retorna à Home;
ProtectedRoute.tsx já consulta profile. Evoluir para uma área exclusiva de
super_admin; a segurança definitiva está no backend, mesmo sem o guard.
Reutilizar UI e transporte atuais; não mudar design do site institucional.

## Design e temas confirmados

O dashboard segue a identidade do site: branco/marfim, azul e amarelo.
Terá modo claro e escuro, com **modo claro como padrão**. No escuro, azul
é a cor principal, com base azul-marinho e amarelo em destaques.
Paleta, tipografia, aplicação em componentes, acessibilidade e arquivos
previstos estão na [descrição de design](design.md), parte desta spec.
Persistência da escolha de tema ainda aguarda definição. Nenhum tema foi
implementado nesta atualização documental.

## Telas propostas e arquivos

### Layout raiz: sidebar e header

Criar um layout raiz compartilhado da área autenticada, sem substituir o
App.tsx do site. SuperAdminLayout.tsx envolve as rotas filhas com sidebar,
header e região principal renderizada por Outlet. Navegar entre telas
preserva essa estrutura; nenhuma página recria seu próprio menu/header.

Sidebar: marca Civix, navegação para Início, Empresas, Planos, Vendas,
Administradores e Configurações do perfil. Indicar item ativo também por
texto/forma, mostrar apenas destinos disponíveis e oferecer recolhimento
responsivo; no celular, drawer acessível com abertura/fechamento por teclado,
foco controlado e fechamento após navegação. Sem menu de conversas.

Header: título/contexto da página, botão da sidebar quando necessário,
controle claro/escuro, identificação do usuário, acesso ao próprio perfil
e saída da sessão. Não incluir busca global, notificações ou seletor de
empresa sem caso de uso aprovado. Aplicar temas a ambos e aos seus portais.

Arquivos a criar em frontend/src/components/layout: SuperAdminLayout.tsx,
SuperAdminSidebar.tsx e SuperAdminHeader.tsx. Montagem de rotas aninhadas em
frontend/src/routes/AppRoute.tsx; páginas renderizam apenas seu conteúdo.

### Configurações do próprio perfil

Criar a tela de configurações do superadmin autenticado, com edição de
**nome e e-mail**. Alteração de senha fica em backlog; foto de perfil não
integra o escopo aprovado. Não confundir configurações pessoais com regras
globais da plataforma nem com gestão de outros administradores.

Proposta: /super-admin/settings/profile em
frontend/src/pages/super-admin/ProfileSettings.tsx e formulário em
frontend/src/components/super-admin/ProfileForm.tsx. Carregar dados reais
do perfil, validar campos e e-mail único sem distinção de caixa no backend,
salvar somente campos permitidos e atualizar identificação do header.
Exibir loading, erros por campo/conflito e confirmação de sucesso.
Não enviar userId/role/companyId editáveis. Após mudança de e-mail,
reconciliar sessão conforme política aprovada no SDD, pois o JWT atual inclui
e-mail. Não tratar edição apenas local como persistência concluída.

Rotas/contratos são propostas SA-P07. Prefixo /super-admin, com layout em
frontend/src/components/layout/SuperAdminLayout.tsx, protegido por
frontend/src/components/auth/ProtectedRoute.tsx. Montagem em AppRoute.tsx.

| Tela | Arquivo sugerido em frontend/src/pages/super-admin | Comportamento |
| --- | --- | --- |
| Início | Overview.tsx | Navegação administrativa real; sem cards financeiros fictícios. |
| Empresas | Companies.tsx | Lista, filtros/estado/plano, loading/vazio/erro. |
| Nova empresa | CompanyCreate.tsx | Cadastro com plano comercial ativo e positivo; resultado empresa/venda inicial. |
| Empresa | CompanyDetail.tsx | Dados, plano, estado e acesso à equipe; sem conversas. |
| Editar empresa | CompanyEdit.tsx | Campos permitidos e troca de plano, com aviso obrigatório de venda manual. |
| Funcionários | CompanyUsers.tsx | Admins/atendentes somente da empresa da rota, convite/estados e ações aprovadas. |
| Planos | Plans.tsx | Consulta/administração de dados comerciais, inclusive inativos. Sem trial/limites operacionais. |
| Vendas | Sales.tsx | Registros comerciais, origem e valores BRL, sem apresentar como pagamentos. |
| Nova venda | SaleCreate.tsx | Registro manual conforme SA-P04, empresa/plano pré-preenchíveis após edição. |
| Administradores | Administrators.tsx | Superadmins separados dos funcionários; mutações dependem de SA-P05. |
| Configurações do perfil | ProfileSettings.tsx | Nome/e-mail do próprio usuário; sem senha ou configurações globais. |

Formulários em frontend/src/components/super-admin/CompanyForm.tsx,
CompanyUserForm.tsx, PlanForm.tsx, SaleForm.tsx e AdministratorForm.tsx.
Consumo em frontend/src/lib/platform.api.ts, reutilizando contrato HTTP de
api.ts. Não antecipar estado/cache/biblioteca novo para essas telas.

## Fluxos de UI

1. Login válido consulta identidade; superadmin vai para rota existente.
   Outros perfis são impedidos de acessar /super-admin e suas APIs.
2. Criar empresa busca planos válidos, valida formulário e envia uma operação
   repetível com segurança. Desabilitar submit ajuda UX, mas deduplicação
   obrigatória está no backend. Falha não vira sucesso fictício.
3. Editar empresa carrega registro por companyId. Mostrar: “A alteração do
   plano não gera uma venda automática. Registre a venda manualmente na área
   de vendas.” Após sucesso, oferecer a ação; navegar não envia venda sozinho.
4. Suspender/arquivar exige confirmação com empresa e consequência visíveis.
   Arquivar informa preservação do histórico. Reativar/restaurar não é
   oferecido antes de SA-P02.
5. Ao abrir equipe, usar ID da empresa da rota; limpar respostas antigas ao
   trocar contexto. Erro de vínculo não permite editar outro funcionário.
6. Formulários mostram mensagens públicas, erros por campo quando disponíveis,
   conflitos e opção de tentar novamente. Produção não depende de code/stack.
7. Perda de sessão limpa dados; erro de rede mantém estado de tentativa sem
   expor conteúdo anterior a usuário não autorizado. Logout segue Bearer atual.

## Aceite e limites

Navegação direta/reload, teclado, labels, foco em diálogos e resultados são
verificados. HTTP real de testes isolados prova UI → backend → persistência;
mock só de frontend não comprova entrega E2E. Tabelas distinguem vazio de
erro/indisponível. Paginação exige contrato aprovado, sem carregar toda a
plataforma silenciosamente.

Configurações globais aguardam definição. Pagamentos, assinaturas, trial e
arquitetura de capacidades/limites/regras por plano ficam em backlog; não
renderizar controles falsamente funcionais. Superadmin gerencia funcionários,
mas não acessa atendimento/conversas. Nenhuma migration/teste foi executado.

**Não commitar sem revisão**, conforme regra e registro no task backend.
