# Dashboard superadmin — gestão da plataforma

Data: 2026-11-02. G0 a G4 concluídos na branch feat/super-admin-dashboard.
G5 a G8 e equivalentes frontend autorizados para continuação, com decisões
técnicas novas aguardando confirmação no SDD/task antes da parte afetada.
A baseline inicial desta spec era staging, commit 9d995d2.

[Desenho e fluxos](sdd.md) · [Tarefas e commits sugeridos](task.md) ·
[Par frontend](../../../../frontend/.specs/features/super-admin-dashboard/spec.md).

## Resultado esperado

O super_admin acessa uma área administrativa real para cadastrar, consultar,
editar, suspender e arquivar empresas; gerenciar seus administradores e
atendentes; administrar planos e usuários superadmins; consultar e registrar
vendas comerciais. Cada empresa pode possuir vários atendentes, vinculados
somente a ela. Gestão administrativa não concede acesso a conversas.

Esta spec detalha a entrega de superadmin do planejamento de
[dashboards](../../roadmaps/dashboards/README.md), sem entregar os dashboards
de admin_empresa ou atendente nem substituir suas regras de atendimento.
No escopo desta entrega, as confirmações abaixo atualizam o planejamento
anterior; os demais casos de uso continuam nas specs de origem.

## Decisões confirmadas nesta conversa

| ID | Decisão |
| --- | --- |
| SA-D01 | Superadmin gerencia empresas, planos, admins/atendentes das empresas e outros superadmins. |
| SA-D02 | Cadastro de empresa lança automaticamente uma venda comercial baseada no plano escolhido. Não cria assinatura ou cobrança. |
| SA-D03 | Mudança de plano não lança venda automaticamente. O superadmin registra a venda manualmente e vê essa observação no formulário de edição da empresa. |
| SA-D04 | Sem planos gratuitos nesta entrega. Venda em reais (BRL), preservando preço e período do plano no momento do registro. |
| SA-D05 | Suspender empresa bloqueia login/acesso dos usuários empresariais e a oculta do catálogo público. |
| SA-D06 | Exclusão de empresa é soft delete, preservando histórico. Não implementar exclusão física por essa ação. |
| SA-D07 | Assinaturas, cobranças e pagamentos ficam em backlog até integração financeira. Venda não é pagamento confirmado. |
| SA-D08 | Configurações globais não possuem definição; sua implementação permanece bloqueada. |
| SA-D09 | Arquitetura de teste gratuito, permissões por plano, limites de uso e regras de cada plano fica em backlog. |
| SA-D10 | Banco informado vazio: não há registros existentes de planos a converter. Não aplicar migrations automaticamente. |
| SA-D11 | Layout raiz com sidebar/header é exclusivo do dashboard superadmin e compartilhado apenas entre suas telas; perfil permite nome/e-mail e senha fica em backlog. |
| SA-D12 | Design segue branco/azul/amarelo do site, modo claro padrão e modo escuro com azul principal; detalhes na spec frontend. |
| SA-D13 | Cadastro com plano/venda fica nos arquivos existentes de company. Gestão empresarial e global de usuários fica nos arquivos existentes de user, com nomes que expressem operação e escopo. |
| SA-D14 | Frontend mantém um único frontend/src/lib/api.ts. Páginas e componentes exclusivos usam dashboard-super-admin; componentes compartilháveis mantêm a estrutura atual. |
| SA-D15 | Vendas são imutáveis: não existe edição. Correção exige exclusão definitiva no banco e novo lançamento manual. |
| SA-D16 | Empresa cadastrada com plano errado exige corrigir o plano da empresa, excluir a venda automática incorreta e lançar nova venda manualmente. Troca posterior de plano mantém SA-D03, sem venda automática e com aviso obrigatório. |
| SA-D17 | Reativação e restauração de empresas são permitidas. Toda desativação de empresa exige motivo informado e persistido. |
| SA-D18 | Regra atualizada: venda pode usar o plano atual da empresa, pelo preço lido no backend, ou valor informado manualmente, exigindo descrição/motivo nesse segundo modo. |
| SA-D19 | Superadmins podem criar e desativar outros superadmins; desativação exige motivo. Preparar esse caso mesmo que inicialmente exista só uma conta. |
| SA-D20 | Todo usuário exige motivo para ser desativado, inclusive admin_empresa, atendente e super_admin. |
| SA-D21 | Impedir desativação da própria conta de superadmin e do último superadmin ativo. Regras são obrigatórias no backend, inclusive sob concorrência. |
| SA-D22 | Usar como referência os três planos demo com preço exibidos no frontend. Existência/ativação de registros no banco não bloqueia a implementação dos módulos; plano é validado na execução do cadastro. Alterações futuras pela administração de planos. |
| SA-D23 | Restaurar empresa mantém a desativação até reativação explícita. Catálogo só volta após reativação. Convites anteriores à desativação não permanecem válidos. |
| SA-D24 | Permitir troca de papel entre admin_empresa/atendente e desativação do último admin empresarial. Atendentes podem ser desativados ou excluídos; atendimentos atribuídos são finalizados. Isso não elimina a proteção do último superadmin. |
| SA-D25 | Venda pelo plano atual não exige motivo; registro por valor manual exige descrição/motivo e atende vendas de plano antigo. Permitir data passada, mantendo vendas imutáveis após registro. |
| SA-D26 | Datas de todo o sistema em UTC: persistência, contratos, entrada de datas, exibição e filtros sem conversão implícita para fuso local. |
| SA-D28 | Usar somente companies.status para ativar/desativar; não criar administrative_status. Verificação permanece em verificado. |
| SA-D27 | Criar superadmin por convite para definir senha; superadmin desativado pode ser reativado por outro ativo. Todos possuem os mesmos poderes. |

Papéis técnicos, vínculo único e cliente sem área logada continuam conforme
[users-roles](../users-roles/spec.md). Bearer atual é preservado; não acrescentar
refresh, cookies ou novo mecanismo de sessão para preencher este dashboard.

## Base observada e dependências

- [PlanService](../../../src/services/plan.service.ts) lista planos ativos e
  atribui plano ao usuário. [PlanRepository](../../../src/repositories/plan.repository.ts)
  não tem CRUD administrativo. Evoluir o módulo existente, sem criar outro.
- [CompanyService](../../../src/services/company.service.ts) cadastra empresa,
  consulta catálogo e trata chaves de imagem. Cadastro não associa plano à
  empresa e não cria venda. Catálogo precisa filtrar suspensão/arquivamento.
- [AdminService](../../../src/services/admin.service.ts) já prepara convites
  empresariais; [app](../../../src/app.ts) não monta o router admin. Publicar
  operações administrativas exige autorização explícita por operação.
- Auth importa user.access.service ausente na base observada; o helper está
  em user.service. SQL de users não declara company_id, apesar do uso nos
  adapters. Resolver coerência de código/DDL antes dos casos E2E.
- [AppRoute](../../../../frontend/src/routes/AppRoute.tsx) só monta rotas
  públicas. ProtectedRoute já existe, mas dashboard não está montado.
- Algumas specs antigas descrevem empresa/cliente e profile antigo.
  Este inventário observa código, sem transformar testes históricos em
  evidência do commit atual. A condição da base deverá ser revalidada.

## Casos de uso e critérios de aceite

### SA-01 — Abrir a área administrativa

Com sessão válida, carregar profile e validar super_admin vigente antes de
consultar dados administrativos. Menu apresenta somente módulos entregues.
Admin/atendente/cliente não acessam APIs nem páginas de plataforma. Sessão
expirada limpa estado privado; falha de rede permite tentar novamente.
Não mostrar números financeiros fictícios ou uma integração ausente como zero.

### SA-02 — Gerenciar empresas

Listar e consultar empresas com estado administrativo, plano e equipe; criar
empresa com plano comercial ativo e gerar exatamente uma venda inicial.
Validar UUIDs, campos permitidos, e-mail único sem distinção de caixa e CNPJ
único. Edição não aceita chaves de storage ou papel de usuário no body.
Usar somente status para ativação/desativação; verificado permanece booleano
separado. Status legado verificado continua elegível como ativo.

Suspender aplica bloqueio também a tokens já emitidos nas chamadas seguintes
e à leitura pública de capas. Arquivar preserva empresa, usuários, vendas e
referências históricas, bloqueando acesso empresarial e catálogo. Reativação
e restauração são permitidas. Restaurar não reativa: a empresa continua
desativada, sem catálogo ou acesso, até reativação explícita. Invalidar os
convites anteriores à desativação; reativar não os torna válidos novamente.
Desativar exige motivo não vazio, validado pelo backend e salvo com a
alteração. Sem motivo, recusar e preservar o estado. Falhas não deixam
cadastro sem sua venda.

### SA-03 — Gerenciar equipe de uma empresa

Consultar, convidar, editar dados permitidos e suspender acessos de
admin_empresa/atendente no contexto de uma empresa existente. Validar
companyId da URL e do usuário persistido em toda alteração. Um funcionário
de outra empresa não pode ser alterado pela troca de ID no formulário.
Não aceitar transferência de vínculo ou promoção para super_admin nesse fluxo.
Convite reutiliza primeiro acesso/reenvio existentes, sem distribuir senhas.
É permitido alterar papel entre admin_empresa/atendente e desativar o último
admin empresarial. Atendentes podem ser desativados ou excluídos; seus
atendimentos atribuídos são finalizados. A proteção do último superadmin
continua obrigatória e não se estende por inferência ao admin da empresa.
Desativação de usuário exige motivo não vazio e persistido; não remover a
conta nem confundir esse bloqueio individual com suspensão da empresa.

### SA-04 — Administrar planos

Consultar planos ativos/inativos, criar e editar dados comerciais e ativar ou
desativar para novos vínculos. Valor monetário deve ser positivo; usar decimal
exato e BRL, nunca ponto flutuante para somar vendas. Preservar IDs/slugs e
histórico de vendas; edição do preço não altera vendas já lançadas.
Plano inativo continua identificável no histórico, mas não é elegível para
novo cadastro/troca. Inicial, Pro e novos nomes são dados configuráveis;
usar os três planos já cadastrados, sem bloquear a entrega por nova definição
de catálogo. Alterações futuras são feitas na administração de planos.
Não implementar exclusão física de plano em uso nem enforcement de limits.

### SA-05 — Consultar e lançar vendas

Venda inicial automática integra o caso de cadastro, com repetição segura.
Listagem/detalhe apresentam empresa, plano registrado, origem, valor BRL,
período comercial, data e autor, sem chamar o registro de pagamento.
O lançamento possui dois modos: pelo plano atual da empresa, com preço
consultado pelo backend e sem motivo obrigatório; ou por valor manual com
descrição/motivo obrigatório, inclusive para um plano antigo. Não selecionar
plano antigo como se fosse o plano atual para obter preço automático.
Preservar valor, origem do preço e dados comerciais no snapshot. Permitir
data de venda passada em UTC, distinta do instante real do lançamento.
Venda não pode ser
editada. Para corrigir qualquer venda, inclusive a automática de um cadastro
com plano errado, excluir definitivamente o registro e lançar outro
manualmente. Exclusão de venda não exclui empresa nem altera seu plano.
O formulário de edição da empresa e a área de vendas devem orientar esse
fluxo sem executar exclusão/novo lançamento implicitamente.

Trocar plano atualiza o vínculo empresarial e mostra permanentemente no
formulário: “A alteração do plano não gera uma venda automática. Registre
a venda manualmente na área de vendas.” O sucesso oferece acesso à ação
manual autorizada. Não criar renovação ou venda automática adicional.

### SA-06 — Gerenciar administradores da plataforma

Listar e administrar superadmins separadamente dos usuários empresariais,
sempre com company_id nulo. Backend valida privilégio vigente do ator,
campos permitidos e unicidade do e-mail. Não reutilizar convite empresarial
para superadmin sem adaptar sua validação. Um superadmin ativo pode criar
outros e desativá-los com motivo obrigatório. Não pode desativar a própria
conta nem o último superadmin ativo, mesmo com motivo ou chamada direta à
API. O backend revalida ator e quantidade de ativos na mesma operação que
altera o acesso, impedindo que requisições concorrentes deixem zero ativos.
Preparar e testar esse cenário mesmo que só uma conta exista inicialmente.
Criação usa convite para o novo superadmin definir a própria senha, sem senha
padrão. Outro superadmin ativo pode reativar a conta desativada. Todos têm
os mesmos poderes; não criar níveis, matriz individual ou editor de permissões.

### SA-07 — Configurações globais

Configurações do próprio perfil são uma entrega distinta, confirmada em
SA-D11: editar nome/e-mail do ator autenticado, sem gerenciar terceiros.
O [SDD](sdd.md) descreve validação, persistência e a decisão pendente de
sessão após trocar e-mail. Não confundir essa tela com a área global abaixo.

**Aguardando resposta — SA-P06:** não há chaves/regras aprovadas. Registrar
seção no planejamento; não expor endpoint genérico chave/valor, edição de
ambiente/credenciais ou formulário aparentemente funcional.

## Decisões resolvidas — SA-P01 a SA-P05

| ID | Resolução |
| --- | --- |
| SA-P01 | Planos demo atuais como referência; dados no banco não bloqueiam construção dos módulos. Validar plano ao executar cadastro. |
| SA-P02 | Restaurar mantém empresa desativada; reativação explícita devolve catálogo/acesso elegível. Invalidar convites anteriores. |
| SA-P03 | Troca admin_empresa/atendente e desativação do último admin empresarial permitidas; atendentes podem ser excluídos e atendimentos atribuídos são finalizados. |
| SA-P04 | Pelo plano atual/preço do backend sem motivo obrigatório ou por valor manual com descrição/motivo; data passada permitida, UTC em todo o sistema. |
| SA-P05 | Convite para definir senha, reativação por outro superadmin ativo e poderes iguais para todos; manter bloqueios da própria conta/último ativo. |

Detalhes de contrato, campos e execução transacional continuam em SA-P07,
sem reabrir estas decisões funcionais nem exigir dados reais para implementar.

## Aguardando resposta

| ID | Decisão pendente | Parte impedida |
| --- | --- | --- |
| SA-P06 | Quais configurações globais e regras serão editáveis? | Área de configurações e sua persistência/API. |
| SA-P07 | Aprovar desenho proposto no SDD: URLs, contratos, transação/idempotência, campos incrementais, paginação e auditoria mínima. | G0 a G4 adotados nesta rodada. Escolhas de grupos posteriores seguem sujeitas à implementação/revisão. |

Pendências não bloqueiam a escrita desta spec; bloqueiam a implementação
do trecho afetado. Não interpretar a aprovação deste planejamento como
aprovação automática de schema, bibliotecas ou mecanismos novos.

## Backlog explícito e fora do escopo

- Assinaturas, cobranças, pagamentos, gateway, renovação e conciliação.
- Arquitetura de teste gratuito: início/fim, elegibilidade, expiração,
  conversão e efeitos em acesso. Nenhum trial nesta entrega.
- Arquitetura de capacidades por plano: funcionalidades, limites, medição,
  regras, exceções e enforcement backend/frontend. Features atuais podem
  continuar descritivas; não representam permissões operacionais.
- Mudança automática de preço, rateio, cupons e cobrança proporcional.
- Alteração de senha na tela de configurações do perfil.
- Dashboards de empresa/atendente, atendimento e acesso do superadmin a
  conversas, prompts, transcrições ou credenciais de empresas.
- Indicadores de receita recebida, MRR, inadimplência ou custos IA sem fonte.

## Regra de revisão e entrega

**Não commitar sem revisão.** Antes de cada grupo, revisar diff, casos de
aceite, decisões pendentes, contratos, dados sensíveis e verificações.
Registrar revisor, escopo e resultado; corrigir bloqueadores e só então
autorizar o commit. Mensagens no task.md são sugestões, não commits feitos.
Se não houver revisor disponível, manter alterações sem commit e informar.
Não executar migrations automaticamente, não fazer merge sem revisão e não
publicar endpoints com handlers vazios ou autorização pendente.
