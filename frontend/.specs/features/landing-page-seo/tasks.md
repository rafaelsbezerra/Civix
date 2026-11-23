# Otimização de SEO, Metadados, Descoberta por IA e Performance da Landing Page

## Objetivo
Implementar infraestrutura completa de SEO técnico, SEO on-page, descoberta por motores de inteligência artificial (GEO — Generative Engine Optimization), dados estruturados Schema.org (JSON-LD), correção de semântica HTML e tags dinâmicas para a landing page e rotas públicas do frontend da Civix.

## Restrições globais
- Manter compatibilidade com React 19, Vite e Tailwind CSS v4, sem adicionar bibliotecas externas pesadas para SEO (implementar componente `PageHead` nativo e leve).
- Seguir estritamente o padrão de commits convencionais em inglês (`feat(...)`, `fix(...)`).
- Apenas um único elemento `<h1>` deve existir na landing page ([`HeroSection.tsx`](../../../src/components/home/HeroSection.tsx)).
- Eliminar tags `<main>` aninhadas e garantir que `Footer` fique fora da tag `<main>`.
- Não implementar Google Analytics ou Google Tag Manager nesta etapa (mantido no backlog aguardando conta oficial do Google).

## Pontos de atenção
- A imagem `og-image.png` deve ser estática e ter resolução de 1200x630px para garantir renderização perfeita em WhatsApp, LinkedIn, Slack e redes sociais.
- O arquivo `robots.txt` deve autorizar todas as rotas públicas e desautorizar explicitamente rotas privadas (`/dashboard/`, `/api/`, telas de login).
- O arquivo `sitemap.xml` deve conter as URLs públicas canônicas (`https://civix.com.br/`, `/catalogo`, `/central-de-ajuda`, `/politica-de-privacidade`, `/termos-de-uso`).
- As perguntas e respostas do JSON-LD `FAQPage` devem espelhar fielmente o conteúdo de [`FAQ.tsx`](../../../src/pages/FAQ.tsx).

---

## Task 1: Criar arquivos públicos de rastreamento e descoberta por IA (`robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`)

**Arquivos:**
- Criar:
  - `frontend/public/robots.txt`
  - `frontend/public/sitemap.xml`
  - `frontend/public/llms.txt`
  - `frontend/public/llms-full.txt`

**Passos:**
- [x] Criar `frontend/public/robots.txt` definindo permissões para rotas públicas, bloqueando `/dashboard/`, `/api/`, `/login`, e apontando `Sitemap: https://civix.com.br/sitemap.xml`.
- [x] Criar `frontend/public/sitemap.xml` no formato padrão XML com as URLs públicas canônicas, frequências e prioridades.
- [x] Criar `frontend/public/llms.txt` seguindo a especificação llmstxt.org com resumo conciso da plataforma Civix, diferenciais e links canônicos para IAs (Perplexity, ChatGPT, Claude).
- [x] Criar `frontend/public/llms-full.txt` com documentação textual detalhada dos planos, catálogo de serviços e canais de contato.

**Pronto quando:**
- Os quatro arquivos existirem em `frontend/public/` e forem emitidos para `dist/` após `npm run build`.

**Commit sugerido:**
`feat(seo): add robots.txt, sitemap.xml and llms.txt discovery files`

---

## Task 2: Adicionar assets de favicon legado, manifesto web e imagem de compartilhamento (`favicon.ico`, `apple-touch-icon.png`, `site.webmanifest`, `og-image.png`)

**Arquivos:**
- Criar:
  - `frontend/public/favicon.ico`
  - `frontend/public/apple-touch-icon.png`
  - `frontend/public/site.webmanifest`
  - `frontend/public/og-image.png`

**Passos:**
- [x] Criar `frontend/public/site.webmanifest` com nome da aplicação ("Civix"), `theme_color: "#071b2b"`, `background_color: "#fbfaf8"` e referências aos ícones.
- [x] Gerar `frontend/public/apple-touch-icon.png` (180x180) e `frontend/public/favicon.ico` para navegadores legados e dispositivos móveis Apple.
- [x] Gerar `frontend/public/og-image.png` em alta definição (1200x630 pixels) contendo logotipo Civix, proposta de valor e fundo navy institucional.

**Pronto quando:**
- Todos os assets estiverem presentes em `frontend/public/` e acessíveis via rota estática.

**Commit sugerido:**
`feat(seo): add webmanifest, touch icons and social og-image preview`

---

## Task 3: Atualizar metadados globais, Open Graph, Twitter Cards e dados estruturados JSON-LD em `index.html`

**Arquivos:**
- Modificar:
  - `frontend/index.html`

**Passos:**
- [x] Atualizar `<title>` para `Civix | Plataforma de Conexão e Gestão Comercial para a Construção Civil` e refinar `<meta name="description">` (150-160 caracteres).
- [x] Inserir `<link rel="canonical" href="https://civix.com.br/" />` e `<meta name="theme-color" content="#071b2b" />`.
- [x] Vincular `favicon.ico`, `apple-touch-icon.png` e `site.webmanifest` no `<head>`.
- [x] Inserir tags completas de Open Graph (`og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:site_name`, `og:locale`).
- [x] Inserir tags completas de Twitter Card (`twitter:card="summary_large_image"`, `twitter:url`, `twitter:title`, `twitter:description`, `twitter:image`).
- [x] Inserir `<script type="application/ld+json">` com schemas Schema.org `@graph` para `Organization`, `WebSite` (com `SearchAction`) e `FAQPage` (com as 8 perguntas e respostas da landing page).

**Pronto quando:**
- `frontend/index.html` contiver todas as meta tags canônicas e bloco JSON-LD sintaticamente válido.

**Commit sugerido:**
`feat(seo): enrich index.html with meta tags, open graph and json-ld structured data`

---

## Task 4: Corrigir semântica HTML e priorização de Core Web Vitals na Home (`Home.tsx`, `About.tsx` e `HeroSection.tsx`)

**Arquivos:**
- Modificar:
  - `frontend/src/pages/Home.tsx`
  - `frontend/src/pages/About.tsx`
  - `frontend/src/components/home/HeroSection.tsx`

**Passos:**
- [x] Em `frontend/src/pages/About.tsx`, alterar o elemento raiz de `<main>` para `<section id="sobre" aria-label="Sobre a Civix">` para eliminar o erro de `<main>` aninhado.
- [x] Em `frontend/src/pages/About.tsx`, alterar a tag do título "Transformamos atendimento em oportunidades" de `<h1>` para `<h2>`, garantindo que o `<h1>` de `HeroSection.tsx` seja o único da landing page.
- [x] Em `frontend/src/pages/Home.tsx`, reposicionar o `<Footer />` para fora da tag `<main>`, mantendo a semântica de landmarks da W3C.
- [x] Em `frontend/src/components/home/HeroSection.tsx`, adicionar `fetchpriority="high"` na imagem principal de fundo (`heroArtwork`) para otimizar o Largest Contentful Paint (LCP).

**Pronto quando:**
- A árvore renderizada da Home contiver exatamente um único elemento `<h1>` e uma única tag `<main>`, sem tags aninhadas.

**Commit sugerido:**
`fix(seo): fix semantic landmarks, ensure single h1 and optimize hero lcp`

---

## Task 5: Implementar sincronização dinâmica de títulos e meta tags em rotas públicas (`PageHead.tsx`) e testes unitários

**Arquivos:**
- Criar:
  - `frontend/src/components/seo/PageHead.tsx`
  - `frontend/src/components/seo/PageHead.test.tsx`
- Modificar:
  - `frontend/src/pages/CatalogoEmpresas.tsx`
  - `frontend/src/pages/TermsOfServices.tsx`
  - `frontend/src/pages/PrivacityPolicy.tsx`
  - `frontend/src/pages/HelperCenter.tsx`

**Passos:**
- [x] Criar `PageHead.tsx` recebendo `title`, `description` e `canonicalPath`, atualizando `document.title` e as tags `meta[name="description"]` e `link[rel="canonical"]` via `useEffect`.
- [x] Criar testes unitários em `PageHead.test.tsx` validando que a montagem do componente altera o título e a descrição no DOM e restaura adequadamente.
- [x] Integrar `PageHead` com títulos e descrições personalizadas em `CatalogoEmpresas.tsx`, `TermsOfServices.tsx`, `PrivacityPolicy.tsx` e `HelperCenter.tsx`.
- [x] Executar validações completas: testes unitários (`npm test`), compilação (`npm run build`), lint (`npm run lint`) e formatação (`npm run format:check`).

**Pronto quando:**
- Testes de `PageHead.test.tsx` e `Overview.test.tsx` passarem com sucesso e o build compilar com código 0.

**Commit sugerido:**
`feat(seo): implement dynamic page head component for public spa routes`
