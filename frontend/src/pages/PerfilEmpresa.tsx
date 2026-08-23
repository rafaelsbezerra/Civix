function ProfileHeader() {
  return (
    <header className="site-header">
      <a className="brand" href="#perfil" aria-label="Civix inicio">civix<span>.</span></a>
      <nav className="main-nav" aria-label="Navegacao principal"><a href="#perfil">Inicio</a><a href="#sobre">Sobre</a><a href="#empresas">Empresas</a><a href="#planos">Planos</a></nav>
      <button className="header-cta" type="button">Entrar no Civix <span aria-hidden="true">-&gt;</span></button>
    </header>
  )
}

function InfoIcon({ type }: { type: 'pin' | 'phone' | 'grid' | 'briefcase' }) {
  const symbols = { pin: 'M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4', phone: 'M6 3l4 2-2 4c1.2 2.5 2.5 3.8 5 5l4-2 2 4-2 2c-6 1-12-5-11-11l2-2Z', grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', briefcase: 'M7 8V6h10v2M4 10h16v9H4zM10 13h4' }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="info-icon"><path d={symbols[type]} /></svg>
}

export default function PerfilEmpresa() {
  return (
    <section className="page-shell profile-page" id="perfil">
      <ProfileHeader />
      <main>
        <section className="profile-hero">
          <div className="hero-orbit hero-orbit-one" /><div className="hero-orbit hero-orbit-two" />
          <div className="hero-copy"><p className="eyebrow">PERFIL VERIFICADO / CIVIX</p><h1>Estrutura Alfa<br /><em>Engenharia</em></h1><p className="hero-description">Projetando espacos melhores, com precisao, experiencia e responsabilidade.</p><div className="profile-actions"><button className="primary-button" type="button">Whatsapp <span aria-hidden="true">-&gt;</span></button><button className="outline-button" type="button">Visitar site <span aria-hidden="true">↗</span></button></div></div>
          <div className="company-info-panel">
            <div><InfoIcon type="pin" /><span>Localizacao<strong>Sao Paulo, SP</strong></span></div>
            <div><InfoIcon type="phone" /><span>Telefone<strong>(11) 99999-0000</strong></span></div>
            <div><InfoIcon type="grid" /><span>Segmento<strong>Engenharia</strong></span></div>
            <div><InfoIcon type="briefcase" /><span>Tipo de empresa<strong>Engenharia civil</strong></span></div>
          </div>
        </section>
        <section className="about-company" id="sobre"><p className="eyebrow dark-eyebrow">SOBRE A EMPRESA</p><h2>Quem e a Estrutura Alfa Engenharia?</h2><div className="about-columns"><p>Construir e transformar ideias em lugares que melhoram a vida das pessoas. A Estrutura Alfa Engenharia atua ha mais de uma decada no desenvolvimento de projetos e obras para empresas e comunidades.</p><p>Nosso time combina conhecimento tecnico, escuta ativa e compromisso com cada detalhe para entregar resultados duradouros, sempre respeitando o tempo, o orcamento e o entorno de cada projeto.</p></div></section>
      </main>
      <footer className="site-footer profile-footer"><div className="footer-brand"><a className="brand" href="#perfil">civix<span>.</span></a><p>Conexoes que constroem<br />o futuro.</p><small>© 2024 Civix. Todos os direitos reservados.</small></div><div className="footer-column"><strong>Empresa</strong><a href="#sobre">Sobre nos</a><a href="#empresas">Parceiros</a><a href="#contato">Contato</a></div><div className="footer-column"><strong>Recursos</strong><a href="#catalogo">Catalogo</a><a href="#planos">Planos</a><a href="#ajuda">Central de ajuda</a></div><div className="footer-column"><strong>Legal</strong><a href="#privacidade">Privacidade</a><a href="#termos">Termos de uso</a></div><div className="footer-column footer-contact"><strong>Contato</strong><a href="mailto:oi@civix.com.br">oi@civix.com.br</a><span>Sao Paulo, Brasil</span></div></footer>
    </section>
  )
}