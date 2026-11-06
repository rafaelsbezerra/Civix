# Design do dashboard superadmin

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
