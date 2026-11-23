# Feature — Busca de Empresas e Cadastro de Faixa de Preço (Frontend)

- **Identificador:** `company-search-and-schema`
- **Status:** Aprovado para implementação
- **Data:** 2026-11-07
- **Spec Backend pareada:** [`backend/.specs/features/company-search-and-schema/`](file:///c:/Users/teco0/Documents/GitHub/Civix/backend/.specs/features/company-search-and-schema/feature.md)

---

## Contexto e Objetivo

Atualmente, os dois cards de pesquisa no frontend ([`HeroSection.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/HeroSection.tsx) na página inicial e [`CatalogoEmpresas.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/pages/CatalogoEmpresas.tsx) na página de catálogo) exibem os campos **Empresa, serviço ou área**, **Região / UF** (como `<input type="text">`) e **Faixa de preço** (como `<select>`), mas não executam busca no backend com esses parâmetros.

Esta feature habilita:

1. **Lista constante de UFs e Faixas de Preço (`BRAZIL_STATES` e `COMPANY_PRICE_RANGES`):**
   - Array no frontend contendo todas as 27 Unidades Federativas do Brasil (`AC` a `TO`) com sigla e nome por extenso.
2. **Dropdown de Região / UF no card de pesquisa:**
   - Transformação do campo **Região / UF** em um `<select>` estilizado de forma idêntica ao dropdown de **Faixa de preço**.
3. **Integração dos dois cards de pesquisa com `GET /api/v1/companies/search`:**
   - Card da Home ([`HeroSection.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/HeroSection.tsx)): ao submeter a pesquisa, navega para `/catalogo` passando os filtros como query string (`?q=...` e/ou `?uf=...&priceRange=...`).
   - Card do Catálogo ([`CatalogoEmpresas.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/pages/CatalogoEmpresas.tsx)): lê os parâmetros da URL e consulta `GET /api/v1/companies/search`.
4. **Campo de Faixa de Preço no Cadastro de Empresas:**
   - Inclusão do seletor de **Faixa de preço** (`faixa_preco`) e padronização da seleção de **UF** em [`CompanyForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/dashboard-super-admin/CompanyForm.tsx), sem afetar empresas já existentes que não possuem faixa definida.

---

## Requisitos Funcionais

### RF-01 — Lista de UFs do Brasil e Dropdown de Região / UF
- O módulo [`frontend/src/lib/brazil-states.ts`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/lib/brazil-states.ts) deve exportar `BRAZIL_STATES` (27 estados brasileiros com `uf` e `name`) e `COMPANY_PRICE_RANGES` (`0-100`, `100-300`, `300-500`, `500-plus`).
- Em [`SearchForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchForm.tsx) (e [`SearchFormEnterprise.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/home/SearchFormEnterprise.tsx)), o campo **Região / UF** deve ser renderizado como um `<select>` com a opção padrão `"Selecione a UF"` (`value=""`) e todas as opções de `BRAZIL_STATES` (`value={state.uf}`).

### RF-02 — Fluxos de Busca nos 2 Cards (Home e Catálogo)
- **Modos de consulta suportados:**
  1. **Nome apenas:** `?q=<termo>`
  2. **UF + Faixa de preço:** `?uf=<UF>&priceRange=<faixa>`
  3. **Combinado (Nome + UF + Faixa de preço):** `?q=<termo>&uf=<UF>&priceRange=<faixa>`
- Quando o usuário informar apenas `UF` sem `Faixa de preço` (ou vice-versa) e sem nome (`q`), o formulário deve exibir feedback claro orientando a selecionar ambos (**Região / UF** e **Faixa de preço**) ou informar o nome da empresa.

### RF-03 — Cadastro e Edição de Empresas com Faixa de Preço
- Em [`CompanyForm.tsx`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/src/components/dashboard-super-admin/CompanyForm.tsx), adicionar o campo opcional **Faixa de preço** (`faixa_preco`) com as 4 faixas predefinidas (`0-100`, `100-300`, `300-500`, `500-plus`) e utilizar `BRAZIL_STATES` no seletor de UF.
- Enviar `faixa_preco` no payload de criação (`POST /api/v1/empresas`) e atualização (`PUT /api/v1/platform/companies/:companyId`).

---

## Decisões Confirmadas

| ID | Decisão | Escolha Confirmada |
| :--- | :--- | :--- |
| **CS-D01** | Rota de busca consumida pelo frontend | `GET /api/v1/companies/search` aceitando `?q=...`, `?uf=...&priceRange=...` ou os 3 combinados |
| **CS-D02** | Seleção de faixa de preço no `CompanyForm.tsx` | Select com as 4 faixas predefinidas (`0-100`, `100-300`, `300-500`, `500-plus`), opcional |

