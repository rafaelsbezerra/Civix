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
