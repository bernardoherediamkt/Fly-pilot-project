import { Plane } from 'lucide-react';

export function App() {
  return (
    <main className="foundation">
      <section className="foundation__panel">
        <div className="brand"><Plane size={24} /> FlyPilot</div>
        <h1>Seu copiloto inteligente de oportunidades de viagem.</h1>
        <p>
          A fundação técnica está pronta. O próximo passo desta branch é implementar o
          protótipo navegável a partir do conceito visual aprovado: Dashboard, Radar,
          Busca Inteligente e Alertas.
        </p>
        <div className="status">v0.1 · foundation</div>
      </section>
    </main>
  );
}
