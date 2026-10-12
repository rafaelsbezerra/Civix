# Transição para o perfil de empresa

Data: 2026-10-12. Implementação autorizada na staging, sem commit/push.

## Escopo aprovado

Cliques nos cards da Home e do catálogo abrem /empresa/:id com uma cortina
azul seguida da revelação do hero. Usar Motion 14.1.0 já instalado.
Não criar rotas, dependências, alterações no backend ou nas telas de acesso.

## Comportamento

- Navegar e buscar dados imediatamente; a cortina não aguarda a API.
- Cortina abaixo dos 106 px da navbar, sem capturar cliques ou foco.
- Cobrir de baixo para cima e sair pelo topo em 640 ms, com detalhe dourado.
- Hero entra com opacity/deslocamento de 24 px e duração de 420 ms;
  nome, textos, contatos e informações aparecem em sequência curta.
- Evitar animar o mesmo elemento simultaneamente por MotionRoot e motion/react.
- Loading/erro permanecem disponíveis; a cortina termina mesmo sem dados.
- Navegações rápidas substituem a cortina anterior; respostas antigas não
  devem substituir a empresa atual.
- Voltar/Avançar e acesso direto não reproduzem a cortina de um clique antigo.
- Reduced motion elimina cortina/deslocamento/atrasos, inclusive se a
  preferência mudar durante a sessão.
- Preservar PublicSmoothScroll e suas regras de topo/âncoras/histórico.

## Verificação

Testar clique/PUSH, histórico/POP, mudança de preferência, término e
substituição da cortina, API pendente/sucesso/erro e resposta fora de ordem.
Conferir TypeScript, lint direcionado e Vite. Verificar Home e catálogo no
navegador local, topo do perfil, navbar e ausência de cortina residual.
Resultados e limites serão registrados em validation.md.
