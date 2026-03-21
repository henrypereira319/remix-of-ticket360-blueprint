const footerColumns = [
  {
    title: "Comprar ingressos",
    items: ["Shows e festivais", "Teatro e musicais", "Experiências", "Eventos com mapa de sala"],
  },
  {
    title: "Minha conta",
    items: ["Entrar ou cadastrar", "Meus pedidos", "Carteira de ingressos", "Preferências"],
  },
  {
    title: "Ajuda",
    items: ["Central de atendimento", "Como comprar", "Trocas e cancelamentos", "Segurança e validação"],
  },
  {
    title: "Para produtores",
    items: ["Cadastrar evento", "Operação de bilheteria", "Relatórios", "Contato comercial"],
  },
];

const SiteFooter = () => {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-slate-950 text-white">
      <div className="container space-y-10 py-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="inline-flex rounded-2xl bg-white px-3 py-2 font-display text-xl font-bold text-slate-950">
              EventHub
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">Marketplace com navegação de evento, descoberta e assento numerado.</h2>
              <p className="max-w-xl text-sm leading-7 text-white/70">
                A home, o detalhe do evento e a jornada de assentos caminham juntos para aproximar o produto de uma
                experiência real de ticketing, com mais clareza comercial e menos ruído visual.
              </p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">{column.title}</h4>
                <ul className="mt-4 space-y-2.5 text-sm text-white/72">
                  {column.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="transition-colors hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 EventHub. Todos os direitos reservados.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition-colors hover:text-white">
              Termos de uso
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Privacidade
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Canal de suporte
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
