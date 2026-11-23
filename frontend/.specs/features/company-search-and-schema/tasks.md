# Tasks — Busca de Empresas, Dropdown de UF e Faixa de Preço no Cadastro (Frontend)

## Objetivo

Adicionar a lista constante com todas as 27 UFs do Brasil e faixas de preço no frontend, converter o campo **Região / UF** do card de pesquisa em um dropdown (`<select>`) idêntico ao de **Faixa de preço**, integrar os dois cards de pesquisa (`HeroSection` na Home e `CatalogoEmpresas` no Catálogo) com o endpoint `GET /api/v1/companies/search`, e habilitar a seleção de faixa de preço (`faixa_preco`) no cadastro/edição de empresas (`CompanyForm.tsx`).

## Restrições globais

- Seguir rigorosamente as convenções de `AGENTS.md`: comunicar em português brasileiro, manter identificadores de código em inglês e preservar o estilo de formatação configurado (`prettier` + `eslint`).
- Não criar nem consumir rotas além de `GET /api/v1/companies/search` (autorizada nesta spec) e das rotas já existentes no projeto.
- Empresas já existentes sem `faixa_preco` (`null` / `undefined`) não devem sofrer impacto visual ou de validação ao serem exibidas ou editadas.

## Pontos de atenção

- No card de pesquisa, a busca por **UF + Faixa de preço** exige ambos os parâmetros quando o campo de nome (`q`) não for informado. Caso o usuário selecione apenas a UF ou apenas a faixa de preço sem digitar um nome, exibir feedback claro no formulário orientando a preencher ambos os filtros.
- Manter os atributos `aria-label` e os `id`s dos campos em [`SearchForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchForm.tsx) para preservar a acessibilidade e compatibilidade com a suíte de testes em [`SearchForm.test.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchForm.test.tsx).

---

## Task 1: Lista de UFs (`BRAZIL_STATES`), Dropdown de Região/UF e Cliente de API

**Arquivos:**
- Modificar: [`frontend/src/components/home/SearchForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchForm.tsx), [`frontend/src/components/home/SearchFormEnterprise.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchFormEnterprise.tsx), [`frontend/src/lib/api.ts`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/lib/api.ts)
- Criar: [`frontend/src/lib/brazil-states.ts`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/lib/brazil-states.ts)

Passos:

- [x] Criar [`frontend/src/lib/brazil-states.ts`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/lib/brazil-states.ts) exportando `BRAZIL_STATES` (todas as 27 UFs do Brasil) e `COMPANY_PRICE_RANGES` (`0-100`, `100-300`, `300-500`, `500-plus`).
- [x] Atualizar [`frontend/src/components/home/SearchForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchForm.tsx) (e [`SearchFormEnterprise.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchFormEnterprise.tsx)) para transformar o campo **Região / UF** em um `<select>` estilizado igual ao dropdown de **Faixa de preço**, populado por `BRAZIL_STATES`.
- [x] Atualizar [`frontend/src/lib/api.ts`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/lib/api.ts) adicionando `faixa_preco` aos contratos de empresa e criando `searchCompaniesByFilters({ q, uf, priceRange })` apontando para `GET /api/v1/companies/search`.

**Pronto quando:**
- O campo **Região / UF** renderizar todas as 27 siglas de UF em um `<select>` estilizado como o campo de faixa de preço e `searchCompaniesByFilters` estiver tipado e exportado em `api.ts`.

**Commit sugerido:**
- `feat(frontend): add Brazil UF list, UF dropdown in SearchForm and search API client`

---

## Task 2: Integração dos 2 Cards de Pesquisa (Home e Catálogo) e Cadastro de Empresa (`CompanyForm`)

**Arquivos:**
- Modificar: [`frontend/src/components/home/HeroSection.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/HeroSection.tsx), [`frontend/src/pages/CatalogoEmpresas.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/pages/CatalogoEmpresas.tsx), [`frontend/src/components/dashboard-super-admin/CompanyForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/dashboard-super-admin/CompanyForm.tsx), [`frontend/src/components/home/SearchForm.test.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchForm.test.tsx), [`frontend/src/components/home/HeroSection.test.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/HeroSection.test.tsx), [`frontend/src/pages/dashboard-super-admin/Companies.test.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/pages/dashboard-super-admin/Companies.test.tsx)
- Criar: nenhum arquivo novo

Passos:

- [x] Atualizar [`HeroSection.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/HeroSection.tsx) para validar a combinação de filtros e redirecionar para `/catalogo` com os parâmetros de busca na URL (`?q=...` e/ou `?uf=...&priceRange=...`).
- [x] Atualizar [`CatalogoEmpresas.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/pages/CatalogoEmpresas.tsx) para sincronizar o `<SearchForm />` com `useSearchParams()` e consultar o backend via `searchCompaniesByFilters`.
- [x] Atualizar [`CompanyForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/dashboard-super-admin/CompanyForm.tsx) adicionando o campo opcional **Faixa de preço** (`faixa_preco`) e utilizando `BRAZIL_STATES` no seletor de UF.
- [x] Atualizar e executar os testes automatizados do frontend (`vitest`), além de `npm run format` e `npm run lint`.

**Pronto quando:**
- Os dois cards de pesquisa realizarem buscas reais por Nome ou por UF + Faixa de preço, o cadastro de empresas permitir selecionar a faixa de preço, e todos os testes, lint e formatação do frontend passarem sem erros.

**Commit sugerido:**
- `feat(frontend): wire company search cards and price range in company registration`
