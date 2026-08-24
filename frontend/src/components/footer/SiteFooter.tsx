import '@/App.css'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <a className="brand" href="#catalogo">civix<span>.</span></a>
        <p>Conexoes que constroem<br />o futuro.</p>
        <small>© 2024 Civix. Todos os direitos reservados.</small>
      </div>
      <div className="footer-column"><strong>Empresa</strong><a href="#sobre">Sobre nos</a><a href="#empresas">Parceiros</a><a href="#contato">Contato</a></div>
      <div className="footer-column"><strong>Recursos</strong><a href="/catalogo">Catalogo</a><a href="#planos">Planos</a><a href="#ajuda">Central de ajuda</a></div>
      <div className="footer-column"><strong>Legal</strong><a href="#privacidade">Privacidade</a><a href="#termos">Termos de uso</a></div>
      <div className="footer-column footer-contact"><strong>Contato</strong><a href="mailto:oi@civix.com.br">oi@civix.com.br</a><span>Sao Paulo, Brasil</span></div>
    </footer>
  )
}

export default Footer