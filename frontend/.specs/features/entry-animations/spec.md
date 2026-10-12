# Animações de entrada — spec

**Status:** planejamento atualizado; requisitos da navbar aprovados para
execução futura. Nesta etapa, somente documentação.
Instalação e implementação aguardam leitura do plano e autorização posterior.
**Data:** 2026-10-12.

## Objetivo e escopo

Dar orientação visual à leitura do site com entradas curtas e consistentes,
após adaptar os consumidores aos contratos backend. Esta etapa entrega somente
[o mapa por página/componente](design.md), incluindo
rotas, seções, estados de API e comparação de bibliotecas.

Implementação futura não cria dashboard, endpoints, cadastro público, pagamentos
ou mudanças na composição de conteúdo, exceto ajustes necessários da navbar
fixa e sua unificação após autorização de execução. About continua seção da Home; divergências históricas
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

## Navbar: requisitos aprovados para execução futura

Nenhuma navbar ou animação será implementada nesta etapa. O usuário lerá
primeiro o plano atualizado; instalação de biblioteca e execução dependem
de autorização posterior.

- Navbar fixa no topo durante rolagem, com espaço reservado de 106 px.
- Fundo claro após scroll, coerente com a interface atual.
- Item ativo conforme a seção visível em desktop e mobile.
- Compensar a altura da navbar ao navegar por âncoras.
- Manter a navbar abaixo do modal na ordem de sobreposição.
- Unificar a navbar das páginas públicas, incluindo ajuda, termos,
  privacidade e 404; preservar login e formulários de acesso.
- Empresas aponta para /#empresas; Planos para /#planos. O catálogo permanece
  acessível pelo botão Ver todas. Essa navegação é um requisito futuro,
  sem criar a rota /planos.
- Preservar Contato exatamente como está: /#contato. Não criar bloco/ID
  nem alterar o destino. A âncora atualmente não existe; registrar esse
  limite sem resolver incidentalmente.

Verificar rolagem, espaço reservado, seção ativa, compensação de âncoras,
sobreposição do modal e navegação desktop/mobile após execução autorizada.
AD-002 continua vigente para outras divergências de Home/Sobre.

## Biblioteca e execução posteriores

Motion for React permanece uma proposta. Não instalar nem implementar
nesta etapa, inclusive o núcleo SiteHeader. A leitura do plano atualizado
precede qualquer autorização futura de execução. As decisões de abrangência
pública, Empresas/Planos e preservação de Contato acima já foram confirmadas.

## Evidência desta entrega

Inventário por leitura de fonte/configuração e referências oficiais consultadas.
Sem implementação de animação, instalação, testes visuais ou medição de runtime.
Ver [tarefas](tasks.md) para separar entrega documental de execução futura.
