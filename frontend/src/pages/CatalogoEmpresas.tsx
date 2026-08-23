const companies = [
  { name: 'Estrutura Alfa Engenharia', city: 'Sao Paulo, SP', category: 'Engenharia', tone: 'blue' },
  { name: 'Concreto & Cia', city: 'Campinas, SP', category: 'Materiais', tone: 'gold' },
  { name: 'Habita Norte', city: 'Belo Horizonte, MG', category: 'Construcao', tone: 'slate' },
  { name: 'Hidraulica Horizonte', city: 'Curitiba, PR', category: 'Instalacoes', tone: 'teal' },
  { name: 'Acabamento Real', city: 'Santos, SP', category: 'Acabamentos', tone: 'orange' },
  { name: 'Terraplenagem Sul', city: 'Joinville, SC', category: 'Servicos', tone: 'navy' },
]

function BuildingMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="building-mark">
      <path d="M10 40V15l14-7 14 7v25" />
      <path d="M7 40h34M17 21h4M27 21h4M17 28h4M27 28h4M21 40V34h6v6" />
    </svg>
  )
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#catalogo" aria-label="Civix inicio">civix<span>.</span></a>
      <nav className="main-nav" aria-label="Navegacao principal">
        <a href="#catalogo">Inicio</a>
        <a href="#sobre">Sobre</a>
        <a href="#empresas">Empresas</a>
        <a href="#planos">Planos</a>
      </nav>
      <button className="header-cta" type="button">Entrar no Civix <span aria-hidden="true">-&gt;</span></button>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <a className="brand" href="#catalogo">civix<span>.</span></a>
        <p>Conexoes que constroem<br />o futuro.</p>
        <small>© 2024 Civix. Todos os direitos reservados.</small>
      </div>
      <div className="footer-column"><strong>Empresa</strong><a href="#sobre">Sobre nos</a><a href="#empresas">Parceiros</a><a href="#contato">Contato</a></div>
      <div className="footer-column"><strong>Recursos</strong><a href="#catalogo">Catalogo</a><a href="#planos">Planos</a><a href="#ajuda">Central de ajuda</a></div>
      <div className="footer-column"><strong>Legal</strong><a href="#privacidade">Privacidade</a><a href="#termos">Termos de uso</a></div>
      <div className="footer-column footer-contact"><strong>Contato</strong><a href="mailto:oi@civix.com.br">oi@civix.com.br</a><span>Sao Paulo, Brasil</span></div>
    </footer>
  )
}

export default function CatalogoEmpresas() {
  return (
    <section className="page-shell" id="catalogo">
      <Header />
      <main>
        <section className="catalog-hero">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-copy">
            <p className="eyebrow">REDE CIVIX / EMPRESAS</p>
            <h1>Empresas parceiras<br /><em>da construcao civil.</em></h1>
            <p className="hero-description">Encontre fornecedores, especialistas e parceiros que fazem a construcao acontecer.</p>
          </div>
          <div className="search-panel" role="search">
            <label><span>O que busca?</span><input placeholder="Nome ou palavra-chave" /></label>
            <label><span>Regiao</span><input placeholder="Todo o Brasil" /></label>
            <label><span>Area de atuacao</span><input placeholder="Selecionar area" /></label>
            <button className="primary-button" type="button" aria-label="Buscar empresas">Buscar <span aria-hidden="true">-&gt;</span></button>
          </div>
        </section>

        <section className="catalog-content" id="empresas">
          <div className="results-heading"><div><p className="eyebrow dark-eyebrow">EXPLORAR A REDE</p><h2>42 empresas encontradas</h2></div><button className="clear-button" type="button">Limpar filtros <span aria-hidden="true">x</span></button></div>
          <div className="company-grid">
            {companies.map((company) => (
              <article className="company-card" key={company.name}>
                <div className={`company-art art-${company.tone}`}><span className="category-badge">{company.category}</span><BuildingMark /></div>
                <div className="company-details"><h3>{company.name}</h3><p><span className="pin">+</span>{company.city}</p><span className="card-link">Ver perfil <span aria-hidden="true">-&gt;</span></span></div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </section>
  )
}