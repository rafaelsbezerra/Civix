# Animações de entrada — spec

**Status:** implementação, instalação e verificação executadas no escopo
público; limitações documentadas. Commit, push e PR autorizados em 2026-10-12. Branch codex/frontend-entry-animations, base staging da92a07.
Motion 14.1.0 está instalado e fixado no manifest/lockfile.
**Data:** 2026-10-12.

## Objetivo e escopo

Dar orientação visual à leitura do site com entradas curtas e consistentes,
nos consumidores existentes. Implementar [o mapa aprovado](design.md), com
a instalação autorizada de Motion, respeitando rotas, seções e estados reais.
Navbar pública e entradas não modificam os contratos HTTP ou fluxos de acesso.

A implementação não cria dashboard, endpoints, cadastro público, pagamentos
ou mudanças na composição de conteúdo, exceto ajustes necessários da navbar
fixa e sua unificação autorizadas. About continua seção da Home; divergências históricas
seguem [AD-002](../../STATE.md). A página Plans não possui rota registrada; esta integração não cria a rota.
Não animar essa página não montada nem expor uma nova rota.
**Todas as telas de acesso estão excluídas:** login.tsx, FirstAccess.tsx,
ForgotPassword.tsx e ResetPassword.tsx permanecem integralmente intactos.
Não acrescentar navbar, atributos/motor de animação ou mudar seus fluxos;
a animação existente do login também é preservada. MotionRoot não atua em
/login, /primeiro-acesso (com/sem token), /esqueci-senha e /redefinir-senha.

## Requisitos autorizados e verificáveis

| ID | Critério verificável |
| --- | --- |
| ANIM-01 | Cada destino da tabela do mapa tem tratamento explícito de mount, viewport ou conteúdo imediatamente estático |
| ANIM-02 | Entradas usam presets comuns, opacity/transform e stagger limitado por grupo visível, sem ocultar elementos indefinidamente |
| ANIM-03 | Nas páginas públicas do escopo, reduced motion elimina entradas, deslocamento/atraso e Lenis; a mudança funciona durante a sessão. Telas de acesso preservadas |
| ANIM-04 | Requisições, mensagens de erro/sucesso, submissão e navegação não aguardam animações; carregamento, vazio e erro permanecem legíveis |
| ANIM-05 | IDs da API preservam identidade; resultados tardios entram e listas grandes não acumulam delays globais ou repetição ao scroll |
| ANIM-06 | Teclado, foco, âncoras, menu e dialog continuam utilizáveis; foco em entrada revela o controle imediatamente |
| ANIM-07 | Animações não substituem transforms existentes, não acrescentam overflow/CLS, e efeitos/observers são limpos no unmount/Strict Mode |
| ANIM-08 | Medir bundle e comportamento nos viewports 320/390/768/1024/1728 px e com backend lento/indisponível antes de declarar execução concluída |

## Navbar: requisitos aprovados

O usuário autorizou a implementação da navbar e das animações após ler o
plano. Login e todos os formulários de acesso são excluídos integralmente.
Navbar é unificada somente nas páginas públicas previstas.

- Navbar fixa no topo durante rolagem, com espaço reservado de 106 px.
- Fundo claro após scroll, coerente com a interface atual.
- Item ativo conforme a seção visível em desktop e mobile.
- Compensar a altura da navbar ao navegar por âncoras.
- Manter a navbar abaixo do modal na ordem de sobreposição.
- Unificar a navbar das páginas públicas, incluindo ajuda, termos,
  privacidade e 404; preservar login e formulários de acesso.
- Empresas aponta para /#empresas; Planos para /#planos. O catálogo permanece
  acessível pelo botão Ver todas, sem criar a rota /planos.
- Preservar Contato exatamente como está: /#contato. Não criar bloco/ID
  nem alterar o destino. A âncora atualmente não existe; registrar esse
  limite sem resolver incidentalmente.

Verificar rolagem, espaço reservado, seção ativa, compensação de âncoras,
sobreposição do modal e navegação desktop/mobile na implementação.
AD-002 continua vigente para outras divergências de Home/Sobre.

## Autorização de implementação — 2026-10-12

Implementação e instalação de Motion 14.1.0 autorizadas nesta worktree,
derivada da staging da92a07. A restrição anterior de somente documentar foi
substituída por essa autorização. Não repetir a pergunta de instalação.

Login.tsx, FirstAccess.tsx, ForgotPassword.tsx e ResetPassword.tsx devem
permanecer integralmente intactos, sem navbar ou novas animações. A5 está
fora do escopo, não concluído. Não mudar os fluxos de acesso. Contato
/#contato continua inalterado, sem criar um ID/bloco para corrigir a âncora.
AGENTS, backend, schema, variáveis privadas e dados locais ficam fora do escopo.
A restrição inicial de sem commit foi substituída pela autorização de entrega abaixo.

## Implementação e verificação

MotionRoot usa motion/mini carregado sob demanda, com presets comuns,
IntersectionObserver e MutationObserver. Controles focados ficam visíveis;
falha de API visual/biblioteca não deve bloquear conteúdo. Navbar pública
fixa e unificada mantém 106 px, âncoras e sobreposição abaixo do modal.

Passaram 57 testes direcionados, lint, TypeScript e Vite. Suíte completa:
97 testes, 86 aprovados e 11 falhas históricas em sete arquivos, antes dos
quatro testes adicionais de PublicSmoothScroll da rodada final direcionada. Build completo
continua falhando no gate histórico de assets Sobre. Ver
[validação](validation.md) para evidências/limites. A7 foi executado com verificações de navegador/bundle e limites registrados.
A preferência nativa do sistema por reduced motion não foi alterada; testes
unitários cobrem preferência inicial/runtime. Não afirmar CLS medido ou
aprovação dos gates históricos.


## Entrega autorizada — 2026-10-12

O usuário autorizou commit, push da branch e abertura de PR para staging.
Essa autorização substitui a restrição anterior de sem commit, mantendo
históricos de validação anteriores. Publicação autorizada; número/URL do PR
serão registrados após sua criação. Nenhum merge foi autorizado por esse registro.
