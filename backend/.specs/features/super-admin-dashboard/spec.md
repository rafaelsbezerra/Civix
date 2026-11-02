# Dashboard superadmin — gestão da plataforma

Data: 2026-11-02. Estado: especificação; nenhuma implementação autorizada
nesta entrega documental. Base observada: staging, commit 9d995d2.

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
Não confundir estado de verificação atual com suspensão administrativa.

Suspender aplica bloqueio também a tokens já emitidos nas chamadas seguintes
e à leitura pública de capas. Arquivar preserva empresa, usuários, vendas e
referências históricas, bloqueando acesso empresarial e catálogo. Reativação
e restauração dependem de SA-P02. Falhas não deixam cadastro sem sua venda.

### SA-03 — Gerenciar equipe de uma empresa

Consultar, convidar, editar dados permitidos e suspender acessos de
admin_empresa/atendente no contexto de uma empresa existente. Validar
companyId da URL e do usuário persistido em toda alteração. Um funcionário
de outra empresa não pode ser alterado pela troca de ID no formulário.
Não aceitar transferência de vínculo ou promoção para super_admin nesse fluxo.
Convite reutiliza primeiro acesso/reenvio existentes, sem distribuir senhas.
Remoção, destino de atribuições e proteção do último admin exigem SA-P03.

### SA-04 — Administrar planos

Consultar planos ativos/inativos, criar e editar dados comerciais e ativar ou
desativar para novos vínculos. Valor monetário deve ser positivo; usar decimal
exato e BRL, nunca ponto flutuante para somar vendas. Preservar IDs/slugs e
histórico de vendas; edição do preço não altera vendas já lançadas.
Plano inativo continua identificável no histórico, mas não é elegível para
novo cadastro/troca. Inicial, Pro e novos nomes são dados configuráveis;
nomes/preços finais e adequação do seed gratuito atual exigem SA-P01.
Não implementar exclusão física de plano em uso nem enforcement de limits.

### SA-05 — Consultar e lançar vendas

Venda inicial automática integra o caso de cadastro, com repetição segura.
Listagem/detalhe apresentam empresa, plano registrado, origem, valor BRL,
período comercial, data e autor, sem chamar o registro de pagamento.
Venda manual exige empresa, plano, valor e motivo validados; preenchimento
pode sugerir o preço do plano, sem confiar no valor fornecido pelo navegador.
Definir diferenças permitidas de preço, datas e correções em SA-P04.

Trocar plano atualiza o vínculo empresarial e mostra permanentemente no
formulário: “A alteração do plano não gera uma venda automática. Registre
a venda manualmente na área de vendas.” O sucesso oferece acesso à ação
manual autorizada. Não criar renovação ou venda automática adicional.

### SA-06 — Gerenciar administradores da plataforma

Listar e administrar superadmins separadamente dos usuários empresariais,
sempre com company_id nulo. Backend valida privilégio vigente do ator,
campos permitidos e unicidade do e-mail. Não reutilizar convite empresarial
para superadmin sem adaptar sua validação. Ciclo de convite, retirada de
acesso, autoedição e proteção do último superadmin dependem de SA-P05.
Permissões globais não definidas não viram um editor arbitrário de papéis.

### SA-07 — Configurações globais

**Aguardando resposta — SA-P06:** não há chaves/regras aprovadas. Registrar
seção no planejamento; não expor endpoint genérico chave/valor, edição de
ambiente/credenciais ou formulário aparentemente funcional.

## Aguardando resposta

| ID | Decisão pendente | Parte impedida |
| --- | --- | --- |
| SA-P01 | Nomes, preços positivos e períodos dos planos iniciais; política para o seed Inicial zero existente no SQL. | Seed final, publicação dos planos e teste de cadastro com planos finais. Banco vazio não autoriza inventar preços. |
| SA-P02 | Reativação/restauração permitida? Estado e motivo de suspensão, efeitos em convites, restauração de visibilidade. | Transições além de suspender/arquivar e DDL definitivo. |
| SA-P03 | Dados editáveis, proteção do último admin empresarial, remoção de atendentes e destino de futuras atribuições. | Exclusão/transferência de equipe e mutações não definidas. |
| SA-P04 | Venda manual sempre pelo preço do plano ou valor ajustável? Motivo, data retroativa, correção/cancelamento e precisão de filtros temporais/fuso. | Contrato final da venda manual, relatórios e correções. |
| SA-P05 | Provisionamento de novos superadmins, proteção do último superadmin, autoexclusão/autossuspensão e catálogo de permissões globais. | Mutações sensíveis de superadmins e permissões. |
| SA-P06 | Quais configurações globais e regras serão editáveis? | Área de configurações e sua persistência/API. |
| SA-P07 | Aprovar desenho proposto no SDD: URLs, contratos, transação/idempotência, campos incrementais, paginação e auditoria mínima. | Implementação das escolhas técnicas propostas. |

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
