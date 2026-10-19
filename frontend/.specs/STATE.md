# STATE

## Decisions

### AD-001
- **Decision**: A Civix será tratada como uma plataforma híbrida que combina descoberta de serviços para clientes e automação comercial para empresas.
- **Reason**: O posicionamento concilia o formulário de busca, o catálogo de empresas e os planos de automação presentes no Figma.
- **Trade-off**: A comunicação precisa atender dois públicos sem transformar cada tela em uma explicação completa do produto.
- **Scope**: Todas as features de produto, conteúdo e navegação da Civix.
- **Date**: 2026-08-20
- **Status**: active

### AD-002
- **Decision**: Registrar divergências entre specs históricas e frontend atual como aguardando confirmação, sem exigir retorno ao layout antigo.
- **Reason**: Orientação explícita do usuário após a auditoria de Home/Sobre.
- **Scope**: Registro documental das divergências; não autoriza restauração nem aprova todos os requisitos da composição atual.
- **Date**: 2026-10-10
- **Status**: active
- **Pendente**: definição dos requisitos vigentes de navegação, rota, assets e composição — **Aguardando resposta**.

## Referência atual

Adoção backend e auditoria documental integradas em staging bedb73a, em
2026-10-10. Na branch codex/frontend-backend-integration, derivada do PR #16,
os consumidores existentes de empresas/planos, recuperação/redefinição e primeiro
acesso foram adaptados. Login e novos destinos continuam fora do escopo por
orientação explícita do usuário. Paginação será adotada somente quando necessário.
O PR #16 implementa os repositories JSON/PostgreSQL; esta entrega depende dele. Ver o [relatório consolidado](reviews/revisao-pendencias-specs.md).

## Handoff atual — auditoria de 2026-10-10

- **Feature**: home-hero e about-page.
- **Phase / Task**: auditoria documental; requisitos vigentes **Aguardando resposta**.
- **Implementado observado**: componentes de hero/About, tokens/fontes, formulário,
  menu responsivo, metadados, testes e scripts de verificação.
- **Divergências**: /sobre não está registrada; About é seção da Home com main/h1
  adicionais. Dois assets históricos de About estão ausentes e o notebook mudou.
  Header usa destinos de aplicação, incluindo /planos sem rota registrada.
- **Next step**: confirmar se os requisitos históricos continuam obrigatórios
  ou se as alterações atuais devem ser incorporadas às specs; não escolher isso
  automaticamente. A integração dos consumidores autorizados está descrita no
  handoff abaixo; login segue adiado.
- **Verificação atual**: leitura de source/config/testes e existência de arquivos;
  sem execução de teste, lint, build, navegador, CLS, zoom ou contraste.
- **Referência**: [revisão consolidada](reviews/revisao-pendencias-specs.md).

## Handoff — integração e planejamento de 2026-10-12

- **Feature**: [backend-integration](features/backend-integration/spec.md).
- **Entregue**: envelopes, URLs/prefixos e snake_case nos consumidores existentes;
  pré-validação backend alinhada ao JWT/usuário/token da ativação de convite.
- **Preservado**: login.tsx, destinos, rotas/layouts e requisitos sob AD-002.
- **Validação**: 25 testes frontend direcionados e 60 foundation backend passaram;
  typechecks backend, TypeScript e Vite passaram. Fullsuite frontend: 65/77, com
  as mesmas 12 falhas históricas. Smoke HTTP isolado: 9/9; catálogo/busca/perfil
  e planos da Home confirmados no navegador. Build completo/lint mantêm
  falhas históricas documentadas em [integração](../../docs/frontend-backend.md).
- **Proposta**: [mapa de animações](features/entry-animations/design.md), Motion for React
  com CSS. Biblioteca é proposta; instalação/implementação aguardam leitura
  do plano atualizado e autorização posterior.
- **Entrega**: PR para staging, dependente do #16; sem novas dependências/schema.

## Handoff histórico — não representa aprovação da versão atual

A entrega da branch feature/about-page registrou PASS 15/15 e gates em agosto
de 2026 (ver validation.md de cada feature). Os checkboxes originais foram
preservados como histórico. Esse resultado não prova rota, assets ou integração
da versão atual. LESSONS.md/lessons.json permanecem registros históricos sem
edição ou promoção de candidatos nesta auditoria.

## Organização documental

Guias gerais permanecem em docs. Planos e evidências ficam nos grupos desta
pasta: [mapa de animações](features/entry-animations/design.md),
[validação da integração](features/backend-integration/validation.md),
[diagnóstico](reviews/diagnostico.md), [pendências](reviews/revisao-pendencias-specs.md)
e [decisões](decisions/decisoes.md).


## Handoff documental — navbar e manutenção frontend

- **Navbar/animações:** requisitos e mapa atualizados para leitura; nenhuma
  implementação ou instalação nesta etapa. Abrangência pública, âncoras
  Empresas/Planos e Contato preservado confirmados no plano.
- **Manutenção:** manifest/lockfile limpos; verificação e limites em
  [dependency-maintenance](features/dependency-maintenance/spec.md).



## Handoff — execução das animações autorizada em 2026-10-12

- **Feature**: [entry-animations](features/entry-animations/spec.md).
- **Referência**: worktree frontend-entry-animations, branch
  codex/frontend-entry-animations, base staging da92a07.
- **Autorizado**: instalação/uso de Motion 14.1.0 e implementação do mapa,
  incluindo navbar pública unificada, fixa, espaço de 106 px, fundo claro após
  rolagem, seção ativa e compensação das âncoras Empresas/Planos.
- **Exclusão adicional**: não animar a tela de login; login.tsx integralmente
  intacto. Navbar ausente em login/formulários; preservar fluxos de acesso.
- **Preservado**: Contato /#contato sem alterar destino ou criar ID/bloco;
  AD-002 para divergências históricas não relacionadas ao escopo aprovado.
- **Estado**: autorizado/em execução. Não marcar entregue antes de verificação;
  registrar testes, runtime e limites no grupo da feature após obter evidências.
- **Entrega histórica**: sem commit durante a implementação inicial. Restrição anterior de apenas documentar
  substituída pela autorização vigente; demais históricos permanecem históricos.


## Handoff — implementação pública de navbar/animações

- **Instalado**: Motion 14.1.0 fixado; MotionRoot/entradas e navbar públicas
  implementados. Modal/menu com foco e preferência reduzida contemplados.
- **Preservado**: login, primeiro acesso, recuperação e redefinição
  integralmente intactos. A5 fora de escopo; nenhuma navbar/motor nesses destinos.
- **Verificação**: 57 testes direcionados finais, lint, TypeScript e Vite passaram.
  Suíte completa 86/97, com 11 falhas históricas em sete arquivos. Gate About
  dashboard.png mantém falha histórica no build completo.
- **Executado**: A7/navegador nas cinco larguras, API lenta/erro, âncoras,
  menu/modal e comparação de bundle; limites nativos/CLS/e2e registrados em
  [entry-animations/validation.md](features/entry-animations/validation.md).
- **Entrega**: commit/push/PR autorizados em 2026-10-12; verificações executadas com limites explícitos.


## Fechamento da verificação de navbar/animações

57/57 direcionados finais passaram; a suíte completa anterior à inclusão
de quatro testes de scroll registrou 86/97 e 11 falhas históricas. Cinco
larguras, API lenta/indisponível, foco/modal/menu, âncoras e bundle foram
verificados. A7 concluído como verificação executada, com preferência nativa
reduced motion, e2e histórico e CLS quantitativo não executados/medidos.
Login e todos os formulários permanecem integralmente preservados. Verificação registrada antes da autorização de publicação.


## Handoff — publicação autorizada em 2026-10-12

- **Autorizado**: commit da entrega, push de codex/frontend-entry-animations
  e abertura de PR para staging.
- **Estado vigente**: publicação autorizada, substituindo a restrição anterior
  de sem commit. Os registros anteriores de execução sem commit são históricos.
- **PR**: número/URL pendentes de criação; não afirmar publicação já realizada.
- **Preservado**: escopo público, todas as telas de acesso intactas e limites
  de verificação registrados na feature. Nenhuma autorização de merge implícita.

## Adoção HTTP no frontend — 2026-10-19

Autorizado incluir o login na integração, superando sua exclusão histórica.
Cada service de API extrai `data` do envelope `{ data, meta? }`; o transporte
comum valida o envelope e trata erros públicos por `message` e status HTTP.
Não haverá interceptor que remova o envelope. Telas recebem dados de domínio,
sem depender de `code`, `details` ou `stack`, ausentes em produção.

Login envia email, role e password quando empresa a `/api/v1/users/login`.
O service retorna `{ user: { id, name, email, role }, token }`. A tela grava
o token somente após sucesso válido e mantém os destinos existentes. Não
criar dashboard, sessão nova, refresh token, endpoints ou paginação. Falhas de
rede, JSON inválido e resposta sem envelope devem resultar em erro legível.

Verificação prevista: contratos dos services, login de ambos os perfis,
mensagens públicas, falhas de rede/envelope, TypeScript e lint. Registrar os
resultados efetivamente executados na entrega, sem reutilizar provas antigas.

### Entrega HTTP de 2026-10-19

Login e extração por service implementados. 29 testes direcionados, tipagem e
lint aprovados. Vite gera bundle; build completo bloqueado pela checagem de
asset Sobre `dashboard.png`. Ver validação de backend-integration.
