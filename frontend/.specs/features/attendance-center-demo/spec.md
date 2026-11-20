# Central de Atendimento — demonstração frontend

## Objetivo

Criar uma demonstração visual e interativa da futura central de atendimento,
acessível pela rota pública `/demo/atendimento` e adequada ao deploy Preview
da branch. A demonstração deve funcionar sem login, serviços externos ou
persistência e identificar claramente que seus dados são fictícios.

## Limites de integração e autorização

- Todo conteúdo de cliente, conversa e mensagem é mock local, criado para esta
  apresentação. A interface não deve sugerir que os registros são reais.
- Não integrar WhatsApp, API de mensagens, WebSockets, backend ou banco de dados.
- Ações de assumir, devolver ao bot, finalizar e responder atualizam somente o
  estado React da demonstração.
- A rota `/demo/atendimento` é independente das rotas autenticadas
  `/dashboard-atendente` e `/dashboard-empresa`. Os guards, permissões e
  comportamentos atuais permanecem intactos.
- Não adicionar ou alterar contratos de backend nem modificar autenticação.
- O shell da demonstração usa navegação horizontal compacta e identidade Civix.
  Menus e páginas existentes do dashboard autenticado permanecem disponíveis.
- A integração real e a autorização multiempresa continuam fora desta entrega.

## Fluxos

1. Abrir `/demo/atendimento` diretamente e visualizar a identificação de
   demonstração.
2. Pesquisar por nome e filtrar conversas entre todas, pendentes, em
   atendimento e finalizadas.
3. Selecionar uma de pelo menos seis conversas e consultar seu histórico,
   dados básicos, status e indicador de atenção.
4. Assumir uma conversa do bot ou devolvê-la ao bot; atualizar o estado visual
   da conversa e registrar o evento no histórico local.
5. Finalizar uma conversa e oferecer reabertura local para permitir continuar
   a demonstração.
6. Enviar mensagem pelo botão ou Enter; Shift+Enter mantém nova linha. A
   mensagem aparece imediatamente no histórico selecionado e atualiza sua
   prévia/horário na lista.
7. Em viewport estreito, navegar entre a lista e a conversa com controle de
   retorno, mantendo pesquisa, filtros e ações utilizáveis.

## Requisitos visuais e técnicos

- Preservar a navegação e os recursos já existentes fora da rota de demo.
- Usar React, TypeScript, React Router, Tailwind e os tokens/assets disponíveis;
  não adicionar dependências.
- Usar nomes e conteúdo fictícios em português, históricos distintos e
  mensagens claramente identificadas como cliente, bot ou atendente.
- A lista diferencia selecionada, não lida, atenção prioritária e status.
- A composição mantém lista e conversa lado a lado no desktop; em telas
  estreitas apresenta esses painéis separadamente.
- A demo funciona após build de produção e no fallback de rota SPA já usado
  pela Vercel.
- Somente o push da branch independente pode solicitar um deploy Preview. A
  disponibilidade e URL do deploy precisam ser verificadas separadamente;
  não presumir que o build local comprova publicação externa.

## Critérios de aceite

- A rota pública abre sem credenciais e sem chamadas à API de atendimento.
- Existem pelo menos seis históricos fictícios diferentes.
- Pesquisa, filtros, seleção, leitura, resposta, atribuição ao atendente/bot,
  finalização e reabertura atualizam a UI local de forma coerente.
- Conversa finalizada impede o envio até ser reaberta.
- A área de atendimento é utilizável por mouse e teclado, com rótulos
  acessíveis nos controles.
- Layout desktop e tablet/mobile foram verificados no navegador.
- Build de produção, lint e testes direcionados foram executados; limitações
  de ambiente/deploy ficam registradas sem declarar sucesso não observado.
