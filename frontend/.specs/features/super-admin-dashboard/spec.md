# Telas do superadmin

Data: 2026-11-02. Estado: planejadas; nenhuma tela implementada nesta tarefa.
[Spec de negócio](../../../../backend/.specs/features/super-admin-dashboard/spec.md),
[SDD canônico](../../../../backend/.specs/features/super-admin-dashboard/sdd.md) e
[tarefas frontend](task.md). Decisões pendentes são mantidas somente na spec
de negócio para evitar regras divergentes.

## Base e objetivo

frontend/src/routes/AppRoute.tsx não monta dashboards. Login retorna à Home;
ProtectedRoute.tsx já consulta profile. Evoluir para uma área exclusiva de
super_admin; a segurança definitiva está no backend, mesmo sem o guard.
Reutilizar UI e transporte atuais; não mudar design do site institucional.

## Telas propostas e arquivos

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
