# Design do dashboard superadmin

## Marca e header — shadcn, 2026-11-04

Substituir a marca textual da sidebar pela imagem transparente `logo-civix.png`,
também utilizada no header da landing page. No tema escuro, utilizar a variante
existente `logo-civix-white.png`, preservando o contraste sem adicionar fundo.
Na sidebar, manter apenas o item `Empresas` para o módulo empresarial (ativo em
`/dashboard/super-admin/companies` e sub-rotas como `/companies/new` e
`/companies/:companyId`), removendo o atalho separado `Cadastrar empresa` do
menu lateral e mantendo a rota `/dashboard/super-admin/companies/new` acessível
pelo botão `Cadastrar empresa` na página de empresas.

O header utiliza Button e Avatar shadcn, com menu de usuário adaptado do bloco
`@shadcn-space/dropdown-menu-01`. Manter nome, papel, acesso a Meu perfil,
saída e troca de tema existentes. O portal do dropdown permanece dentro do
header para herdar os tokens do dashboard nos dois temas. Componentes adicionados
usam Base UI e o utilitário `cn` já instalado; sem novas dependências.

Verificação: três testes de interação (perfil/saída, teclado/Escape/foco e
callbacks de tema/menu mobile), revisão secundária e Chrome em 1440/390/320px
nos dois temas. Menu sem transbordamento horizontal. Sem commit, na staging.

## Empresas — shadcn e Tailwind, 2026-11-04

Migrar somente a listagem de empresas para componentes shadcn e utilitários
Tailwind. Remover rótulo/título/subtítulo do conteúdo; o título fica no header.
Exibir total de empresas e quantidades por plano, com dados agregados de toda
a base (inclusive inativas/arquivadas), independentes dos filtros/paginação.
Manter três cards: total, “Empresas por plano” com barras horizontais, rótulos
e quantidades, e “Empresas ativas” com quantidade, percentual da base e resumo
de inativas e arquivadas. Larguras proporcionais à maior quantidade do grupo;
zero não preenche as barras. Todos os cálculos permanecem no frontend. Empresa
ativa não possui `deleted_at` e tem status `ativo` ou o legado `verificado`;
inativa tem status `inativo` sem `deleted_at`; arquivada possui `deleted_at`.
Cards compactos: espaçamento interno reduzido e cada plano apresentado em uma
linha com nome, barra horizontal e quantidade, preservando as informações.
No card de barras, exibir somente nomes sem a palavra “Plano”, ignorando caixa;
os nomes demonstrativos com “Plano” e o grupo “Sem plano” ficam ocultos. Aplicar
essa regra de apresentação no frontend, sem excluir cadastros nem alterar o
total geral. Nos dados atuais são três planos visíveis. Os três cards usam a
mesma largura e altura, com a largura compacta dos cards originais. Manter
`16px` entre cada card e também entre o último card e o botão de cadastro, sem
coluna vazia intermediária.
Planos visíveis sem empresas podem apresentar zero. Não confundir erro com zero.
Cadastro e ações passam a usar Button; ação de consulta usa ícone com nome
acessível. Paginação própria da tela reutiliza Button shadcn e mantém page/meta,
sem alterar os consumidores atuais da paginação compartilhada.
“Cadastrar empresa” fica no topo do conteúdo, antes dos cards, em linha flex
com justify-between e botão alinhado à direita.
Preservar filtros, rotas, carregamento, erros, navegação e temas claro/escuro.
O frontend utiliza somente as rotas existentes de listagem de empresas e planos.
Reúne as páginas da listagem administrativa (até 100 registros por requisição),
calcula total com array.length e quantidades por plano com filter().length.
Não utiliza /companies/metrics nem cria agregação no backend. As contagens não
se limitam à página visível. Falha em qualquer página mantém erro, sem exibir
um total parcial. Esta escolha carrega os registros para contagem no navegador.

Implementação na staging, sem commit por orientação do usuário. Componentes
Card/Table/Input/Badge/Select do registry shadcn (base-nova), adaptando
somente cn para @/lib/utils existente. Button já estava instalado; sem alteração
de manifest/lockfile. CompanyFilters, CompanyMetricsCards, CompanyTable e
CompanyPagination usam Tailwind e preservam a paginação das outras telas.
Filtros de estado e plano utilizam Select shadcn com nomes acessíveis e
mantêm os mesmos valores enviados no formulário. O portal permanece dentro
do escopo visual do dashboard para respeitar o tema claro/escuro.
A consulta agregada inicialmente adicionada foi removida por orientação do
usuário; backend e guia de API restaurados ao estado anterior desta tarefa.
Correção verificada: 14 testes direcionados (11 da tela e 3 do cálculo) e lint
aprovados; cobertura de 101 empresas em duas páginas, base vazia e falha durante
a paginação. Revisão secundária sem bloqueadores, sem chamada à rota removida.
Selects e cards compactos verificados em Chrome com API simulada em
1440/390/320px, nos dois temas, incluindo envio dos filtros, Escape e menus
dentro da viewport; capturas inspecionadas. Select oficial adicionado sem novas
dependências, mantendo o utilitário cn existente e portal no tema do dashboard.
O typecheck completo possui o impedimento anterior TS1484 em
CookieOptions, no backend incluído pelo tsconfig frontend.

Requisitos visuais confirmados em 2026-11-02. Complementa a [spec](spec.md).
Design implementado; evidências e limites de verificação estão no task backend.

## Identidade visual e referências

Manter o estilo do site Civix: branco/marfim, azul e amarelo/dourado,
tipografia e componentes existentes. Referência principal de cores:
[frontend/src/index.css](../../../src/index.css), variáveis civix-navy,
civix-gold, civix-gold-accessible, civix-ivory e civix-ink. Os estilos de
[SiteHeader](../../../src/components/layout/SiteHeader.tsx) mostram seu uso.
App.css possui outras variações locais; não montar uma terceira paleta para
o dashboard nem tratar todos os valores locais como tokens globais.

| Papel visual | Cor existente | Aplicação planejada |
| --- | --- | --- |
| Azul-marinho da marca | #07192A | Títulos, navegação e ações no claro; base dominante no escuro. |
| Amarelo/dourado | #D89C28 | Destaques e seleção, com texto azul-marinho quando usado como fundo. |
| Dourado para texto no claro | #9A6500 | Referência existente para texto de destaque; validar contraste no fundo efetivo. |
| Branco/marfim | Branco e #FAF9F6 | Fundo/superfícies claras e texto principal no tema escuro. |
| Texto escuro | #0E0E10 | Texto de leitura no tema claro. |

## Modo claro — padrão

O primeiro acesso ao dashboard deve abrir em modo claro. Utilizar fundo
branco/marfim, superfícies brancas e textos escuros, com azul-marinho em
cabeçalho, navegação, títulos e ações principais. Amarelo é cor de destaque,
sem preencher a interface inteira ou substituir a hierarquia das ações.
Preservar a linguagem visual do site em formulários, ícones, bordas e espaços.

## Modo escuro — azul como cor principal

O tema escuro deve ter base azul-marinho, mantendo identidade azul em vez
de apenas aplicar preto/cinza aos componentes. Conteúdo e navegação usam
superfícies em variações de azul distinguíveis do fundo; texto principal
branco/marfim e secundário claro com contraste suficiente. O amarelo continua
nos destaques. Botões, bordas, estados ativos e foco precisam de contraste
no fundo azul; não reutilizar um botão azul-escuro sobre fundo da mesma cor.

Valores de superfícies secundárias, bordas e hover devem ser derivados dos
tokens da marca e validados na revisão visual antes da implementação final.
O bloco .dark atual de index.css é uma base genérica: sua existência não
significa que o tema azul nem o seletor de tema já estejam implementados.

## Componentes, hierarquia e estados

Usar Urbanist Variable nos títulos e Inter Variable no conteúdo, conforme
as variáveis --font-display e --font-body do site. Não adicionar fontes ou
substituir a tipografia do site. Reutilizar controles e ícones disponíveis,
com hierarquia clara de título, descrição, filtros, conteúdo e ação principal.

Aplicar ambos os temas ao shell, menu, tabelas, formulários, diálogos,
confirmações, mensagens, paginação e estados loading/vazio/erro. Sidebar
ativa deve ter indicação visual além da cor. Textos, ícones e rótulos devem
distinguir sucesso, alerta e erro; o amarelo da marca não significa erro.
Interfaces responsivas devem continuar utilizáveis em telas pequenas, com
rolagem de tabela quando necessária e sem esconder ações essenciais.

## Alternância e escopo

Disponibilizar controle acessível e identificado para alternar claro/escuro
no layout administrativo. Não depender apenas de ícone sem nome acessível.
Modo claro é o padrão, independentemente do tema do sistema no primeiro uso.
Preferência claro/escuro deve ser lembrada neste navegador, conforme decisão
do usuário em 2026-11-02. Usar armazenamento local de preferência, sem API,
coluna de usuário ou cookie; primeiro uso permanece claro.

Escopar o tema ao dashboard e aos seus diálogos/portais. Evitar mudar a
aparência do site público ao visitar a área administrativa ou sair dela.
Mapear tokens semânticos existentes de background, foreground, primary,
accent, border e sidebar; revisar estilos globais de body/html e portais
para não depender de cores fixas que só funcionem em um dos modos.

## Localização planejada do código

O layout raiz usa sidebar e header compartilhados, conforme a [spec](spec.md).
Sidebar/header, drawer móvel e a tela de perfil seguem os mesmos tokens dos
temas claro/escuro; nome e e-mail continuam legíveis nos dois modos. O header
exibe identificação atualizada após edição persistida, sem duplicar estado de
identidade por página. Layout não redesenha a navegação do site público.

- frontend/src/index.css: mapear tokens de tema e variantes escopadas ao
  dashboard, preservando os tokens de marca e o site público.
- frontend/src/components/dashboard-super-admin/layout/SuperAdminLayout.tsx: aplicar contexto
  visual e renderizar o controle de tema.
- frontend/src/components/dashboard-super-admin/ThemeToggle.tsx: controle de alternância
  se extração for necessária, sem instalar biblioteca apenas para isso.
- frontend/src/pages/dashboard-super-admin/*.tsx e components/dashboard-super-admin/*.tsx:
  consumir tokens semânticos, sem duplicar paletas por tela.

## Aceite visual

- Primeiro acesso em claro; alternância aplica tema completo sem perder
  formulário, foco ou contexto da navegação.
- Claro segue branco/azul/amarelo do site; escuro usa base azul-marinho.
- Texto, foco e ações continuam legíveis nos dois modos; validar contraste
  mínimo de 4,5:1 para texto normal e 3:1 para texto grande e elementos
  essenciais de interface. As cores listadas não dispensam a verificação.
- Conferir teclado, controle de tema, contraste, estados desabilitados,
  dialogs/portais, tabelas e telas pequenas em ambos os temas.
- Revisar visualmente antes de commit; nenhuma verificação visual ou de
  contraste foi executada nesta tarefa exclusivamente documental.
