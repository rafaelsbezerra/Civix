# Animações de entrada — spec

**Status:** mapeamento concluído; execução e biblioteca **Aguardando resposta**.
**Data:** 2026-10-12.

## Objetivo e escopo

Dar orientação visual à leitura do site com entradas curtas e consistentes,
após adaptar os consumidores aos contratos backend. Esta etapa entrega somente
[o mapa por página/componente](../../../../docs/plano-animacoes.md), incluindo
rotas, seções, estados de API e comparação de bibliotecas.

Implementação futura não cria dashboard, endpoints, cadastro público, pagamentos
ou alterações de layout. About continua seção da Home; divergências históricas
seguem [AD-002](../../STATE.md). A página Plans não possui rota registrada; esta integração não cria a rota.
Só animar essa página após uma autorização posterior para expô-la. Login
permanece intocado nesta integração; seu movimento é apenas proposta futura.
Não animar os componentes que não estão montados.

## Requisitos propostos para aprovação

| ID | Critério verificável |
| --- | --- |
| ANIM-01 | Cada destino da tabela do mapa tem tratamento explícito de mount, viewport ou conteúdo imediatamente estático |
| ANIM-02 | Entradas usam presets comuns, opacity/transform e stagger limitado por grupo visível, sem ocultar elementos indefinidamente |
| ANIM-03 | Reduced motion elimina deslocamento, escala, atraso, loops e Lenis; a mudança da preferência funciona durante a sessão |
| ANIM-04 | Requisições, mensagens de erro/sucesso, submissão e navegação não aguardam animações; carregamento, vazio e erro permanecem legíveis |
| ANIM-05 | IDs da API preservam identidade; resultados tardios entram e listas grandes não acumulam delays globais ou repetição ao scroll |
| ANIM-06 | Teclado, foco, âncoras, menu e dialog continuam utilizáveis; foco em entrada revela o controle imediatamente |
| ANIM-07 | Animações não substituem transforms existentes, não acrescentam overflow/CLS, e efeitos/observers são limpos no unmount/Strict Mode |
| ANIM-08 | Medir bundle e comportamento nos viewports 320/390/768/1024/1728 px e com backend lento/indisponível antes de declarar execução concluída |

## Decisões pendentes

- **Aguardando resposta:** aprovar Motion for React (`motion`) + CSS ou escolher
  CSS/IntersectionObserver ou GSAP. Não instalar até a confirmação.
- **Aguardando resposta:** aprovar a direção discreta, os presets, os locais e
  a ordem do mapa. Não tratar os tempos sugeridos como contratos já aprovados.
- **Aguardando resposta:** autorizar execução das animações após a revisão do
  mapa. Adaptação dos contratos backend permanece uma tarefa separada.

## Evidência desta entrega

Inventário por leitura de fonte/configuração e referências oficiais consultadas.
Sem implementação de animação, instalação, testes visuais ou medição de runtime.
Ver [tarefas](tasks.md) para separar entrega documental de execução futura.
