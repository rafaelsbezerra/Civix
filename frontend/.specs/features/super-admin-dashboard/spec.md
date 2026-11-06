# Telas do superadmin

## Imagens de empresa — complemento autorizado em 2026-11-02

No cadastro, permitir selecionar somente a logo (opcional), com prévia.
Enviar empresa/plano/operação no JSON existente e, após obter o ID, fazer
upload multipart da logo. Uma falha no upload não desfaz cadastro/venda:
mostrar mensagem e permitir repetir apenas o envio da mesma imagem.
Na edição, disponibilizar formulário separado para a capa, com prévia atual
e do arquivo selecionado, estado de envio, confirmação e erro recuperável.
Não enviar logo pela edição nem capa pelo cadastro. Empresas inativas não
podem receber imagens; orientar reativação. Validar PNG/JPG/WEBP e 10 MB no
navegador e manter a validação do conteúdo no backend. Revogar object URLs
das prévias locais ao substituir/desmontar. O browser define o boundary do
multipart; não forçar Content-Type JSON ou multipart sem boundary.
Reutilizar lib/api.ts, os componentes do dashboard e as duas rotas de storage.
URLs persistidas não são públicas permanentes: o backend assina por 300s.

Data: 2026-11-02. Estado: telas G0 a G7 implementadas; G8 validado localmente; abertura do PR depende de acesso ao GitHub.
[Spec de negócio](../../../../backend/.specs/features/super-admin-dashboard/spec.md),
[SDD canônico](../../../../backend/.specs/features/super-admin-dashboard/sdd.md) e
[tarefas frontend](task.md). Decisões de negócio pendentes são mantidas na
spec de negócio; detalhes visuais ficam em [design](design.md).

## Base e objetivo

frontend/src/routes/AppRoute.tsx monta o dashboard; login super_admin vai
para /super-admin. ProtectedRoute.tsx consulta profile para a área exclusiva de
super_admin; a segurança definitiva está no backend, mesmo sem o guard.
Reutilizar UI e transporte atuais; não mudar design do site institucional.

## Design e temas confirmados

O dashboard segue a identidade do site: branco/marfim, azul e amarelo.
Terá modo claro e escuro, com **modo claro como padrão**. No escuro, azul
é a cor principal, com base azul-marinho e amarelo em destaques.
Paleta, tipografia, aplicação em componentes, acessibilidade e arquivos
previstos estão na [descrição de design](design.md), parte desta spec.
Tema implementado: primeiro acesso claro e preferência guardada neste
navegador, sem modificar o tema público.

## Telas propostas e arquivos

### Layout raiz: sidebar e header

Criar um layout raiz exclusivo do dashboard superadmin, compartilhado somente
entre suas telas, sem substituir o
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

Arquivos a criar em frontend/src/components/dashboard-super-admin/layout: SuperAdminLayout.tsx,
SuperAdminSidebar.tsx e SuperAdminHeader.tsx. Montagem de rotas aninhadas em
frontend/src/routes/AppRoute.tsx; páginas renderizam apenas seu conteúdo.

### Configurações do próprio perfil

Criar a tela de configurações do superadmin autenticado, com edição de
**nome e e-mail**. Alteração de senha fica em backlog; foto de perfil não
integra o escopo aprovado. Não confundir configurações pessoais com regras
globais da plataforma nem com gestão de outros administradores.

Proposta: /super-admin/settings/profile em
frontend/src/pages/dashboard-super-admin/ProfileSettings.tsx e formulário em
frontend/src/components/dashboard-super-admin/ProfileForm.tsx. Carregar dados reais
do perfil, validar campos e e-mail único sem distinção de caixa no backend,
salvar somente campos permitidos e atualizar identificação do header.
Exibir loading, erros por campo/conflito e confirmação de sucesso.
Não enviar userId/role/companyId editáveis. Após mudança de e-mail,
reconciliar sessão conforme política aprovada no SDD, pois o JWT atual inclui
e-mail. Não tratar edição apenas local como persistência concluída.

Rotas/contratos G0 a G7 adotados em SA-P07 e implementados. Prefixo /super-admin, com layout em
frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx, protegido por
frontend/src/components/auth/ProtectedRoute.tsx. Montagem em AppRoute.tsx.

| Tela | Arquivo sugerido em frontend/src/pages/dashboard-super-admin | Comportamento |
| --- | --- | --- |
| Início | Overview.tsx | Navegação administrativa real; sem cards financeiros fictícios. |
| Empresas | Companies.tsx | Lista, filtros/estado/plano, loading/vazio/erro. |
| Nova empresa | CompanyCreate.tsx | Cadastro com plano comercial ativo e positivo; resultado empresa/venda inicial. |
| Empresa | CompanyDetail.tsx | Dados, plano, estado e acesso à equipe; sem conversas. |
| Editar empresa | CompanyEdit.tsx | Campos permitidos e troca de plano, com aviso obrigatório de venda manual. |
| Funcionários | Users.tsx | Admins/atendentes somente da empresa da rota, convite/estados e ações aprovadas. |
| Planos | Plans.tsx | Consulta/administração de dados comerciais, inclusive inativos. Sem trial/limites operacionais. |
| Vendas | Sales.tsx | Registros imutáveis, valores BRL e exclusão definitiva com confirmação; sem edição ou apresentação como pagamento. |
| Nova venda | SaleCreate.tsx | Modo pelo plano atual ou valor manual justificado, com data comercial UTC retroativa permitida. |
| Administradores | Users.tsx | Mesma tela com contexto global: convite para senha, desativação com motivo e reativação por outro ativo; todos com poderes iguais. |
| Configurações do perfil | ProfileSettings.tsx | Nome/e-mail do próprio usuário; sem senha ou configurações globais. |

Formulários em frontend/src/components/dashboard-super-admin/CompanyForm.tsx,
UserForm.tsx, PlanForm.tsx e SaleForm.tsx. UserForm atende usuários da empresa
e superadmins com campos/ações próprios do contexto autorizado, sem conceder
permissões pela apresentação visual.
Consumo concentrado no frontend/src/lib/api.ts existente; acrescentar funções
com nomes claros, sem criar outro arquivo de API. Não antecipar estado/cache/
biblioteca novo para essas telas.

### Organização e reuso

Páginas exclusivas ficam em frontend/src/pages/dashboard-super-admin e
componentes exclusivos em frontend/src/components/dashboard-super-admin,
incluindo layout, sidebar e header. Elementos com uso provável em outros
dashboards, como busca, botões e campos genéricos, permanecem na estrutura
compartilhada atual (por exemplo components/ui), sem duplicação nessa pasta.

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
   Desativar exige formulário de motivo obrigatório; não enviar motivo vazio
   ou só espaços. Arquivar informa preservação do histórico. Restaurar mantém
   empresa desativada; somente reativação explícita devolve catálogo/acesso.
   Convites anteriores à desativação não voltam a funcionar.
5. Ao abrir equipe, usar ID da empresa da rota; limpar respostas antigas ao
   trocar contexto. Erro de vínculo não permite editar outro funcionário.
6. Formulários mostram mensagens públicas, erros por campo quando disponíveis,
   conflitos e opção de tentar novamente. Produção não depende de code/stack.
7. Perda de sessão limpa dados; erro de rede mantém estado de tentativa sem
   expor conteúdo anterior a usuário não autorizado. Logout segue Bearer atual.
8. Venda não tem botão/formulário de edição. Correção exige confirmação de
   exclusão definitiva e novo lançamento manual. Se o cadastro usou plano
   errado, orientar corrigir o plano da empresa, excluir a venda automática
   e cadastrar nova venda. Nenhuma dessas ações ocorre por simples navegação.
   A troca de plano posterior continua somente com aviso de venda manual.
9. Formulário de venda oferece modo pelo plano atual e modo por valor manual.
   Pelo plano, preço somente leitura vindo do backend e motivo não obrigatório.
   Por valor manual, exigir montante e descrição/motivo; usar esse modo para
   plano antigo. Permitir data comercial passada. Entradas, filtros e exibição
   de todas as datas usam UTC identificado, sem conversão local silenciosa.
10. Gestão de usuários exige motivo ao desativar, inclusive superadmins.
    Superadmins podem criar outros; o ambiente deve suportar esse caso mesmo
    se começar com uma conta só. Não permitir desativar a própria conta nem
    o último superadmin ativo. Mostrar o bloqueio na UI e tratar a recusa da
    API; esconder botão não substitui validação no backend.
11. Superadmin é criado por convite para definir senha e pode ser reativado
    por outro ativo; todos têm os mesmos poderes. Não criar editor de permissões.
    Na equipe, permitir trocar admin_empresa/atendente e desativar o último
    admin empresarial; essa permissão não se aplica ao último superadmin.
    Atendentes podem ser excluídos/desativados, finalizando atendimentos atribuídos.

Os três planos demo com preços atuais são referência, não pré-requisito de
implementação. Sem planos cadastrados na API, mostrar estado vazio/ação de
cadastro apropriada; não impedir acesso aos demais módulos nem inventar dados.

## Aceite e limites

Navegação direta/reload, teclado, labels, foco em diálogos e resultados são
verificados. HTTP real de testes isolados prova UI → backend → persistência;
mock só de frontend não comprova entrega E2E. Tabelas distinguem vazio de
erro/indisponível. Paginação exige contrato aprovado, sem carregar toda a
plataforma silenciosamente.

Configurações globais aguardam definição. Pagamentos, assinaturas, trial e
arquitetura de capacidades/limites/regras por plano ficam em backlog; não
renderizar controles falsamente funcionais. Superadmin gerencia funcionários,
mas não acessa atendimento/conversas. Migrations não aplicadas; resultados de testes e limites estão no task backend.

**Não commitar sem revisão**, conforme regra e registro no task backend.
