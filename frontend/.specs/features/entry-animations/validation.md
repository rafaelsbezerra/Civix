# Validação das animações e navbar

Estado: implementação e verificações executadas no escopo público, com
limitações explícitas. Worktree frontend-entry-animations; branch
codex/frontend-entry-animations, base staging da92a07. A verificação descrita
foi executada antes da autorização posterior de commit/push/PR.

## Escopo e preservação

Motion 14.1.0 instalado e fixado no manifest/lockfile. Entradas nas páginas
públicas e navbar fixa/unificada, âncoras Empresas/Planos, menu/modal e reduced
motion implementados. Contato preservado em /#contato sem criar bloco/ID.

Login.tsx, FirstAccess.tsx, ForgotPassword.tsx e ResetPassword.tsx não possuem
diff. Motor desabilitado em todas as rotas de acesso; navbar ausente nesses
destinos. A5 fora do escopo, não concluído. Backend e AGENTS intactos.

A revisão automática rejeitou uma tentativa de alterar somente animações
dos formulários de acesso por interpretar a restrição como preservação das
telas de login/acesso. O script rejeitado não foi executado. A alternativa
aplicada preserva todos esses formulários e segue apenas no escopo público;
não houve nova solicitação de instalação/implementação já autorizada.

## Verificações automatizadas

- Rodada final: 57/57 testes direcionados aprovados em sete arquivos.
  Inclui quatro testes de PublicSmoothScroll adicionados após a suíte completa.
- Suíte completa anterior a esses quatro testes: 97 testes; 86 aprovados,
  11 falhas históricas em sete arquivos. Não declarar suíte completa verde.
- Lint final, TypeScript e Vite aprovados.
- Build completo falha no gate histórico de assets Sobre: dashboard.png.
  AD-002 permanece; não restaurar assets/layouts por causa desta feature.

Testes direcionados incluem fallback de APIs ausentes/falha visual, reduced
motion inicial/runtime, preservação de opacity/translate/transform, foco
imediato, remoção/cleanup, dados tardios, hash sem reiniciar entradas,
conteúdo inert e compensação de âncoras entre rotas.

## Verificações no navegador

CUA no frontend real confirmou:

- 320, 390, 768, 1024 e 1728 px: navbar no topo (headerTop=0) e nenhum
  overflow horizontal. Capturas animations-{largura}.png e
  animations-mobile-menu.png foram registradas fora do repositório.
- Modal: foco inicial no botão fechar; Tab chegou à escolha empresa;
  Escape fecha. Body overflow hidden e wheel mantém scrollY=0 enquanto aberto.
- Sobre/Empresas/Planos/FAQ: destino a 130 px do topo e item ativo
  aria-current=location correto. Menu mobile abre, mostra ativo e fecha no link.
- Ajuda → /#empresas revelou um bug de compensação inicial. PublicSmoothScroll
  passou a reagir ao pathname com scrollIntoView instant em rAF; repetição
  confirmou posição de 130 px. Revisor aprovou a correção.
- API atrasada 750 ms: catálogo mostra carregamento e depois dois cards.
  Perfil abre com Empresas ativa; nenhum conteúdo visível tinha opacity=0.
- API indisponível: alerta “Não foi possível conectar à API. Tente novamente.”
  apareceu com opacity=1.
- Termos/privacidade: um header por rota e body/texto com opacity=1.
  404 também possui um header; login não possui tags/motor/header da feature.
- Estilos inline de opacity/translate restaurados no estado final.
  Console sem warnings/erros antes do teste de API indisponível.

Viewport foi restaurado e abas/servidores temporários foram encerrados.

## Bundle comparado

Comparação com o mesmo Node e gzip, entre base e implementação; valores em bytes:

| Arquivo/grupo | Antes | Depois | Gzip antes | Gzip depois |
| --- | ---: | ---: | ---: | ---: |
| JavaScript inicial | 403277 | 412491 | 123550 | 126324 |
| Chunk lazy motion/mini | 0 | 8008 | 0 | 3160 |
| Todo JavaScript | 403277 | 420499 | 123550 | 129484 |
| CSS | 88217 | 89140 | 17702 | 17891 |

Aumento do JS inicial: 9214 bytes / 2774 gzip. Todo JS, incluindo lazy:
17222 / 5934 gzip. CSS: 923 / 189 gzip. Não tratar redução de carregamento
inicial por import lazy como ausência de custo total da dependência.

## Limitações registradas

A preferência nativa do sistema por reduced motion não foi alterada via CUA.
Os testes unitários cobrem preferência inicial e mudança runtime; não
equivalem a um teste nativo completo no navegador. O e2e histórico de About
não foi executado nesta feature. Não houve medição quantitativa de CLS/Core
Web Vitals: foram observados espaço reservado de 106 px e ausência de overflow.

A7 foi executado com esses limites registrados; gates/testes históricos
continuam falhando como descrito. Não declarar esses checks aprovados nem
transformá-los em autorização para restaurar os requisitos antigos.

Na fase de verificação registrada acima, não houve banco real, envio externo,
migration, alteração de dados locais, novo PR ou commit. Checkout principal
staging preservado. Esse histórico não representa a restrição vigente de entrega.


## Publicação autorizada — 2026-10-12

Após a verificação, o usuário autorizou commit, push e abertura de PR contra
staging. A restrição anterior de sem commit foi revogada para esta entrega.
Este documento registra autorização, sem afirmar publicação/PR já concluídos;
número e URL do PR serão adicionados após sua criação.
