import { useState, type FormEvent } from 'react';

import arrowRight from '@/assets/civix/arrow-right.svg';
import selectChevron from '@/assets/civix/select-chevron.svg';
import { BRAZIL_STATES, COMPANY_PRICE_RANGES } from '@/lib/brazil-states';

export interface SearchFormFilters {
  termo?: string;
  categoria?: string;
  estado?: string;
  faixaPreco?: string;
}

export interface SearchFormValues {
  priceRange: string;
  query: string;
  region: string;
}

export interface SearchFormProps {
  initialValues?: Partial<SearchFormValues>;
  onSubmit?: (values: SearchFormValues) => void;
  onSearch?: (filters: SearchFormFilters) => void | Promise<void>;
}

const emptyValues: SearchFormValues = {
  priceRange: '',
  query: '',
  region: '',
};

const fieldClasses =
  'h-[52px] w-full border-0 border-b border-[var(--color-civix-navy)] bg-transparent px-5 pb-5 pt-2 font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-civix-navy)] outline-none placeholder:text-[var(--color-civix-navy)] focus:border-[var(--color-civix-gold)]';

const selectBackgroundStyle = {
  backgroundImage: `url(${selectChevron})`,
  backgroundPosition: 'right center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '46px 44px',
} as const;

export function SearchForm({ initialValues, onSubmit, onSearch }: SearchFormProps) {
  const [prevInitialValues, setPrevInitialValues] = useState(initialValues);
  const [values, setValues] = useState<SearchFormValues>({
    ...emptyValues,
    ...initialValues,
  });

  if (
    initialValues &&
    (initialValues.query !== prevInitialValues?.query ||
      initialValues.region !== prevInitialValues?.region ||
      initialValues.priceRange !== prevInitialValues?.priceRange)
  ) {
    setPrevInitialValues(initialValues);
    setValues({
      ...emptyValues,
      ...initialValues,
    });
  }

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Dispara a callback legada, se existir
    onSubmit?.(values);

    // Dispara a callback tratada para filtros de busca da API
    onSearch?.({
      termo: values.query,
      estado: values.region,
      categoria: values.priceRange,
      faixaPreco: values.priceRange,
    });
  };

  return (
    <form
      data-motion="item"
      data-motion-trigger="mount"
      data-motion-delay="120"
      aria-label="Pesquisa de serviços"
      className="grid w-full grid-cols-1 items-end gap-5 md:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:gap-4 xl:gap-6"
      onSubmit={submitSearch}
      role="search"
    >
      <label className="block">
        <span className="sr-only">O que busca?</span>
        <input
          className={fieldClasses}
          maxLength={100}
          name="query"
          onChange={(event) =>
            setValues((current) => ({ ...current, query: event.target.value }))
          }
          placeholder="O que busca?"
          type="search"
          value={values.query}
        />
      </label>

      <label className="block">
        <span className="sr-only">Região</span>
        <select
          className={`${fieldClasses} appearance-none pr-12`}
          name="region"
          onChange={(event) =>
            setValues((current) => ({ ...current, region: event.target.value }))
          }
          style={selectBackgroundStyle}
          value={values.region}
        >
          <option value="">Região / UF</option>
          {BRAZIL_STATES.map((state) => (
            <option key={state.uf} value={state.uf}>
              {state.uf} - {state.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="sr-only">Faixa de preço</span>
        <select
          className={`${fieldClasses} appearance-none pr-12`}
          name="priceRange"
          onChange={(event) =>
            setValues((current) => ({ ...current, priceRange: event.target.value }))
          }
          style={selectBackgroundStyle}
          value={values.priceRange}
        >
          <option value="">Faixa de preço</option>
          {COMPANY_PRICE_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="cursor-pointer inline-flex h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-civix-navy)] px-6 font-[family-name:var(--font-display)] text-lg font-semibold text-[#f8f8f8] transition-colors hover:bg-[#001930] focus-visible:outline-2 focus-visible:outline-offset-2 md:col-span-2 lg:col-span-1 lg:w-auto"
        type="submit"
      >
        <span>Pesquisar</span>
        <img
          aria-hidden="true"
          alt=""
          className="size-6"
          height="24"
          src={arrowRight}
          width="24"
        />
      </button>
    </form>
  );
}
