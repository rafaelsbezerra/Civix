# SDD — Software Design Document: Otimização de SEO, Metadados e Descoberta por IA

- **Identificador:** `landing-page-seo`
- **Feature associada:** [feature.md](feature.md)
- **Status:** Especificado (Aguardando Aprovação de Implementação)
- **Data:** 2026-11-10

---

## 1. Arquitetura Técnica e Visão Geral

A arquitetura de SEO do frontend da Civix divide-se em três camadas complementares:
1. **Camada Estática (`index.html` e `public/`):** Metadados fundamentais, arquivos de rastreamento de crawlers e IA, ícones PWA e dados estruturados Schema.org disponíveis imediatamente no primeiro byte HTML.
2. **Camada Dinâmica SPA (`usePageMetadata` / `PageHead`):** Sincronização em tempo de execução do título do documento (`document.title`) e meta tags específicas ao navegar entre rotas públicas via React Router.
3. **Camada Semântica e Core Web Vitals:** Ajustes no JSX da árvore de componentes da Home para conformidade estrita com padrões W3C de acessibilidade e priorização de recursos visuais críticos (LCP).

```
frontend/
├── index.html                           # Metadados globais, Open Graph, Twitter Cards, JSON-LD
├── public/
│   ├── icon.svg                         # Favicon vetorial padrão
│   ├── favicon.ico                      # Favicon legado (crawlers e navegadores antigos)
│   ├── apple-touch-icon.png             # Ícone 180x180 para iOS
│   ├── site.webmanifest                 # Manifesto Web / PWA
│   ├── og-image.png                     # Imagem 1200x630 para WhatsApp, LinkedIn, Slack
│   ├── robots.txt                       # Diretivas de rastreamento do Googlebot e bots de IA
│   ├── sitemap.xml                      # Mapa do site com URLs públicas
│   ├── llms.txt                         # Documento de contexto padronizado para IA
│   └── llms-full.txt                    # Documentação textual expandida para IA
└── src/
    ├── components/
    │   ├── seo/
    │   │   └── PageHead.tsx             # Componente dinâmico de SEO para rotas públicas
    │   ├── home/
    │   │   └── HeroSection.tsx          # Único H1 da página e fetchpriority="high"
    │   └── layout/
    │       └── SiteFooter.tsx           # Posicionado como irmão do landmark <main>
    └── pages/
        ├── Home.tsx                     # Correção de tags semânticas (<main> único)
        └── About.tsx                    # Rebaixamento de H1 para H2 na seção Sobre
```

---

## 2. Detalhamento dos Componentes e Arquivos

### 2.1. Metadados Globais em [`frontend/index.html`](../../../index.html)

Substituição dos metadados rudimentares atuais por tags canônicas completas:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#071b2b" />

    <!-- Título Primário e SEO Básico -->
    <title>Civix | Plataforma de Conexão e Gestão Comercial para a Construção Civil</title>
    <meta
      name="description"
      content="A Civix conecta construtoras, prestadores e clientes em uma plataforma inteligente de contratação, gestão de planos e fechamento de novos negócios."
    />
    <link rel="canonical" href="https://civix.com.br/" />

    <!-- Ícones e Favicons -->
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- Open Graph (Facebook, WhatsApp, LinkedIn, Slack) -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://civix.com.br/" />
    <meta property="og:title" content="Civix | Conexões que Constroem o Futuro" />
    <meta
      property="og:description"
      content="A plataforma inteligente que conecta empresas, serviços e oportunidades na construção civil."
    />
    <meta property="og:image" content="https://civix.com.br/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="Civix" />

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://civix.com.br/" />
    <meta name="twitter:title" content="Civix | Conexões que Constroem o Futuro" />
    <meta
      name="twitter:description"
      content="A plataforma inteligente que conecta empresas, serviços e oportunidades na construção civil."
    />
    <meta name="twitter:image" content="https://civix.com.br/og-image.png" />

    <!-- Dados Estruturados Schema.org (JSON-LD) -->
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": "https://civix.com.br/#organization",
            "name": "Civix",
            "url": "https://civix.com.br",
            "logo": "https://civix.com.br/icon.svg",
            "description": "Plataforma híbrida de descoberta e automação comercial para o setor da construção civil.",
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "contato@civix.com.br",
              "contactType": "customer service",
              "areaServed": "BR",
              "availableLanguage": "Portuguese"
            }
          },
          {
            "@type": "WebSite",
            "@id": "https://civix.com.br/#website",
            "url": "https://civix.com.br",
            "name": "Civix",
            "publisher": { "@id": "https://civix.com.br/#organization" },
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://civix.com.br/catalogo?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "FAQPage",
            "@id": "https://civix.com.br/#faq",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Como funciona a CIVIX?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A CIVIX é uma plataforma inteligente que conecta prestadores de serviços, construtores e clientes finais no mercado da construção civil. Facilitamos a descoberta de parceiros qualificados, contratação segura, gestão de planos e fechamento de novos negócios em um único ambiente moderno e integrado."
                }
              },
              {
                "@type": "Question",
                "name": "Como cadastrar minha empresa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Para cadastrar sua empresa, basta clicar no botão de cadastro no topo da página, escolher o plano ideal para o seu perfil e preencher os dados organizacionais solicitados."
                }
              },
              {
                "@type": "Question",
                "name": "Como os clientes encontram minha empresa?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sua empresa é exibida no catálogo da CIVIX de acordo com suas especialidades, localização e avaliações, permitindo que clientes qualificados encontrem seus serviços diretamente."
                }
              },
              {
                "@type": "Question",
                "name": "Posso cancelar meu plano a qualquer momento?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim, você pode gerenciar ou cancelar sua assinatura a qualquer momento através do seu painel administrativo sem multa de fidelidade."
                }
              },
              {
                "@type": "Question",
                "name": "Quais formas de pagamento são aceitas?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Aceitamos cartão de crédito, PIX e boleto bancário para os planos de assinatura e serviços da plataforma."
                }
              },
              {
                "@type": "Question",
                "name": "Como entrar em contato com o suporte?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nosso time de suporte está disponível via chat diretamente na plataforma ou através do canal de atendimento via e-mail e WhatsApp comercial."
                }
              },
              {
                "@type": "Question",
                "name": "Quanto tempo leva para minha empresa aparecer na plataforma?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Logo após a validação dos dados cadastrais e a escolha do plano, seu perfil é ativado e fica visível imediatamente."
                }
              },
              {
                "@type": "Question",
                "name": "A CIVIX oferece suporte para marketing?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim! Dependendo do seu plano, auxiliamos na otimização da vitrine do seu negócio para impulsionar sua visibilidade na região."
                }
              }
            ]
          }
        ]
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### 2.2. Diretivas de Rastreamento (`public/robots.txt`)

Instrui indexadores legítimos e agentes de IA a rastrear áreas públicas e não consumir recursos de endpoints privados ou de autenticação:

```txt
User-agent: *
Allow: /
Allow: /catalogo
Allow: /sobre
Allow: /politica-de-privacidade
Allow: /termos-de-uso
Allow: /central-de-ajuda
Allow: /llms.txt
Allow: /llms-full.txt
Disallow: /dashboard/
Disallow: /api/
Disallow: /login
Disallow: /super-admin/login

Sitemap: https://civix.com.br/sitemap.xml
```

---

### 2.3. Mapa do Site (`public/sitemap.xml`)

Estrutura formal XML para submissão no Google Search Console:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://civix.com.br/</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://civix.com.br/catalogo</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://civix.com.br/central-de-ajuda</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://civix.com.br/politica-de-privacidade</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://civix.com.br/termos-de-uso</loc>
    <lastmod>2026-11-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>
```

---

### 2.4. Arquivos para IAs (`public/llms.txt` e `public/llms-full.txt`)

Conforme a especificação [llmstxt.org](https://llmstxt.org/), esse arquivo permite que modelos de linguagem (ChatGPT Search, Perplexity, Claude, Copilot) processem o conhecimento do site sem consumir excesso de tokens com tags HTML/CSS:

* **`llms.txt`**:
  ```markdown
  # Civix

  > Plataforma inteligente de conexão, contratação e gestão comercial para o mercado da construção civil.

  ## Seções Principais
  - [Início](https://civix.com.br/): Visão geral da plataforma, planos de assinatura e diferenciais.
  - [Catálogo](https://civix.com.br/catalogo): Busca de empresas qualificadas por especialidade e estado.
  - [Sobre](https://civix.com.br/#sobre): Missão, tecnologia e princípios institucionais da Civix.
  - [Planos](https://civix.com.br/#planos): Modalidades de adesão e ferramentas para prestadores e construtoras.

  ## Contato e Suporte
  - E-mail: contato@civix.com.br
  - Localização: Aracaju - SE, Brasil
  ```

---

### 2.5. Metadados Dinâmicos por Rota (`src/components/seo/PageHead.tsx`)

Um hook/componente leve sem dependências pesadas externas (preservando o bundle) que atualiza o `document.title`, a meta `description` e o `canonical`:

```tsx
import { useEffect } from 'react';

export interface PageHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
}

export function PageHead({ title, description, canonicalPath }: PageHeadProps) {
  useEffect(() => {
    const fullTitle = `${title} | Civix`;
    document.title = fullTitle;

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', description);
      }
    }

    if (canonicalPath) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (linkCanonical) {
        linkCanonical.setAttribute('href', `https://civix.com.br${canonicalPath}`);
      }
    }
  }, [title, description, canonicalPath]);

  return null;
}
```

Exemplo de uso em rotas públicas:
- Em `CatalogoEmpresas.tsx`: `<PageHead title="Catálogo de Empresas e Parceiros" description="Encontre construtoras e fornecedores qualificados..." canonicalPath="/catalogo" />`
- Em `TermsOfServices.tsx`: `<PageHead title="Termos de Uso" canonicalPath="/termos-de-uso" />`
- Em `PrivacityPolicy.tsx`: `<PageHead title="Política de Privacidade" canonicalPath="/politica-de-privacidade" />`

---

### 2.6. Correções Semânticas em [`Home.tsx`](../../../src/pages/Home.tsx) e [`About.tsx`](../../../src/pages/About.tsx)

1. **`Home.tsx`**:
   - Mover `<Footer />` para fora de `<main>`:
     ```tsx
     <div className="min-h-screen bg-[var(--color-civix-ivory)]">
       <SignSelect />
       <SiteHeader />
       <main id="main-content">
         <HeroSection />
         <AboutPage />
         <CardEmpresas />
         <PlansSection />
         <FAQ />
       </main>
       <Footer />
     </div>
     ```
2. **`About.tsx`**:
   - Trocar a tag raiz de `<main>` para `<section id="sobre" aria-label="Sobre a Civix">`.
   - Ajustar o título `<h1>Transformamos atendimento em oportunidades.</h1>` para `<h2>`, preservando o `<h1>` de [`HeroSection.tsx`](../../../src/components/home/HeroSection.tsx) como o único da página.

---

## 3. Plano de Testes

1. **Testes Unitários (Vitest):**
   - Verificar se `PageHead` atualiza `document.title` e a meta `description` no DOM ao montar.
   - Criar teste em `Home.test.tsx` garantindo que existe exatamente **um único elemento `<h1>`** em toda a landing page.
   - Garantir que não existem tags `<main>` aninhadas no DOM.
2. **Testes de Bundle e Assets:**
   - Garantir que `npm run build` copia com sucesso `robots.txt`, `sitemap.xml`, `llms.txt`, `site.webmanifest` e `favicon.ico` para a pasta `dist/`.
   - Executar `npm run lint` e `npm run format:check`.

