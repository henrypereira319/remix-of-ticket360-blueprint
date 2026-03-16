const SiteFooter = () => {
  return (
    <footer className="bg-foreground text-card mt-8">
      <div className="container py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Institucional</h4>
            <ul className="space-y-1.5 text-sm text-card/70 font-body">
              <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Trabalhe Conosco</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Ajuda</h4>
            <ul className="space-y-1.5 text-sm text-card/70 font-body">
              <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Como Comprar</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Trocas e Devoluções</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Para Produtores</h4>
            <ul className="space-y-1.5 text-sm text-card/70 font-body">
              <li><a href="#" className="hover:text-primary transition-colors">Venda Conosco</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Área do Produtor</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm mb-3">Redes Sociais</h4>
            <ul className="space-y-1.5 text-sm text-card/70 font-body">
              <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-card/10 mt-6 pt-4 text-center text-xs text-card/50 font-body">
          © 2026 EventHub. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
