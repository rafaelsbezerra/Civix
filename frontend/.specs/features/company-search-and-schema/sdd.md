# SDD — Busca de Empresas e Cadastro de Faixa de Preço (Frontend)

- **Feature:** [`feature.md`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/.specs/features/company-search-and-schema/feature.md)
- **Tasks:** [`tasks.md`](file:///c:/Users/teco0/Documents/GitHub/Civix/frontend/.specs/features/company-search-and-schema/tasks.md)

---

## 1. Constantes de UFs e Faixas de Preço (`frontend/src/lib/brazil-states.ts`)

```typescript
export interface BrazilStateOption {
  uf: string;
  name: string;
}

export const BRAZIL_STATES: readonly BrazilStateOption[] = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
] as const;

export type CompanyPriceRangeValue = '0-100' | '100-300' | '300-500' | '500-plus';

export interface CompanyPriceRangeOption {
  value: CompanyPriceRangeValue;
  label: string;
}

export const COMPANY_PRICE_RANGES: readonly CompanyPriceRangeOption[] = [
  { value: '0-100', label: 'Até R$ 100' },
  { value: '100-300', label: 'R$ 100 a R$ 300' },
  { value: '300-500', label: 'R$ 300 a R$ 500' },
  { value: '500-plus', label: 'Acima de R$ 500' },
] as const;
```

---

## 2. Cliente HTTP (`frontend/src/lib/api.ts`)

- Adicionar `faixa_preco?: CompanyPriceRangeValue | null` nas interfaces `Empresa`, `PlatformCompany`, `CompanyRegistrationInput` e `PlatformCompanyUpdateInput`.
- Adicionar a função `searchCompaniesByFilters(params: CompanySearchFilterParams)`:
  - Quando não houver filtros (`!q && !uf && !priceRange`), delega para `fetchPublicCompanies()` (`GET /api/v1/empresas`) para listar todas as empresas ativas no catálogo.
  - Quando houver filtros (`q` ou `uf` + `priceRange`), faz `GET /api/v1/companies/search` passando `params` via Axios e retorna a lista mapeada de `Empresa[]`.

---

## 3. Componentes e Páginas Afetados

### 3.1 `SearchForm.tsx` (e `SearchFormEnterprise.tsx`)
- Substituir o `<Input id={`${formId}-region`} />` por um `<select id={`${formId}-region`} />` com a mesma estrutura visual e `<ChevronDown />` usada no campo `${formId}-price-range`.
- Aceitar props opcionais `initialQuery`, `initialRegion`, `initialPriceRange` (para sincronizar com a query string em `/catalogo`) e `validationError` para exibir mensagem de validação quando apenas um entre UF e Faixa de preço for selecionado sem nome.

### 3.2 `HeroSection.tsx`
- Em `handleSearch(data: SearchFormData)`:
  - Se o usuário preencher apenas `region` sem `priceRange` (ou apenas `priceRange` sem `region`) e `query` estiver vazio, exibir aviso de validação.
  - Construir `URLSearchParams` (`q`, `uf`, `priceRange`) e navegar com `navigate(\`/catalogo?\${searchParams.toString()}\`)` (ou `navigate('/catalogo')` se vazio).

### 3.3 `CatalogoEmpresas.tsx`
- Ler `useSearchParams()` do `react-router-dom` (`q`, `uf`, `priceRange`).
- Passar os valores iniciais para `<SearchForm />` e atualizar `useSearchParams` ao submeter nova busca.
- Executar `searchCompaniesByFilters({ q, uf, priceRange })` sempre que os parâmetros da URL mudarem, atualizando os cards renderizados.

### 3.4 `CompanyForm.tsx`
- Substituir a lista estática `ESTADOS_BR` pela importação de `BRAZIL_STATES`.
- Adicionar o campo `faixa_preco` (`<Select>` do shadcn/ui) com as opções de `COMPANY_PRICE_RANGES` na seção de informações comerciais/endereço do formulário de empresa.

