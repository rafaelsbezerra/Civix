# Feature — Otimização de SEO, Metadados, Descoberta por IA (LLMs) e Performance da Landing Page

- **Identificador:** `landing-page-seo`
- **Status:** Especificado (Aguardando Aprovação de Implementação)
- **Data:** 2026-11-10
- **Escopo:** Frontend (`frontend/`)
- **Arquivos da spec:** [Feature](feature.md) · [SDD](sdd.md) · [Tasks](tasks.md)

---

## 1. Contexto e Objetivo

Atualmente, o frontend da Civix possui apenas configurações preliminares de metadados em [`frontend/index.html`](../../../index.html), com um `<title>` genérico (`Civix`) e ausência de arquivos essenciais de rastreamento (`robots.txt`, `sitemap.xml`, `llms.txt`, `og-image.png`). Além disso, ao navegar entre rotas públicas da aplicação SPA (`/catalogo`, `/politica-de-privacidade`, `/termos-de-uso`), os metadados permanecem estáticos, e a Home apresenta problemas de semântica (dois `<h1>` simultâneos e `<main>` aninhado) que prejudicam o ranqueamento no Google.

O objetivo desta feature é implementar uma infraestrutura completa de **SEO Técnico, SEO On-Page, Descoberta por IAs (GEO - Generative Engine Optimization) e Performance**, garantindo:
1. Indexação correta e prioritária pelos motores de busca (Google, Bing).
2. Compartilhamento atrativo com cards e imagens ricas em redes sociais e mensageiros (WhatsApp, LinkedIn, Slack, Twitter/X).
3. Otimização para mecanismos de inteligência artificial (ChatGPT, Perplexity, Claude) via arquivos padronizados `llms.txt`.
4. Exibição de **Rich Snippets** na busca do Google por meio de dados estruturados Schema.org (JSON-LD), com ênfase no FAQ já existente na plataforma.
5. Correção de semântica HTML e métricas Core Web Vitals (LCP/CLS) na landing page.

---

## 2. Escopo

### 2.1. No Escopo (In-Scope)
1. **Favicon e Ícones Mobile/PWA:**
   - Criação de `favicon.ico`, `apple-touch-icon.png` (180x180) e manifesto `site.webmanifest` (ou `manifest.json`), preservando o `icon.svg` já existente em `frontend/public/`.
2. **Meta Tags Globais ([`frontend/index.html`](../../../index.html)):**
   - `<title>` estratégico e focado em conversão e branding.
   - `<meta name="description">` persuasivo com 150-160 caracteres.
   - Tags Open Graph completas (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`).
   - Tags Twitter Card completas (`twitter:card="summary_large_image"`, `twitter:title`, `twitter:description`, `twitter:image`).
   - Link canônico `<link rel="canonical" href="https://civix.com.br/" />`.
   - Meta `theme-color` com a cor primária navy `#071b2b`.
3. **Imagem de Compartilhamento Social (`public/og-image.png`):**
   - Criação de asset estático padronizado em **1200x630 pixels** para exibição em redes sociais.
4. **Arquivos de Rastreamento:**
   - `frontend/public/robots.txt`: regras de permissão para rotas públicas e bloqueio para áreas privadas (`/dashboard/`, `/api/`).
   - `frontend/public/sitemap.xml`: mapeamento de todas as URLs públicas da aplicação com `lastmod` e `changefreq`.
5. **Otimização para IAs e LLMs (GEO):**
   - `frontend/public/llms.txt`: arquivo conciso estruturado segundo a especificação llmstxt.org para alimentar respostas de IAs sobre a Civix.
   - `frontend/public/llms-full.txt`: documentação textual detalhada com modelos de negócio, planos e catálogo de serviços.
6. **Gerenciamento de Metadados por Página (SPA):**
   - Utilitário ou componente desacoplado (`<PageHead />` ou hook `usePageMetadata`) para alterar dinamicamente o `<title>` e a meta description em rotas como `/catalogo`, `/termos-de-uso`, `/politica-de-privacidade` e `/central-de-ajuda`.
7. **Dados Estruturados Schema.org (JSON-LD):**
   - Inclusão dos schemas:
     - `Organization` (dados institucionais da Civix).
     - `WebSite` com `SearchAction` (apontando para a busca no catálogo).
     - `FAQPage` (alimentado pelas 8 perguntas e respostas oficiais da landing page).
8. **Correção de Semântica e Estrutura HTML:**
   - Garantir **apenas um único `<h1>`** na Home (no Hero), rebaixando o título da seção Sobre para `<h2>`.
   - Eliminar `<main>` aninhado dentro de [`About.tsx`](../../../src/pages/About.tsx) quando renderizado na Home.
   - Mover o [`SiteFooter.tsx`](../../../src/components/layout/SiteFooter.tsx) para fora da tag `<main>` em [`Home.tsx`](../../../src/pages/Home.tsx).
9. **Performance & Core Web Vitals:**
   - Adicionar `fetchpriority="high"` na imagem principal do Hero para otimizar o LCP.
   - Adicionar `loading="lazy"` e `decoding="async"` nas imagens abaixo da dobra.

### 2.2. Fora do Escopo (Out-of-Scope)
- **Google Analytics / Google Tag Manager:** Mantido no backlog aguardando criação da conta no Google pelo usuário.
- Alterações em regras de negócio, tabelas ou endpoints do backend.

---

## 3. Requisitos Funcionais e Não Funcionais

### 3.1. Requisitos Funcionais (RF)
- **RF-01 (Metadados da Home):** O cabeçalho HTML da página principal deve conter título descritivo de até 60 caracteres e descrição precisa de até 160 caracteres.
- **RF-02 (Open Graph & Twitter Cards):** Ao colar o link em qualquer mensageiro, deve ser exibido card com título, descrição e thumbnail em 1200x630px.
- **RF-03 (Metadados Dinâmicos por Rota):** Ao navegar para `/catalogo`, a aba do navegador deve exibir `Catálogo de Empresas e Serviços | Civix` e a descrição correspondente.
- **RF-04 (Arquivos Públicos de Indexação):** `https://civix.com.br/robots.txt` e `https://civix.com.br/sitemap.xml` devem ser acessíveis diretamente via requisição HTTP estática.
- **RF-05 (Contexto para IAs):** `https://civix.com.br/llms.txt` deve fornecer resumo estruturado em Markdown com links canônicos para agentes e crawlers de IA.
- **RF-06 (Rich Snippets FAQ):** O Google deve ser capaz de interpretar as perguntas do FAQ da Home através de marcação Schema.org `FAQPage`.

### 3.2. Requisitos Não Funcionais (RNF)
- **RNF-01 (Semântica W3C):** O documento HTML renderizado não pode conter tags `<main>` aninhadas nem mais de um elemento `<h1>` simultâneo.
- **RNF-02 (Performance de Carregamento):** As inclusões de metadados e imagens não podem introduzir bloqueios de renderização nem degradar a pontuação de Core Web Vitals (LCP, CLS, INP).
- **RNF-03 (Compatibilidade com Builds Vite):** Todos os assets adicionados em `frontend/public/` devem ser copiados diretamente para `dist/` sem necessidade de loaders extras.

---

## 4. Histórias de Usuário

1. **Como visitante compartilhando a Civix:**
   - Quero enviar o link da plataforma no WhatsApp para meus sócios e ver um card profissional com o logo da Civix, título claro e resumo atrativo, transmitindo credibilidade imediata.
2. **Como cliente em potencial buscando no Google:**
   - Quero encontrar a Civix com título explicativo e ver as perguntas frequentes diretamente no resultado de pesquisa, para entender rapidamente como a plataforma conecta construtoras e fornecedores.
3. **Como usuário pesquisando via ChatGPT ou Perplexity:**
   - Quero que a IA recomende a Civix de forma precisa, utilizando as informações oficiais fornecidas no arquivo `llms.txt`.

---

## 5. Critérios de Aceite

1. `index.html` renderiza tags completas de Open Graph e Twitter Cards com imagem de preview de 1200x630px.
2. `https://civix.com.br/robots.txt` e `https://civix.com.br/sitemap.xml` estão disponíveis publicamente na raiz do build (`dist/`).
3. `https://civix.com.br/llms.txt` e `https://civix.com.br/llms-full.txt` estão disponíveis no padrão llmstxt.org.
4. O validador de Rich Snippets do Google reconhece os schemas `Organization`, `WebSite` e `FAQPage` no HTML da Home.
5. A landing page possui exatamente um elemento `<h1>` e nenhuma tag `<main>` aninhada.
6. A navegação para `/catalogo` e outras páginas públicas atualiza dinamicamente o título e a meta description no navegador.
7. `npm run build`, `npm run lint` e `npm run format:check` passam com código de saída 0.

---

## 6. Decisões Confirmadas e Pendentes

### 6.1. Decisões Confirmadas
- **Escopo de Analytics:** Google Analytics e Google Tag Manager ficam no backlog até que a conta oficial da Civix seja criada.
- **Implementação do Head:** Utilizar um componente React nativo e leve (`PageHead.tsx`) sem introduzir bibliotecas pesadas de head management (como react-helmet) para preservar o bundle size.
- **Formato GEO / IA:** Adotar a especificação `llms.txt` oficial.

### 6.2. Decisões Pendentes
- Nenhuma pendência impeditiva no momento.


