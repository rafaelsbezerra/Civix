# Validação da transição para empresa

Data: 2026-10-12. Staging local; sem commit/push/PR nesta entrega.

## Implementação

- CompanyPageTransition fica fora de Routes e não depende da resposta da API.
- Home/catalogo acrescentam marcador com timestamp no state do clique.
- Cortina keyed por location.key, com duração 640 ms, termina por callback.
- Navbar mantém espaço/posição e não recebe entrada de MotionRoot no perfil.
- Hero/itens usam motion/react; atributos antigos do motor foram removidos.
- Preferência é acompanhada por useSyncExternalStore. Ativar redução consome
  a cortina sem permitir replay e troca o hero para keyframes finais imediatos,
  interrompendo inclusive uma animação em curso.
- Fetch inicia imediatamente e ignora respostas obsoletas por cleanup do efeito.
- PublicSmoothScroll, backend, login, configurações e dados não foram alterados.

## Verificações

48/48 testes direcionados: CompanyPageTransition (9), PerfilEmpresa (8),
MotionRoot e PublicSmoothScroll. Os 17 testes novos foram repetidos após
ajuste de sintaxe do harness; 17/17 passaram. TypeScript e ESLint dos arquivos
alterados/novos passaram. Diff sem erros de whitespace.

Cobertura: PUSH marcado/não marcado, POP/REPLACE/acesso direto/tela de acesso,
conclusão e navegação rápida/callback antigo, redução inicial/runtime sem
replay, ausência de matchMedia, API pendente/sucesso/erro, resposta fora de
ordem e ausência de novo atraso quando os dados chegam tarde.
O mock de Motion controla conclusão e configurações, sem provar timing visual.

No navegador local, cliques na Home abriram Horizonte e Traço Vivo no topo.
No catálogo, Base Forte abriu com scrollY=0, cortina cobrindo a viewport a
partir de y=106 e navbar em y=0. Após a animação, cortina ausente e hero com
opacity=1/transform=none. Voltar/Avançar não repetiu a cortina.
Capturas da cortina e do perfil revelado foram salvas fora do repositório.

Os servidores previamente abertos foram encerrados durante a inspeção.
Foram iniciados processos temporários para a verificação final: frontend
local e backend com USE_MOCK_DATA=true, apenas GETs dos dados de demonstração.
Não foi acessado banco real nem alterado .env/JSON. Os processos criados para
verificação foram encerrados após a inspeção.

## Limites

A preferência nativa do sistema não foi modificada; redução inicial/runtime
foi verificada por testes e revisão do código da biblioteca instalada.
API lenta/erro/resposta fora de ordem foi simulada nos testes, sem artificializar
a rede do navegador. Não afirmar medição de CLS, FPS ou tempos em todos os
viewports. O efeito não cria restauração própria de histórico.

Vite gera o bundle, com aviso de chunk principal acima de 500 kB após adotar
motion/react. O motor mini continua em chunk separado. Build completo com
gate histórico de assets Sobre e suíte histórica global não foram repetidos;
não declarar aprovação desses gates. Nenhuma dependência foi instalada.
