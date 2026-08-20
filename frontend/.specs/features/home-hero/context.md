# Hero da Home Civix — Contexto

**Gathered:** 2026-08-20
**Spec:** `.specs/features/home-hero/spec.md`
**Status:** Ready for implementation

---

## Feature Boundary

Implementar somente a primeira tela da home representada pelo frame `90:1204`: header, hero, CTAs e miniformulário de pesquisa. As demais seções da landing page e qualquer integração de dados ficam fora desta feature.

---

## Implementation Decisions

### Identidade do produto

- UrbanSync foi renomeado para Civix.
- Civix é uma plataforma híbrida: conecta clientes a serviços e oferece automação comercial para empresas.
- O Figma e a marca Civix são as fontes vigentes.

### Conteúdo e pesquisa

- O texto do frame deve ser preservado para fidelidade visual, mas não constitui contrato definitivo de produto.
- O miniformulário usará os campos “O que busca?”, “Região” e “Faixa de preço”.
- Não haverá backend, página de resultados, loading ou falhas remotas.
- O submit será local e sem efeitos externos.

### Responsividade

- O Figma contém apenas a versão desktop da hero.
- A responsividade será derivada para tablet e mobile.
- Desktop mantém fidelidade 1:1 no viewport de referência.
- Tablet reorganiza o conteúdo sem perder a hierarquia.
- Mobile empilha conteúdo, CTAs e campos e usa navegação compacta.

### Arquitetura de interface

- Usar componentes React pequenos, Tailwind CSS 4 e tokens CSS.
- Usar CSS global apenas para tokens, resets e propriedades que precisem de controle específico.
- Configurar Vitest e React Testing Library para testes orientados ao comportamento.
- Complementar testes automatizados com validação visual responsiva no navegador.

### Agent's Discretion

- Microajustes da ilustração entre breakpoints derivados.
- Valores intermediários de espaçamento quando não houver medida responsiva no Figma.
- Estados hover, active e focus, desde que preservem a paleta e atendam ao contraste.
- Opções ilustrativas da faixa de preço, sem significado de negócio ou integração.

### Declined / Undiscussed Gray Areas → Assumptions

- Âncoras locais serão usadas para destinos ainda não implementados.
- Não haverá validação obrigatória nos campos.
- A navbar flutuante de scroll permanecerá fora do escopo por estar em outro frame.

---

## Specific References

- Figma: `Civix Design`, frame `90:1204` (`Hero`).
- Screenshot de referência: `1728 × 1117 px`.
- Paleta: frame `64:453`.
- Tipografia: frame `70:986`.
- Cores principais: `#07192A`, `#D89C28`, `#FAF9F6`, `#0E0E10`.
- Fontes: Urbanist e Inter.

---

## Deferred Ideas

- Integração da pesquisa com catálogo de empresas.
- Navbar flutuante ao rolar.
- Páginas de resultados, perfis, autenticação e planos.
- Revisão editorial completa da landing page.
