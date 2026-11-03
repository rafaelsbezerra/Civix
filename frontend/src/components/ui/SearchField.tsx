import { Search } from 'lucide-react';
export function SearchField({ value, onChange, label, id, placeholder }: { value: string; onChange: (value: string) => void; label: string; id: string; placeholder?: string }) {
  return <label htmlFor={id} className="relative block"><span className="sr-only">{label}</span>
    <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
    <input id={id} type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder}
      className="min-h-11 w-full rounded-lg border border-current/20 bg-transparent pl-10 pr-3 text-sm" />
  </label>;
}
