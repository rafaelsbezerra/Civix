import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-civix-navy)] text-[var(--color-civix-ivory)] py-16 px-6 sm:px-10 lg:px-16 xl:px-32 mt-20">
      <div className="max-w-[1728px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="flex flex-col gap-4">
          <Link to="/" className="text-3xl font-bold font-[family-name:var(--font-display)] text-[var(--color-civix-ivory)] tracking-tighter">
            civix<span className="text-[var(--color-civix-gold)]">.</span>
          </Link>
          <p className="text-[var(--color-civix-ivory)]/80 leading-relaxed">Conexões que constroem<br />o futuro.</p>
          <small className="mt-4 text-[var(--color-civix-ivory)]/50">© 2024 Civix. Todos os direitos reservados.</small>
        </div>
        <div className="flex flex-col gap-3">
          <strong className="text-lg font-semibold mb-2">Empresa</strong>
          <a href="/#sobre" className="text-[var(--color-civix-ivory)]/80 hover:text-[var(--color-civix-gold)] transition-colors">Sobre nós</a>
          <Link to="/catalogo" className="text-[var(--color-civix-ivory)]/80 hover:text-[var(--color-civix-gold)] transition-colors">Parceiros</Link>
          <a href="/#contato" className="text-[var(--color-civix-ivory)]/80 hover:text-[var(--color-civix-gold)] transition-colors">Contato</a>
        </div>
        <div className="flex flex-col gap-3">
          <strong className="text-lg font-semibold mb-2">Recursos</strong>
          <Link to="/catalogo" className="text-[var(--color-civix-ivory)]/80 hover:text-[var(--color-civix-gold)] transition-colors">Catálogo</Link>
          <a href="/#planos" className="text-[var(--color-civix-ivory)]/80 hover:text-[var(--color-civix-gold)] transition-colors">Planos</a>
          <a href="/#ajuda" className="text-[var(--color-civix-ivory)]/80 hover:text-[var(--color-civix-gold)] transition-colors">Central de ajuda</a>
        </div>
        <div className="flex flex-col gap-3">
          <strong className="text-lg font-semibold mb-2">Contato</strong>
          <a href="mailto:oi@civix.com.br" className="text-[var(--color-civix-ivory)]/80 hover:text-[var(--color-civix-gold)] transition-colors">oi@civix.com.br</a>
          <span className="text-[var(--color-civix-ivory)]/80">São Paulo, Brasil</span>
        </div>
      </div>
    </footer>
  );
}
