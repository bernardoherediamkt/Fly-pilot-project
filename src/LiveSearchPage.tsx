import { useState } from 'react';
import { ArrowLeft, CalendarDays, Plane, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { searchLiveFlights, type LiveFlightOffer } from './services/liveFlights';
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

export function LiveSearchPage() {
  const [origin, setOrigin] = useState('GIG');
  const [destination, setDestination] = useState('SCL');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [nonStop, setNonStop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offers, setOffers] = useState<LiveFlightOffer[]>([]);
  const [meta, setMeta] = useState<{ live: boolean; note: string; fetchedAt: string } | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setOffers([]);
    if (!departureDate) {
      setError('Escolha a data de ida para fazer uma busca real.');
      return;
    }
    setLoading(true);
    try {
      const result = await searchLiveFlights({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        nonStop,
      });
      setOffers(result.offers);
      setMeta({ live: result.meta.live, note: result.meta.note, fetchedAt: result.meta.fetchedAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao consultar as tarifas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="live-page">
      <header className="live-topbar">
        <a href="/" className="back-link"><ArrowLeft size={17} /> Dashboard</a>
        <div className="live-brand"><Plane size={22} /> FlyPilot <span>LIVE</span></div>
      </header>

      <section className="live-hero">
        <div>
          <span className="live-eyeline"><Sparkles size={14} /> FLYPILOT v0.4</span>
          <h1>Busca real de tarifas.</h1>
          <p>Consulte preços de voo via provedor conectado e compare resultados normalizados pelo FlyPilot.</p>
        </div>
        <div className="live-trust"><ShieldCheck size={20} /><span>Chaves protegidas na Vercel<br/><strong>Nunca expostas no navegador</strong></span></div>
      </section>

      <form className="live-search-box" onSubmit={handleSearch}>
        <label><span>Origem</span><input value={origin} maxLength={3} onChange={(e) => setOrigin(e.target.value.toUpperCase())} placeholder="GIG" /></label>
        <label><span>Destino</span><input value={destination} maxLength={3} onChange={(e) => setDestination(e.target.value.toUpperCase())} placeholder="SCL" /></label>
        <label><span>Ida</span><div className="date-input"><CalendarDays size={16}/><input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} /></div></label>
        <label><span>Volta</span><div className="date-input"><CalendarDays size={16}/><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} /></div></label>
        <label className="nonstop"><input type="checkbox" checked={nonStop} onChange={(e) => setNonStop(e.target.checked)} /><span>Somente voos diretos</span></label>
        <button className="live-search-button" disabled={loading}><Search size={18} /> {loading ? 'Consultando...' : 'Buscar ao vivo'}</button>
      </form>

      {error && <div className="live-error"><strong>Busca ainda não disponível</strong><span>{error}</span></div>}

      {meta && (
        <div className={`live-status ${meta.live ? 'is-live' : 'is-test'}`}>
          <span>{meta.live ? 'DADOS AO VIVO' : 'AMBIENTE DE TESTE'}</span>
          <p>{meta.note}</p>
          <small>Atualizado em {new Date(meta.fetchedAt).toLocaleString('pt-BR')}</small>
        </div>
      )}

      {offers.length > 0 && (
        <section className="live-results">
          <div className="results-head"><div><h2>{origin} → {destination}</h2><p>{offers.length} ofertas retornadas pelo provedor.</p></div><span>Ordenado por menor preço</span></div>
          <div className="live-offer-list">
            {offers.map((offer, index) => (
              <article className="live-offer" key={offer.id}>
                <div className="rank">#{index + 1}</div>
                <div className="carrier"><strong>{offer.airline || offer.airlineCode}</strong><span>{offer.flightNumbers.join(' · ')}</span></div>
                <div className="route-time"><strong>{offer.origin} → {offer.destination}</strong><span>{offer.departureAt ? new Date(offer.departureAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</span></div>
                <div className="metric"><span>Duração</span><strong>{durationLabel(offer.durationOutboundMinutes)}</strong></div>
                <div className="metric"><span>Escalas</span><strong>{offer.stopsOutbound === 0 ? 'Direto' : offer.stopsOutbound}</strong></div>
                <div className="metric score-metric"><span>FlyScore</span><strong>{offer.flyScore}/100</strong></div>
                <div className="price-block"><span>{offer.providerLabel}</span><strong>{money(offer.price, offer.currency)}</strong>{offer.referencePrice && <small>mediana {money(offer.referencePrice, offer.currency)}</small>}</div>
              </article>
            ))}
          </div>
          <div className="redirect-note"><strong>Próxima camada:</strong> quando conectarmos um provider com deeplink autorizado, cada oferta ganhará o botão “Ir para oferta” e abrirá o site oficial/OTA responsável pelo preço.</div>
        </section>
      )}
    </main>
  );
}
