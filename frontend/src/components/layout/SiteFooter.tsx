import '@/App.css';
import logoCivix from '@/assets/civix/logo-civix-white.png';
import { HalftoneWordmark } from '@/components/motion/HalftoneWordmark';

function Footer() {
  return (
    <footer className="site-footer">
      <div data-motion="item" data-motion-step="40" className="footer-brand">
        <a
          aria-label="Civix — início"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center rounded-sm lg:-translate-y-[5px]"
          href="/"
        >
          <img
            alt="Civix"
            className="h-8 w-[99px] object-contain"
            height="32"
            src={logoCivix}
            width="99"
          />
        </a>
        <p>
          Conexões que constroem
          <br />o futuro.
        </p>
        <small>© 2026 Civix. Todos os direitos reservados.</small>
      </div>
      <div data-motion="item" data-motion-step="40" className="footer-column">
        <strong>Empresa</strong>
        <a href="/#sobre">Sobre nos</a>
        <a href="/#empresas">Parceiros</a>
        <a href="#contato">Contato</a>
      </div>
      <div data-motion="item" data-motion-step="40" className="footer-column">
        <strong>Recursos</strong>
        <a href="/catalogo">Catalogo</a>
        <a href="/#planos">Planos</a>
        <a href="/central-de-ajuda">Central de ajuda</a>
      </div>
      <div data-motion="item" data-motion-step="40" className="footer-column">
        <strong>Legal</strong>
        <a href="/politica-de-privacidade">Privacidade</a>
        <a href="/termos-de-uso">Termos de uso</a>
      </div>
      <div
        data-motion="item"
        data-motion-step="40"
        className="footer-column footer-contact"
      >
        <strong>Contato</strong>
        <a href="mailto:contato@civix.com.br">contato@civix.com.br</a>
        <span>Aracaju, Brasil</span>
      </div>
      <HalftoneWordmark wordmark="CIVIX" />
    </footer>
  );
}

export default Footer;
