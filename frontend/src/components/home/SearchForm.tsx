import { useState, type FormEvent } from 'react'

import arrowRight from '@/assets/civix/arrow-right.svg'
import selectChevron from '@/assets/civix/select-chevron.svg'

export interface SearchFormValues {
  priceRange: string
  query: string
  region: string
}

export interface SearchFormProps {
  initialValues?: Partial<SearchFormValues>
  onSubmit?: (values: SearchFormValues) => void
}

const emptyValues: SearchFormValues = {
  priceRange: '',
  query: '',
  region: '',
}

const fieldClasses =
  'h-[52px] w-full border-0 border-b border-[var(--color-civix-navy)] bg-transparent px-5 pb-5 pt-2 font-[family-name:var(--font-display)] text-base font-medium text-[var(--color-civix-navy)] outline-none placeholder:text-[var(--color-civix-navy)] focus:border-[var(--color-civix-gold)]'

export function SearchForm({ initialValues, onSubmit }: SearchFormProps) {
  const [values, setValues] = useState<SearchFormValues>({
    ...emptyValues,
    ...initialValues,
  })

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit?.(values)
  }

  return (
    <form
      aria-label="Pesquisa de serviços"
      className="grid w-full grid-cols-1 items-end gap-5 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_138px] lg:gap-4 xl:grid-cols-[245.38px_245.39px_245.39px_137.84px] xl:gap-[50px]"
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
        <input
          className={fieldClasses}
          maxLength={100}
          name="region"
          onChange={(event) =>
            setValues((current) => ({ ...current, region: event.target.value }))
          }
          placeholder="Região"
          type="text"
          value={values.region}
        />
      </label>

      <label className="block">
        <span className="sr-only">Faixa de preço</span>
        <select
          className={`${fieldClasses} appearance-none pr-12`}
          name="priceRange"
          onChange={(event) =>
            setValues((current) => ({ ...current, priceRange: event.target.value }))
          }
          style={{
            backgroundImage: `url(${selectChevron})`,
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '46px 44px',
          }}
          value={values.priceRange}
        >
          <option value="">Faixa de preço</option>
          <option value="0-100">Até R$ 100</option>
          <option value="100-300">R$ 100 a R$ 300</option>
          <option value="300-500">R$ 300 a R$ 500</option>
          <option value="500-plus">Acima de R$ 500</option>
        </select>
      </label>

      <button
        className="cursor-pointer inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-civix-navy)] px-6 font-[family-name:var(--font-display)] text-lg font-semibold text-[#f8f8f8] transition-colors hover:bg-[#001930] focus-visible:outline-2 focus-visible:outline-offset-2 md:col-span-2 lg:col-span-1 lg:w-[138px] xl:w-[137.84px]"
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
  )
}
