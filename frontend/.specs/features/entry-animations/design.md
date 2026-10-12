# Plano de animações de entrada

**Estado:** plano autorizado para implementação, com Motion 14.1.0 fixado.
Código, instalação e verificação executados no escopo público; limites de
runtime/gates registrados em validation.md. Telas de acesso fora do escopo.
**Mapeamento:** 2026-10-12, sobre o frontend derivado do [PR #16](https://github.com/rafaelsbe/Civix/pull/16).
A integração de consumidores tem spec própria. O usuário autorizou agora
instalação e execução deste mapa; login e todos os formulários de acesso
permanecem excluídos integralmente.
Esse registro de autorização não comprova a feature entregue.

## Direção aprovada e inventário inicial

Sugerimos entradas curtas e discretas para orientar a leitura: primeiro o título,
depois o conteúdo e a ação. A intenção é transmitir clareza e confiança.
Não haverá bloqueio de navegação, de formulários ou de requisições para aguardar
animações. Preservar a composição de conteúdo, exceto ajustes necessários
da navbar fixa e sua unificação aprovadas. Não construir dashboard.

O site já tem transições de hover/menu, spinners e uma onda CSS no login.
O inventário inicial não tinha um sistema comum de entradas; a implementação
atual usa MotionRoot, descrito ao final deste mapa.
`lenis` e `tw-animate-css` já constam no
[manifest do frontend](../../../package.json). A instalação autorizada
acrescenta Motion 14.1.0; GSAP não será instalado.

O inventário abaixo distingue rotas de seções. A animação de cada seção só se
aplica onde o componente é realmente renderizado.

| Destino | Composição observada e fonte | Situação |
| --- | --- | --- |
| `/` | [Home](../../../src/pages/Home.tsx): modal de papel, header, hero/busca, About, empresas, planos, FAQ/CTA e footer | Página montada |
| `/#sobre` | [About](../../../src/pages/About.tsx), AboutVisual e AboutPrinciples | Seção da Home; `/sobre` não é rota própria |
| `/#empresas`, `/#planos`, `/#faq` | Cards de empresas, PlansSection e FAQ | Seções da Home |
| `/catalogo` | [Catálogo](../../../src/pages/CatalogoEmpresas.tsx): hero, busca, contador/filtros, resultados e footer | Página montada |
| `/empresa/:id` | [Perfil](../../../src/pages/PerfilEmpresa.tsx): hero, categoria, contatos/informações, apresentação detalhada, retorno e footer | Página montada; depende da API |
| `/planos` | [Plans](../../../src/pages/Plans.tsx): hero, cards e footer | Componente existente, sem rota registrada; esta integração não adiciona `/planos` |
| `/login` | [Login](../../../src/pages/login.tsx): papéis, formulário, logo e painel decorativo com AnimatedWave no desktop | Página montada; código preservado nesta integração por orientação do usuário |
| `/primeiro-acesso` e `/primeiro-acesso/:token` | [FirstAccess](../../../src/pages/FirstAccess.tsx): validação, formulário ou convite indisponível, sucesso | Mesmo componente; contratos de token tratados na integração |
| `/esqueci-senha` | [ForgotPassword](../../../src/pages/ForgotPassword.tsx): formulário e confirmação | Página montada |
| `/redefinir-senha` | [ResetPassword](../../../src/pages/ResetPassword.tsx): link inválido, formulário e sucesso | Página montada |
| `/termos-de-uso` | [TermsOfServices](../../../src/pages/TermsOfServices.tsx): navbar compartilhada, documento longo e footer existente | Página montada |
| `/politica-de-privacidade` | [PrivacityPolicy](../../../src/pages/PrivacityPolicy.tsx): navbar compartilhada, documento longo e footer existente | Página montada |
| `/central-de-ajuda` | [HelperCenter](../../../src/pages/HelperCenter.tsx): hero, categorias, artigos/accordion, suporte e footer próprio | Página montada; não implica existência de central de suporte no backend |
| `*` | [PageError](../../../src/pages/PageError.tsx): 404, ilustração, retorno e suporte | Fallback para destinos sem rota |

`FAQ.tsx` não possui rota própria: é seção da Home. `SearchFormEnterprise.tsx`
é um componente adicional sem uso nas páginas auditadas; não ganha animação
isolada. Referências a `dashboard.png` em teste/comentário não representam um
painel funcional. As divergências históricas de Home/Sobre seguem
[AD-002](../../STATE.md), sem autorizar retorno ao layout anterior.

## Presets do mapa

Presets do mapa autorizado; verificar comportamento real antes do aceite.

| Preset implementado | Uso | Propriedades e duração |
| --- | --- | --- |
| `page-enter` | Títulos e texto inicial | `opacity: 0 → valor CSS`, `translate: y CSS + 16 → y CSS px`, 420 ms |
| `section-enter` | Seção na primeira entrada na viewport | `opacity: 0 → valor CSS`, `translate: y CSS + 16 → y CSS px`, 320 ms |
| `item-enter` | Card/grupo dentro de seção | `opacity: 0 → valor CSS`, `translate: y CSS + 12 → y CSS px`, 280 ms |
| `feedback-enter` | Estado recebido da API | `opacity: 75% → valor CSS`, `translate: y CSS + 4 → y CSS px`, 180 ms, sem atraso |
| `panel-enter` | Menu/modal | `opacity: 0 → valor CSS`, `translate: y CSS + 8 → y CSS px`, 220 ms; fechamento sem aguardar saída |
| overlay | Fundo do modal | opacity: 0 → valor CSS, sem deslocamento, 140 ms |

Usar `cubic-bezier(0.2, 0, 0, 1)` nas entradas. Para saídas curtas, sugerimos
`cubic-bezier(0.3, 0, 1, 1)`. Sem bounce, overshoot, rotação de texto ou letras
animadas individualmente. A estrutura principal conduz a atenção, os cards/ações
acompanham e as decorações entram uma única vez em plano secundário.

- **Mount:** disparar quando o componente da página é montado.
- **Viewport:** disparar na primeira interseção de aproximadamente 15% do bloco;
  blocos muito altos usam um marcador no início. Não repetir ao subir a página.
- **Sequência:** 60 ms entre grupos; limite de atraso inicial total de 240 ms.
  O limite é por conjunto visível, nunca `índice global × delay` em lista longa.
- **Mobile:** usar deslocamento vertical de 8 px, sem entrada lateral ou scale;
  escalonar somente o primeiro grupo visível. Não atrasar botões independentes.
- **Interação:** feedback de hover/foco 100–150 ms; sempre conservar foco visível.
  Um controle focado durante a entrada aparece imediatamente no estado final.

## Mapa de aplicação

A tabela aplica os presets comuns reais: page 420 ms/16 px, section
320 ms/16 px, item 280 ms/12 px, feedback 180 ms/4 px, panel 220 ms/8 px e
overlay 140 ms/0 px. Nomes -enter correspondem aos atributos page/section/
item/feedback/panel no código; não há overrides de duração por alvo.
No mobile o deslocamento fica em até 8 px e stagger por grupo é removido.

Na coluna “ordem”, a seta descreve prioridade de leitura; componentes continuam
montados e utilizáveis durante a animação. Aplicar um wrapper sem substituir as
transforms de posicionamento, rotação ou hover já usadas no elemento.

| Local e alvo | Gatilho e ordem sugerida | Entrada e limites |
| --- | --- | --- |
| SiteHeader compartilhado: logo, navegação e ações | Mount: logo → grupo de navegação/ações | `item-enter`, navegação com 60 ms de atraso; não animar cada link nem repetir em re-render. Não ocultar o header inteiro enquanto a página espera dados |
| Menu móvel do SiteHeader | Abrir/fechar por interação | `panel-enter`; lista entra como um grupo. Escape e devolução de foco continuam imediatos; não animar altura da página |
| Home/HeroSection: título, parágrafo e CTAs | Mount: título → parágrafo → CTAs | `page-enter`, atrasos 0/60/120 ms. Fundo hero já visível; forma decorativa usa `item-enter`, sem loop/parallax |
| HeroSection/SearchForm | Mount, independente dos dados | `item-enter`, no máximo 120 ms de atraso. Animar o card como grupo, sem mover inputs individuais ou atrasar a possibilidade de pesquisar |
| Home/About: marcador, título e apresentação | Viewport: marcador/título → parágrafo | `section-enter`, 60 ms entre grupos; respeitar `#sobre` e leitura ao navegar diretamente para a âncora |
| AboutVisual: notebook, forma e rabisco | Viewport do próprio visual | Notebook `item-enter`; decoração acompanha sem loop. Preservar transforms/rotações e crop responsivo existentes |
| AboutPrinciples: Valor, Visão e Missão | Viewport de cada grupo | `item-enter` com 60 ms por item visível. Divisórias acompanham o artigo; não animar largura ou posição de layout |
| Home/CardEmpresas: cabeçalho e “Ver todas” | Viewport: cabeçalho e ação juntos | `section-enter`; título não depende da resposta da API |
| Home/CardEmpresas: até seis cards | API pronta + viewport de cada card | `item-enter`, 50 ms de intervalo, delay máximo 200 ms. Preservar ordem da API e usar o ID como identidade |
| Home/PlansSection: cabeçalho | Viewport | `section-enter`; apresentação estática entra sem esperar os planos |
| PlansSection/PlanCard: até três planos | API pronta + viewport | `item-enter`, 60 ms de intervalo. Destaque “Recomendado” entra com o card, sem pulsar preço/badge e sem animar todos os recursos separadamente |
| Home/FAQ: título e perguntas | Viewport: título → conjunto de perguntas | `section-enter`; entradas de perguntas `item-enter`, somente por grupo visível, sem uma cascata para toda a lista |
| FAQ e artigos da Central de ajuda: resposta | Abrir pergunta | Resposta 180 ms, `opacity` + `y=4`. Não animar altura inicialmente; preservar associação pergunta/resposta, estado expandido e foco no botão |
| Home/FAQ: banner CTA final | Viewport: título → ação | `section-enter`, ação com 60 ms. Imagem fica estática, sem zoom contínuo. A animação não implementa um contato ainda ausente |
| SiteFooter compartilhado | Viewport | Marca e colunas como grupos com `item-enter`, 40 ms entre grupos, máximo 160 ms. Links legais/contato ficam utilizáveis |
| Home/SignSelect: escolha de papel | Abrir, seguindo a condição existente de localStorage/cooldown | Overlay 140 ms de opacity; painel `panel-enter`, sem escalonar escolhas. Implantação exige semântica de dialog, foco inicial, contenção de foco e Escape; não prolongar permanência/cooldown |
| Catálogo: hero e formulário de busca | Mount: título → descrição; busca independente | Reutilizar `page-enter` e entrada de SearchForm, sem repetir hero a cada filtro |
| Catálogo: contador e filtros | Mount/viewport; atualizações da API | `section-enter` uma vez; novo total aparece imediatamente e recebe anúncio acessível sem animar dígitos |
| Catálogo: resultado por card | API pronta + viewport; nova busca confirma nova lista | `item-enter`, 40–50 ms por grupo visível, delay máximo 200 ms. Não executar animação de saída que deixe resultados antigos clicáveis durante uma nova busca |
| Perfil: nome, categoria, descritivo e contatos/informações | API pronta: nome → categoria/texto → grupo de contatos | `page-enter`, 60 ms entre grupos. Links e informações aparecem juntos; não repetir quando muda um campo ou estado de hover |
| Perfil: descrição detalhada e retorno ao catálogo | Viewport | `section-enter`; texto entra como um bloco e retorno fica disponível. Sem revelação linha a linha |
| Plans: título e apresentação | Mount, apenas se o registro da rota for aprovado em etapa posterior | Reutilizar `page-enter`; cards de todos os planos seguem os mesmos presets/estados da PlansSection |
| Login: tela completa e AnimatedWave existente | Excluído | Não adicionar animações, wrappers, navbar nem alterar login.tsx. Preservar integralmente a implementação atual |
| Primeiro acesso: página e todos os estados | Fora do escopo | FirstAccess.tsx intacto; sem nova animação, navbar, atributos ou alteração de fluxo |
| Recuperação e redefinição: páginas e todos os estados | Fora do escopo | ForgotPassword.tsx e ResetPassword.tsx intactos, sem nova animação/navbar ou mudança de fluxo |
| Central de ajuda: hero, quatro categorias, artigos e suporte | Hero no mount; blocos em viewport | `page-enter` no hero; categorias `item-enter` com 50 ms; artigos/suporte `section-enter`. Destinos de suporte continuam conforme implementação, sem inventar chat funcional |
| Termos e privacidade: navbar compartilhada e cabeçalho do documento | Mount | `item-enter` comum. Corpo legal, seções e footer visíveis imediatamente, sem cascata, bloqueio de leitura ou animação de seleção de texto |
| 404: título/mensagem, retorno, ilustração e suporte | Mount: texto/ações juntos → ilustração | `page-enter`; ilustração `item-enter` com 60 ms de atraso, preservando rotação. Suporte estático; sem loop ou contagem animada de “404” |
| Navegação entre páginas | Nova página entra no mount | Não aguardar saída da anterior. Navegação, scroll/foco e hash são controlados pelo router; mudança de hash não remonta animações nem apaga conteúdo |

## API, acessibilidade e desempenho

A resposta deve entrar quando os dados e o componente estiverem disponíveis.
A entrada não cria novas requisições e não muda validações do backend.

| Estado | Tratamento proposto |
| --- | --- |
| Carregando | Indicador e texto imediatamente presentes; `role=status`/`aria-busy` conforme região. Com reduced motion, spinner estático e texto mantido |
| Sucesso com dados | Animar apenas os itens reais, com IDs estáveis; não substituir resultados por mocks do frontend |
| Vazio | Mensagem e ação `feedback-enter`, sem atraso; não mostrar grade fantasma como resultado |
| Erro | `role=alert`, mensagem imediatamente legível, sem shake. Usar mensagem do contrato, sem renderizar stack/details em tela |
| Formulários de acesso | Fora do escopo: estados, foco, redirecionamento e componentes atuais ficam intactos |

`prefers-reduced-motion: reduce` desliga translate, scale, stagger, loops e scroll
suavizado; o conteúdo entra imediatamente, sem ocultação inicial. Detectar mudanças
da preferência durante a sessão. A opção é suportada pelo navegador via
[media query oficial](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).

Não usar `display:none`, `aria-hidden` ou `inert` para as entradas informativas.
Foco e links não podem alcançar conteúdo invisível: ao foco, aplicar o estado
final imediatamente. Dialogs exigem tratamento próprio de foco, sem depender
da biblioteca de animação. Conservar landmarks, heading e ordem DOM; a auditoria
histórica de `main`/`h1` em About não fica resolvida por adicionar um wrapper.

Priorizar opacity/transform, reservar dimensões de imagens/cards e evitar blur,
shadow e dimensões animadas. Limpar observers/efeitos no unmount e testar Strict
Mode. Conteúdo permanece visível se a biblioteca não carregar ou se um observer
não existir. Não aplicar `will-change` permanente em toda a grade.

[PublicSmoothScroll](../../../src/components/layout/PublicSmoothScroll.tsx)
mantém Lenis fora de /login e agora acompanha reduced motion, destruindo/
recriando sua instância conforme a preferência. Lenis cuida da
rolagem; não substitui a biblioteca de entradas. Usar o viewport normal para
revelações e não criar um segundo smooth scroll. A
[documentação do Lenis](https://github.com/darkroomengineering/lenis) descreve a
sincronização com ScrollTrigger caso GSAP seja escolhido futuramente; não adotar
esse segundo ticker junto ao `autoRaf` existente sem reconfiguração e cleanup.

## Biblioteca autorizada

**Motion for React, pacote `motion` 14.1.0, autorizado para instalação e uso.**
Combinar com CSS existente de hover/foco. Fixar a versão; não instalar GSAP.
A comparação abaixo permanece como registro das alternativas avaliadas.

| Opção | Quando usar no Civix | Consideração |
| --- | --- | --- |
| Motion for React | Entradas declarativas de páginas/seções, cards e estados React | APIs de viewport/entradas e controle de preferência; proposta principal |
| CSS + IntersectionObserver | Alternativa sem dependência nova para entradas simples | Requer manter o hook de observação, uma vez por item, cleanup e estados por conta do projeto |
| GSAP + `@gsap/react` | Alternativa se forem aprovadas sequências complexas, cenas SVG ou timelines de scroll | Exige integração/cleanup e tratamento do Lenis; recursos além do mapa simples proposto |

Motion oferece entradas por `whileInView` e a opção de executar uma única vez,
descritas no [guia de scroll](https://motion.dev/docs/react-scroll-animations).
O [hook useReducedMotion](https://motion.dev/docs/react-use-reduced-motion)
permite reagir à preferência do dispositivo. A documentação apresenta
[LazyMotion para modularizar o carregamento](https://motion.dev/docs/react-reduce-bundle-size);
medir o bundle real do Vite antes/depois, sem prometer tamanho nesta proposta.

GSAP dispõe de [timelines](https://gsap.com/docs/v3/GSAP/Timeline/) e do
[hook oficial para React](https://gsap.com/resources/React/) com cleanup.
A alternativa sem biblioteca pode usar a
[IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).
Fontes primárias consultadas em 2026-10-12; a autorização vigente escolheu Motion.

## Ordem de execução

1. Registrar a autorização vigente e instalar Motion 14.1.0 sem alterar login.
2. Definir presets reutilizáveis, fallback visível e reduced motion/Lenis.
3. Validar Home/hero, About, empresas e planos como primeiro conjunto.
4. Aplicar presets a catálogo, perfil e feedback público; telas de acesso excluídas.
5. Aplicar movimentos discretos a ajuda, documentos legais e 404.
6. Validar teclado, diálogos, animação com dados tardios, preferência alterada,
   navegação, Strict Mode, viewports e desempenho; atualizar esta documentação.

A [spec](spec.md) e suas
[tarefas](tasks.md) registram os
critérios e verificações. Código e testes direcionados estão implementados;
evidências de navegador, capturas e bundle estão em
[validation.md](validation.md). Não afirmar Core Web Vitals/CLS medidos ou
preferência nativa de movimento executada no navegador.

## Navbar: comportamento implementado

A navbar unificada deve atender Home, catálogo, perfil, ajuda, termos,
privacidade e 404. Login e formulários de acesso permanecem preservados.
Implementação e instalação realizadas nesta etapa. Login e formulários de
acesso são excluídos do motor e preservados integralmente.

| Requisito | Comportamento aprovado |
| --- | --- |
| Posicionamento | Fixa no topo durante scroll, com espaço de 106 px preservado |
| Aparência | Fundo claro após rolagem, coerente com a UI atual |
| Item ativo | Conforme seção visível em desktop e mobile |
| Âncoras | Compensar altura da navbar; Empresas /#empresas e Planos /#planos |
| Catálogo | Manter o botão Ver todas como acesso ao catálogo |
| Modal | Navbar fica abaixo do modal na sobreposição |
| Contato | Manter /#contato exatamente como está, sem novo bloco/ID ou alteração do destino |
| Páginas | Unificar públicas, incluindo ajuda/termos/privacidade/404; preservar login/formulários |

Limite atual preservado: não existe ID de seção contato correspondente a
/#contato. O plano não autoriza criar esse bloco ou corrigir o destino.
Não expor /planos como página independente; Planos navega para a seção da Home.
Motion 14.1.0 instalado; verificações e limites registrados em validation.md.


## Motor implementado

MotionRoot monta um contêiner sem caixa de layout (display: contents) e usa
atributos data-motion com presets page/section/item/feedback/panel/overlay.
motion/mini é importado dinamicamente; a entrada altera opacity e translate,
preservando transform/rotate existentes. Observação da viewport dispara uma
vez por elemento, com atraso limitado por grupo; MutationObserver incorpora
dados tardios e blocos que deixam de estar inert.

Sem biblioteca, IntersectionObserver, MutationObserver ou Web Animations
API, o conteúdo conserva sua visibilidade. Foco revela/cancela entradas
imediatamente; reduced motion e cleanup restauram os valores originais.
O motor não atua em nenhuma rota de acesso; os quatro componentes de
login/primeiro acesso/recuperação/redefinição estão integralmente intactos.

SignSelect mantém fluxo e cooldown, com dialog, contenção/devolução de foco,
Escape e conteúdo de fundo inert. Navbar fica abaixo desse modal.
Verificações e limitações ficam em [validation.md](validation.md).
