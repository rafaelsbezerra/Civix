# Produto e requisitos

## Entendimento consolidado

Civix combina descoberta de empresas da construção civil com um SaaS de
atendimento e automação comercial. O visitante consulta empresas e inicia
contato; a empresa recebe atendimento inicial automatizado, leads
qualificados e contexto para continuidade humana. O produto também prevê
gestão de equipes, conversas, funil, vendas e métricas.

O Notion ainda usa UrbanSync. O
[contexto local da Home](../frontend/.specs/features/home-hero/context.md)
registra a renomeação para Civix e o posicionamento híbrido; a
[decisão AD-001](../frontend/.specs/STATE.md) confirma esse posicionamento.
Não há implementação completa do SaaS apenas por existirem páginas públicas.

## Atores e canais previstos

- Superadministrador da plataforma.
- Administrador e vendedores/atendentes de cada empresa.
- Clientes/leads.
- Sistemas externos.

Entradas: site institucional, WhatsApp da empresa e site da empresa.
O código usa apenas os papéis `empresa` e `cliente`; eles não equivalem
automaticamente à matriz de permissões prevista.

## Casos de uso do Notion

| Caso | Comportamento previsto | Estado no repositório |
| --- | --- | --- |
| 001 Iniciar atendimento | Identificar empresa/canal, criar conversa, encaminhar a IA ou humano | Ausente |
| 002 Assumir atendimento | Vendedor seleciona e recebe a conversa | Ausente |
| 003 Encerrar atendimento | Atualizar conversa e lead, preservar histórico | Ausente |
| 004 Consultar histórico | Exibir mensagens, datas, cliente e lead | Ausente |
| 005 Gerenciar leads | Consultar e alterar estágio, registrar mudança | Ausente |
| 006 Registrar resultado | Apenas título na fonte | Sem definição |
| 007 Priorizar conversa | Apenas título na fonte | Sem definição |
| 008 Reabrir atendimento | Apenas título na fonte | Sem definição |

## Requisitos previstos

Funcionais: permissões por perfil; alteração e ativação/desativação de
empresas; transferência entre IA e vendedor; cadastro e gestão de leads;
funil; cadastro de vendedores; alteração de usuários e permissões;
histórico de conversas.

Não funcionais: isolamento integral dos dados e do contexto de IA por
empresa; sessões com expiração configurável; processamento de mensagens
sem bloquear requisições; infraestrutura compartilhada entre empresas;
disponibilidade contínua, exceto manutenção; backups periódicos.
Não existem metas quantitativas de latência, disponibilidade, RPO/RTO ou
capacidade definidas na fonte.

Regras: transferências apenas dentro da empresa; conversa encerrada não
recebe mensagens sem reabertura; transferência registra responsável e
data/hora; baixa confiança ou limite de tentativas da IA oferece humano.
Venda automática ao criar empresa é uma proposta ainda em discussão.

## Telas e identidade

Previstos: dashboard da plataforma (home, usuários, empresas, vendas,
configurações), dashboard do administrador da empresa e do atendente.
Os dois últimos não possuem detalhamento no Notion.
Site público: Home, catálogo, perfil de empresa, Sobre, planos, FAQ,
CTA e rodapé. Há páginas e componentes públicos, mas algumas rotas faltam.

Paleta documental: dourado `#D89C28`, azul `#07192A`, branco `#FAF9F6`,
preto `#0E0E10`. As specs locais usam Urbanist e Inter e registram dourado
acessível `#9A6500` na tela Sobre. Referências Figma são evidências
históricas das specs; o arquivo Figma não foi revisado nesta fase.

Os cards de planos compartilham os cantos arredondados (rounded-2xl) dos
cards de empresas, mantendo as variantes comum e recomendada. O nome do
plano recomendado usa o branco da identidade para contrastar com o fundo azul.

## Escopo ainda aberto

O Notion descarta cadastro de serviços, mas admite até três
produtos/projetos/imóveis por empresa como possibilidade. É necessário
definir essa fronteira. Limite inicial de um atendente, trial de sete dias,
integração com sistemas existentes, qualificação do lead, cache e capacidade
do banco também não têm definição executável completa.
