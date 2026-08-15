import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ExternalLink, Plane, Radar, Search, Sparkles } from 'lucide-react';
import { searchRadarDeals, type RadarDeal, type RadarDealsResponse } from './services/radarDeals';
import './v04-live.css';

const money = (value: number, currency = 'BRL') => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(value);

function durationLabel(minutes: number | null) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m ? `${m}min` : ''}`.trim();
}

function DealCard({ deal }: { deal: RadarDeal }) {
  const url = deal.googleFlightsUrl || deal.serpApiFlightUrl;
  return (
    <article className="radar-live-card">
      {deal.thumbnail ? <div className="radar-live-image" style={{ backgroundImage: `url(${deal.thumbnail})` }} /> : <div className="radar-live-image radar-live-image--fallback"><Plane size={34}/></div>}
      <div className="radar-live-body">
        <div className="radar-live-top"><div><span>{deal.destination || deal.destinationId || 'Destino'}</span><h3>{deal.name}</h3><p>{deal.country || deal.description || 'Oportunidade encontrada pelo radar'}</p></div><div className="radar-live-score"><span>FlyScore</span><strong>{deal.flyScore}</strong></div></div>
        <div className="radar-live-price"><div><span>Preço encontrado</span><strong>{money(deal.price)}</strong></div>{deal.averagePrice ? <div><span>Preço médio</span><strong>{money(deal.averagePrice)}</strong></div> : null}<div><span>Desconto</span><strong className="discount-value">{deal.discountPercentage ? `${deal.discountPercentage}%` : '—'}</strong></div></div>
        <div className="radar-live-meta"><span>{deal.startDate && deal.endDate ? `${deal.startDate} → ${deal.endDate}` : 'Datas flexíveis'}</span><span>{deal.stops === 0 ? 'Direto' : deal.stops ? `${deal.stops} escala(s)` : 'Escalas não informadas'}</span><span>{durationLabel(deal.flightDurationMinutes)}</span>{deal.airline ? <span>{deal.airline}</span> : null}</div>
        {url ? <a className="radar-live-action" href={url} target="_blank" rel="noreferrer">Ver oportunidade <ExternalLink size={15}/></a> : <span className="radar-live-action radar-live-action--disabled">Link ainda não disponível</span>}
      </div>
    </article>
  );
}

export function LiveRadarPage() {
  const [origin, setOrigin] = useState('GIG');
  const [maxPrice, setMaxPrice] = useState('2500');
  const [nonStop, setNonStop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RadarDealsResponse | null>(null);

  async function runRadar() {
    setLoading(true);
    setError('');
    try {
      const response = await searchRadarDeals({
        origin,
        maxPrice: Number(maxPrice) || undefined,
        nonStop,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o Radar.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runRadar();
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void runRadar();
  }

  return (
    <main className="live-page">
      <header className="live-topbar">
        <a href="/" className="back-link"><ArrowLeft size={17}/> Dashboard</a>
        <nav className="live-mini-nav"><a href="/live"><Search size={16}/> Busca real</a></nav>
        <div className="live-brand"><Radar size={22}/> FlyPilot <span>RADAR</span></div>
      </header>

      <section className="live-hero radar-hero">
        <div>
          <span className="live-eyeline"><Sparkles size={14}/> OPORTUNIDADES AUTOMÁTICAS</span>
          <h1>Para onde está barato viajar?</h1>
          <p>O Radar consulta oportunidades reais a partir da sua cidade de origem e prioriza descontos, preço e conveniência.</p>
        </div>
      </section>

      <form className="radar-live-controls" onSubmit={handleSubmit}>
        <label><span>Saindo de</span><input value={origin} maxLength={3} onChange={(e) => setOrigin(e.target.value.toUpperCase())}/></label>
        <label><span>Até quanto?</span><input inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value.replace(/\D/g, ''))}/></label>
        <label className="nonstop"><input type="checkbox" checked={nonStop} onChange={(e) => setNonStop(e.target.checked)}/><span>Somente diretos</span></label>
        <button className="live-search-button" disabled={loading}><Radar size={18}/>{loading ? 'Varrendo oportunidades...' : 'Atualizar Radar'}</button>
      </form>

      {error && <div className="live-error"><strong>Radar indisponível</strong><span>{error}</span></div>}

      {result && (
        <div className="live-status is-live">
          <span>RADAR AO VIVO</span>
          <p>{result.deals.length} oportunidade(s) retornadas pelo Google Flights Deals via SerpApi.</p>
          <small>Atualizado em {new Date(result.meta.fetchedAt).toLocaleString('pt-BR')}</small>
        </div>
      )}

      {result && result.deals.length === 0 && <div className="live-empty">Nenhuma oportunidade apareceu com esses filtros. Aumente o orçamento ou permita voos com escala.</div>}

      {result && result.deals.length > 0 && (
        <section className="radar-live-results">
          <div className="results-head"><div><h2>Melhores oportunidades saindo de {origin}</h2><p>Ordenadas pelo FlyScore calculado sobre os dados retornados.</p></div><span>{result.meta.count} resultados</span></div>
          <div className="radar-live-grid">{result.deals.slice(0, 12).map((deal) => <DealCard deal={deal} key={deal.id}/>)}</div>
        </section>
      )}
    </main>
  );
}
