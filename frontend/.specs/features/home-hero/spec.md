# Hero da Home Civix — Especificação

## Problem Statement

O frontend ainda exibe o template inicial do Vite e não representa a identidade da Civix. A primeira entrega deve transformar o frame `90:1204` do Figma em uma hero responsiva, acessível e testável, sem depender de backend ou de conteúdo definitivo do produto.

## Goals

- [ ] Reproduzir a hero desktop do Figma com fidelidade visual no viewport de referência de `1728 × 1117 px`.
- [ ] Derivar comportamentos responsivos utilizáveis para desktop, tablet e mobile sem overflow horizontal.
- [ ] Entregar navegação e miniformulário semanticamente corretos, operáveis por teclado e sem integração externa.
- [ ] Estabelecer tokens, fontes e componentes reutilizáveis para as próximas seções da landing page.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Integração da pesquisa com API ou catálogo | Não existe backend nesta etapa. |
| Página de resultados, estados de loading ou falhas remotas | Dependem da integração futura. |
| Implementação das seções Sobre, Empresas, Planos e Contato | O frame recebido cobre somente header, hero e busca. |
| Navbar flutuante durante scroll | Existe como frame separado e não pertence ao frame `90:1204`. |
| Autenticação e rotas internas | Não aparecem no frame e não são necessárias para a hero. |
| Redação definitiva e validação das promessas comerciais | O texto do Figma é conteúdo visual provisório. |
| Variantes dark mode | O Figma define apenas a apresentação clara da página. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Marca e produto | Usar Civix como marca oficial e plataforma híbrida | Decisão explícita do usuário e coerência com o Figma | Sim |
| Fonte visual | Usar o frame `90:1204` e seu screenshot de `1728 × 1117 px` | É o frame específico fornecido pelo usuário | Sim |
| Responsividade | Derivar layouts para tablet e mobile a partir do desktop | Não existem variantes responsivas da hero no arquivo | Sim |
| Pesquisa | Manter os campos “O que busca?”, “Região” e “Faixa de preço” sem backend | O objetivo atual é desenvolver as telas | Sim |
| Conteúdo textual | Preservar o texto do Figma nesta entrega | O usuário pediu para não transformar a redação em regra de produto | Sim |
| Destinos da navegação | Usar âncoras locais `#home`, `#sobre`, `#empresas`, `#planos` e `#contato` | Mantém a semântica da landing page sem introduzir roteamento prematuro | Sim |
| Submissão da pesquisa | Impedir navegação e efeitos externos após o submit | Evita comportamento enganoso enquanto não existe backend | Sim |
| Breakpoints derivados | Mobile abaixo de `768 px`, tablet de `768 px` a `1023 px` e desktop a partir de `1024 px` | Alinha-se aos breakpoints do Tailwind e oferece transições previsíveis | Sim |

**Open questions: none** — todos os defaults foram confirmados com a aprovação da spec.

---

## User Stories

### P1: Hero fiel ao Figma ⭐ MVP

**User Story**: Como visitante da Civix, quero reconhecer imediatamente a marca e sua proposta para entender que estou na página correta.

**Why P1**: A hero é a primeira tela e estabelece toda a linguagem visual do site.

**Acceptance Criteria**:

1. The interface SHALL renderizar header, hero, dois CTAs e miniformulário na mesma ordem e hierarquia do frame `90:1204`. (`HOME-01`)
2. The interface SHALL usar os assets originais exportados do Figma para logo, ilustração principal, forma decorativa, seta e indicador do seletor. (`HOME-02`)
3. The interface SHALL aplicar os tokens `#07192A`, `#D89C28`, `#FAF9F6` e `#0E0E10` nos papéis visuais definidos pelo Figma. (`HOME-03`)
4. The interface SHALL usar Urbanist nos títulos e ações e Inter nos textos de apoio e navegação. (`HOME-04`)
5. WHEN a página for capturada em `1728 × 1117 px` THEN the interface SHALL manter os limites dos elementos-chave do Figma com tolerância máxima de `±2 px` para posição e tamanho. (`HOME-05`)

**Independent Test**: Abrir a home em `1728 × 1117 px`, comparar a captura com o screenshot do Figma e medir header, container da hero e formulário.

---

### P1: Navegação responsiva e acessível ⭐ MVP

**User Story**: Como visitante em qualquer dispositivo, quero navegar pela hero sem cortes, sobreposições indevidas ou dependência de mouse.

**Why P1**: A única referência é desktop; uma landing page pública precisa permanecer utilizável em telas menores.

**Acceptance Criteria**:

1. WHEN o viewport tiver largura inferior a `1024 px` THEN the interface SHALL substituir a lista visível de navegação por um botão de menu com estado acessível expandido ou recolhido. (`HOME-06`)
2. WHEN o viewport tiver largura inferior a `768 px` THEN the interface SHALL empilhar conteúdo, CTAs e campos de pesquisa sem overflow horizontal em larguras de `320 px` ou superiores. (`HOME-07`)
3. WHEN o viewport estiver entre `768 px` e `1023 px` THEN the interface SHALL reorganizar a hero e a busca preservando hierarquia, legibilidade e áreas interativas mínimas de `44 × 44 px`. (`HOME-08`)
4. WHEN uma âncora de navegação for acionada THEN the interface SHALL atualizar o fragmento local correspondente sem iniciar roteamento de aplicação. (`HOME-09`)
5. WHILE um elemento interativo estiver focado, the interface SHALL exibir um indicador de foco visível com contraste mínimo de `3:1` em relação ao entorno. (`HOME-10`)

**Independent Test**: Navegar apenas por teclado em viewports de `320`, `768`, `1024` e `1728 px`, verificando menu, âncoras, CTAs e ausência de overflow.

---

### P1: Miniformulário frontend ⭐ MVP

**User Story**: Como visitante, quero preencher os filtros apresentados para compreender como a pesquisa da Civix será utilizada.

**Why P1**: O formulário é o principal elemento funcional do frame, mesmo antes da integração com backend.

**Acceptance Criteria**:

1. The search form SHALL disponibilizar dois campos de texto rotulados “O que busca?” e “Região”, um seletor rotulado “Faixa de preço” e um botão “Pesquisar”. (`HOME-11`)
2. WHEN o formulário for enviado THEN the interface SHALL impedir recarregamento, navegação e requisições de rede. (`HOME-12`)
3. WHEN o usuário alterar qualquer campo THEN the interface SHALL manter o valor selecionado durante a sessão atual da página. (`HOME-13`)
4. IF um texto ultrapassar `100` caracteres THEN the interface SHALL impedir a inserção dos caracteres excedentes por meio do limite nativo do campo. (`HOME-14`)

**Independent Test**: Preencher os três campos, enviar o formulário e confirmar que valores, URL e contagem de requisições externas permanecem inalterados.

---

### P2: Fundamentos de acessibilidade e SEO

**User Story**: Como visitante ou mecanismo de busca, quero uma estrutura semântica clara para compreender e operar a página.

**Why P2**: A hero é pública e precisa formar uma base correta para as próximas seções.

**Acceptance Criteria**:

1. The page SHALL conter um único `h1`, landmarks `header`, `nav` e `main`, e nomes acessíveis para todos os controles. (`HOME-15`)
2. The page SHALL manter contraste de texto de pelo menos `4.5:1` e contraste de texto grande de pelo menos `3:1`. (`HOME-16`)
3. The page SHALL definir `lang="pt-BR"`, título “Civix” e uma meta description específica para a plataforma híbrida. (`HOME-17`)
4. The page SHALL marcar ilustrações puramente decorativas com texto alternativo vazio ou `aria-hidden="true"`. (`HOME-18`)

**Independent Test**: Inspecionar a árvore de acessibilidade, executar os testes semânticos e conferir os metadados no documento gerado.

---

## Edge Cases

- IF JavaScript estiver habilitado e o formulário for submetido repetidamente THEN the interface SHALL continuar sem efeitos externos ou duplicação de conteúdo.
- IF o viewport tiver `320 px` de largura THEN the interface SHALL preservar todo o conteúdo essencial dentro da área visível horizontalmente.
- IF as fontes ainda estiverem carregando THEN the interface SHALL usar fallbacks sans-serif sem ocultar o conteúdo.
- IF a preferência do sistema estiver em dark mode THEN the interface SHALL manter a paleta clara definida no Figma.
- WHEN o menu mobile estiver aberto e a tecla `Escape` for acionada THEN the interface SHALL fechar o menu e devolver foco ao botão de abertura.

### Implicit-requirement dimensions sweep

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | Campos de texto limitados a 100 caracteres; nenhum campo obrigatório nesta fase. |
| Failure / partial-failure states | N/A porque não há persistência nem chamadas remotas. |
| Idempotency / retry / duplicate handling | Submit é idempotente e não produz efeitos externos. |
| Auth boundaries & rate limits | N/A porque a hero é pública e não chama serviços. |
| Concurrency / ordering | N/A porque não existem operações assíncronas de domínio. |
| Data lifecycle / expiry | Valores vivem somente no estado da página e são descartados ao recarregar. |
| Observability | N/A porque não existe operação de negócio nesta feature. |
| External-dependency failure | Assets e fontes serão empacotados localmente; não haverá dependência externa em runtime. |
| State-transition integrity | Menu mobile alterna entre fechado e aberto; `Escape` e seleção de âncora retornam ao estado fechado. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| HOME-01 | P1: Hero fiel | Tasks | Implementing |
| HOME-02 | P1: Hero fiel | Tasks | Implementing |
| HOME-03 | P1: Hero fiel | Tasks | Implementing |
| HOME-04 | P1: Hero fiel | Tasks | Implementing |
| HOME-05 | P1: Hero fiel | Tasks | Implementing |
| HOME-06 | P1: Navegação responsiva | Tasks | Implementing |
| HOME-07 | P1: Navegação responsiva | Tasks | Implementing |
| HOME-08 | P1: Navegação responsiva | Tasks | Implementing |
| HOME-09 | P1: Navegação responsiva | Tasks | Implementing |
| HOME-10 | P1: Navegação responsiva | Tasks | Implementing |
| HOME-11 | P1: Miniformulário | Tasks | Implementing |
| HOME-12 | P1: Miniformulário | Tasks | Implementing |
| HOME-13 | P1: Miniformulário | Tasks | Implementing |
| HOME-14 | P1: Miniformulário | Tasks | Implementing |
| HOME-15 | P2: Acessibilidade e SEO | Tasks | Implementing |
| HOME-16 | P2: Acessibilidade e SEO | Tasks | Implementing |
| HOME-17 | P2: Acessibilidade e SEO | Tasks | Implementing |
| HOME-18 | P2: Acessibilidade e SEO | Tasks | Implementing |

**Coverage:** 18 requisitos, 18 mapeados para o design, 0 não mapeados.

---

## Success Criteria

- [ ] Captura desktop validada contra o screenshot do Figma no viewport de referência.
- [ ] Nenhum overflow horizontal nos viewports de `320`, `390`, `768`, `1024` e `1728 px`.
- [ ] Todos os controles utilizáveis por teclado e identificáveis por nome acessível.
- [ ] Formulário mantém estado local e não produz requisições ou navegação.
- [ ] `npm run test`, `npm run lint` e `npm run build` passam.
