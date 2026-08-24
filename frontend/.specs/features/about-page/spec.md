# Tela Sobre Civix — Especificação

## Problem Statement

A navegação já aponta para `/sobre`, mas a rota ainda não existe. A segunda tela deve traduzir o frame `103:1987` do Figma em uma página institucional responsiva, acessível e independente de backend, preservando a mensagem, a composição visual e os assets originais da Civix.

## Goals

- [ ] Reproduzir o frame desktop de `1728 × 760 px` com fidelidade visual.
- [ ] Expor a tela em `/sobre` sem quebrar as rotas existentes.
- [ ] Derivar layouts utilizáveis para tablet e mobile sem overflow horizontal.
- [ ] Manter conteúdo, fontes e assets disponíveis localmente, sem dependências temporárias em runtime.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Backend, CMS ou edição do conteúdo institucional | A entrega cobre somente a interface. |
| Header e footer adicionais | Não aparecem no frame `103:1987`; adicioná-los alteraria a geometria de referência. |
| Animações ou parallax | O Figma não define movimento para esta tela. |
| Alteração da redação do Figma | O conteúdo fornecido é a fonte visual aprovada. |
| Redesign das demais páginas e rotas | Não pertence à tela Sobre. |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Fonte visual | Usar o frame `103:1987` do arquivo Civix Design | É o node específico fornecido pelo usuário | Sim |
| Destino | Registrar uma página pública em `/sobre` | O header existente já usa esse destino e a branch é `feature/about-page` | Sim |
| Chrome global | Não adicionar header ou footer dentro da tela | Esses elementos não aparecem no frame e prejudicariam a fidelidade 1:1 | Sim |
| Responsividade | Derivar empilhamento para tablet e mobile | O arquivo fornece somente o frame desktop e o usuário já aprovou responsividade derivada | Sim |
| Breakpoints | Mobile abaixo de `768 px`, tablet de `768 px` a `1023 px`, desktop a partir de `1024 px` | Reutiliza os breakpoints Tailwind do projeto | Sim |
| Conteúdo | Preservar a redação e a ordem Valor, Visão e Missão | São parte central da hierarquia do frame | Sim |
| Assets | Versionar os seis exports originais no repositório | URLs do MCP expiram e não podem ser dependência de produção | Sim |
| Estado e integrações | Página totalmente estática | Não há controles, persistência ou chamadas remotas no frame | Sim |

**Open questions: none** — os defaults seguem o Figma e as decisões já aprovadas para o projeto.

---

## User Stories

### P1: Apresentação institucional fiel ao Figma ⭐ MVP

**User Story**: Como visitante da Civix, quero entender a proposta, a missão, a visão e o valor da empresa para reconhecer seu posicionamento.

**Why P1**: A tela Sobre comunica a identidade institucional e é o destino já previsto na navegação principal.

**Acceptance Criteria**:

1. WHEN o visitante acessar `/sobre` THEN the interface SHALL renderizar a tela Sobre sem redirecionamento. (`ABT-01`)
2. The interface SHALL renderizar um único `h1` com o texto “Transformamos atendimento em oportunidades.”. (`ABT-02`)
3. The interface SHALL renderizar o marcador “// Sobre nós” e o parágrafo institucional exatamente como definidos no frame. (`ABT-03`)
4. The interface SHALL renderizar Valor, Visão e Missão nessa ordem, cada um com sua descrição correspondente. (`ABT-04`)
5. The interface SHALL usar Urbanist para marcador, título e nomes dos princípios, e Inter para os textos de apoio. (`ABT-05`)
6. The interface SHALL aplicar `#07192A`, `#D89C28` e `#FAF9F6` nos papéis visuais definidos pelo Figma. (`ABT-06`)

**Independent Test**: Abrir `/sobre` e verificar heading, marcador, texto institucional e os três princípios na ordem prevista.

---

### P1: Composição visual responsiva ⭐ MVP

**User Story**: Como visitante em qualquer dispositivo, quero consumir a tela sem cortes ou sobreposição ilegível.

**Why P1**: O Figma fornece apenas desktop, mas a plataforma deve operar em telas híbridas.

**Acceptance Criteria**:

1. The interface SHALL usar os seis assets originais exportados do frame para dashboard, notebook, forma decorativa, dois divisores e destaque gráfico. (`ABT-07`)
2. WHEN a tela for capturada em `1728 × 760 px` THEN the interface SHALL manter marcador, título, introdução, composição do notebook e lista institucional com tolerância máxima de `±4 px` para posição e tamanho. (`ABT-08`)
3. WHEN o viewport tiver largura inferior a `1024 px` THEN the interface SHALL reorganizar conteúdo textual, composição visual e princípios em fluxo vertical sem sobreposição. (`ABT-09`)
4. WHEN o viewport tiver `320 px` de largura THEN the interface SHALL manter `scrollWidth` igual a `clientWidth` e todo texto essencial dentro da área visível. (`ABT-10`)
5. WHILE os assets estiverem carregando, the interface SHALL reservar suas proporções para evitar deslocamentos de layout maiores que `0.1` de CLS na tela. (`ABT-11`)

**Independent Test**: Comparar a captura desktop ao Figma e inspecionar viewports de `320`, `768`, `1024` e `1728 px`.

---

### P2: Semântica e robustez local

**User Story**: Como visitante que usa tecnologia assistiva, quero uma hierarquia clara e imagens decorativas silenciosas.

**Why P2**: A página é pública e deve formar uma base acessível e estável.

**Acceptance Criteria**:

1. The page SHALL conter um landmark `main`, uma seção nomeada e exatamente um heading de nível 1. (`ABT-12`)
2. The page SHALL marcar os seis assets visuais com `alt=""` e `aria-hidden="true"`. (`ABT-13`)
3. The page SHALL manter contraste mínimo de `4.5:1` para textos normais e `3:1` para o título de `48 px`. (`ABT-14`)
4. IF o serviço do Figma estiver indisponível em runtime THEN the page SHALL continuar renderizando todos os assets a partir do bundle local. (`ABT-15`)

**Independent Test**: Inspecionar a árvore semântica, atributos das imagens, contraste e URLs emitidas pela build.

---

## Edge Cases

- IF o viewport tiver `320 px` de largura THEN the interface SHALL empilhar os blocos sem cortar conteúdo ou criar overflow horizontal.
- IF o usuário ampliar texto para `200%` THEN the interface SHALL manter a ordem de leitura e nenhum texto SHALL ficar encoberto por assets decorativos.
- IF as fontes ainda estiverem carregando THEN the interface SHALL usar fallback sans-serif sem ocultar conteúdo.
- IF JavaScript de backend estiver indisponível THEN the interface SHALL permanecer integralmente legível porque não depende de dados remotos.

### Implicit-requirement dimensions sweep

| Dimension | Resolution |
| --- | --- |
| Input validation & bounds | N/A porque a página não contém entradas. |
| Failure / partial-failure states | Assets locais e conteúdo estático eliminam falhas parciais remotas. |
| Idempotency / retry / duplicate handling | N/A porque não há ações mutáveis. |
| Auth boundaries & rate limits | N/A porque a rota é pública e não chama serviços. |
| Concurrency / ordering | N/A porque não há operações assíncronas de domínio. |
| Data lifecycle / expiry | N/A porque não há dados persistidos. |
| Observability | N/A porque a feature não executa operação de negócio. |
| External-dependency failure | Nenhuma URL temporária do Figma será usada em runtime. |
| State-transition integrity | N/A porque a tela é estática. |

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ABT-01 | P1: Apresentação | Tasks | In Tasks |
| ABT-02 | P1: Apresentação | Tasks | In Tasks |
| ABT-03 | P1: Apresentação | Tasks | In Tasks |
| ABT-04 | P1: Apresentação | Tasks | In Tasks |
| ABT-05 | P1: Apresentação | Tasks | In Tasks |
| ABT-06 | P1: Apresentação | Tasks | In Tasks |
| ABT-07 | P1: Composição visual | Tasks | In Tasks |
| ABT-08 | P1: Composição visual | Tasks | In Tasks |
| ABT-09 | P1: Composição visual | Tasks | In Tasks |
| ABT-10 | P1: Composição visual | Tasks | In Tasks |
| ABT-11 | P1: Composição visual | Tasks | In Tasks |
| ABT-12 | P2: Semântica | Tasks | In Tasks |
| ABT-13 | P2: Semântica | Tasks | In Tasks |
| ABT-14 | P2: Semântica | Tasks | In Tasks |
| ABT-15 | P2: Semântica | Tasks | In Tasks |

**Coverage:** 15 requisitos, 15 mapeados para tarefas, 0 não mapeados.

---

## Success Criteria

- [ ] `/sobre` renderiza o conteúdo completo e um único `h1`.
- [ ] Captura desktop validada contra o frame `103:1987`.
- [ ] Nenhum overflow horizontal em `320`, `768`, `1024` e `1728 px`.
- [ ] Todos os seis assets são locais e decorativos para tecnologia assistiva.
- [ ] `npm run test`, `npm run lint` e `npm run build` passam.
