import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Gauge,
  Plane,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  getPriceInsights,
  searchLiveFlights,
  type LiveFlightOffer,
  type LiveSearchResponse,
  type PriceInsights,
} from './services/liveFlights';
import './v04-live.css';

const money = (value: number, currency = 'BRL') => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency,
  maximumFractionDigits: 0,
}).format(value);

function isoFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function durationLabel(minutes?: number | null) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m ? `${m}min` : ''}`.trim();
}

function dateTimeLabel(value: string | null | undefined) {
  if (!value) return 'Horário não informado';
  const parsed = new Date(value.includes('T') ? value : value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function priceLevelCopy(insights: PriceInsights | null) {
  const level = insights?.price_level;
  if (level === 'low') return { label: 'Preço baixo', className: 'price-low', message: 'Boa faixa de compra para esta rota.', icon: TrendingDown };
  if (level === 'high') return { label: 'Preço alto', className: 'price-high', message: 'A tarifa está acima do padrão observado. Vale monitorar.', icon: TrendingUp };
  return { label: 'Preço normal', className: 'price-typical', message: 'Tarifa dentro da faixa habitual da rota.', icon: Gauge };
}

function OfferRow({ offer, index }: { offer: LiveFlightOffer; index: number }) {
  const score = offer.metaFlyScore ?? offer.flyScore;
  const stops = offer.stops ?? offer.stopsOutbound ?? 0;
  const duration = offer.totalDurationMinutes ?? offer.durationOutboundMinutes;
  const externalUrl = offer.googleFlightsUrl || offer.bookingUrl;

  return (
    <article className={`live-offer ${index === 0 ? 'live-offer--best' : ''}`}>
      <div className="rank">#{index + 1}</div>
      <div className="carrier carrier--logo">
        {offer.airlineLogo ? <img src={offer.airlineLogo} alt="" /> : <div className="airline-fallback"><Plane size={16} /></div>}
        <div><strong>{offer.airline || offer.airlineCode || 'Companhia aérea'}</strong><span>{offer.flightNumbers?.join(' · ') || offer.providerLabel}</span></div>
      </div>
      <div className="route-time"><strong>{offer.origin} → {offer.destination}</strong><span>{dateTimeLabel(offer.departureAt)}</span></div>
      <div className="metric"><span>Duração</span><strong>{durationLabel(duration)}</strong></div>
      <div className="metric"><span>Escalas</span><strong>{stops === 0 ? 'Direto' : `${stops} ${stops === 1 ? 'escala' : 'escalas'}`}</strong></div>
      <div className="metric score-metric"><span>FlyScore</span><strong>{score}/100</strong></div>
      <div className="price-block"><span>{offer.providerLabel}</span><strong>{money(offer.price, offer.currency)}</strong>{offer.referencePrice ? <small>referência {money(offer.referencePrice, offer.currency)}</small> : null}</div>
      <div className="offer-action">
        {externalUrl ? <a href={externalUrl} target="_blank" rel="noreferrer">Ver oferta <ExternalLink size={14} /></a> : <span>Link em preparação</span>}
      </div>
    </article>
  );
}

export function LiveSearchPage() {
  const [origin, setOrigin] = useState('GIG');
  const [destination, setDestination] = useState('SCL');
  const [departureDate, setDepartureDate] = useState(() => isoFromNow(30));
  const [returnDate, setReturnDate] = useState(() => isoFromNow(37));
  const [nonStop, setNonStop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LiveSearchResponse | null>(null);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!departureDate) {
      setError('Escolha a data de ida para fazer uma busca real.');
      return;
    }
    setLoading(true);
    try {
      const response = await searchLiveFlights({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        nonStop,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao consultar as tarifas.');
    } finally {
      setLoading(false);
    }
  }

  const offers = result?.offers ?? [];
  const insights = result ? getPriceInsights(result) : null;
  const priceState = priceLevelCopy(insights);
  const PriceIcon = priceState.icon;
  const typicalRange = insights?.typical_price_range;

  return (
    <main className="live-page">
      <header className="live-topbar">
        <a href="/" className="back-link"><ArrowLeft size={17} /> Dashboard</a>
        <nav className="live-mini-nav"><a href="/radar-live"><Radar size={16} /> Radar ao vivo</a></nav>
        <div className="live-brand"><Plane size={22} /> FlyPilot <span>LIVE</span></div>
      </header>

      <section className="live-hero">
        <div>
          <span className="live-eyeline"><Sparkles size={14} /> FLYPILOT REAL DATA</span>
          <h1>Encontre a melhor tarifa.</h1>
          <p>O FlyPilot consulta fontes conectadas, compara as opções e transforma preço bruto em uma decisão mais simples.</p>
        </div>
        <div className="live-trust"><ShieldCheck size={20} /><span>Consulta protegida no servidor<br/><strong>SerpApi / Google Flights ativa</strong></span></div>
      </section>

      <form className="live-search-box" onSubmit={handleSearch}>
        <label><span>Origem</span><input value={origin} maxLength={3} onChange={(e) => setOrigin(e.target.value.toUpperCase())} placeholder="GIG" /></label>
        <label><span>Destino</span><input value={destination} maxLength={3} onChange={(e) => setDestination(e.target.value.toUpperCase())} placeholder="SCL" /></label>
        <label><span>Ida</span><div className="date-input"><CalendarDays size={16}/><input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} /></div></label>
        <label><span>Volta</span><div className="date-input"><CalendarDays size={16}/><input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} /></div></label>
        <label className="nonstop"><input type="checkbox" checked={nonStop} onChange={(e) => setNonStop(e.target.checked)} /><span>Somente diretos</span></label>
        <button className="live-search-button" disabled={loading}><Search size={18} /> {loading ? 'Consultando fontes...' : 'Buscar agora'}</button>
      </form>

      {error && <div className="live-error"><strong>Não conseguimos concluir a busca</strong><span>{error}</span></div>}

      {result && (
        <>
          <div className="live-status is-live">
            <span>DADOS REAIS</span>
            <p>{result.meta.disclaimer} · {result.meta.successfulProviders.length} fonte(s) respondendo.</p>
            <small>Atualizado em {new Date(result.meta.fetchedAt).toLocaleString('pt-BR')}</small>
          </div>

          <section className="insight-strip">
            <div className={`price-insight ${priceState.className}`}><PriceIcon size={21}/><div><span>Momento da tarifa</span><strong>{priceState.label}</strong><small>{priceState.message}</small></div></div>
            <div className="insight-stat"><span>Menor encontrado</span><strong>{offers[0] ? money(offers[0].price, offers[0].currency) : '—'}</strong><small>entre as fontes consultadas</small></div>
            <div className="insight-stat"><span>Faixa típica</span><strong>{typicalRange ? `${money(typicalRange[0])} – ${money(typicalRange[1])}` : 'Calculando'}</strong><small>histórico retornado pela fonte</small></div>
            <div className="insight-stat"><span>Cobertura agora</span><strong>{result.meta.coverage} provider(s)</strong><small>{result.meta.failedProviders.length ? `${result.meta.failedProviders.length} com falha` : 'consulta concluída'}</small></div>
          </section>
        </>
      )}

      {result && offers.length === 0 && <div className="live-empty">Nenhuma tarifa foi retornada para esses parâmetros. Tente outras datas ou remova o filtro de voo direto.</div>}

      {offers.length > 0 && (
        <section className="live-results">
          <div className="results-head"><div><h2>{origin} → {destination}</h2><p>{offers.length} ofertas reais encontradas e ordenadas por menor preço.</p></div><span>Melhor preço primeiro</span></div>
          <div className="live-offer-list">
            {offers.slice(0, 15).map((offer, index) => <OfferRow offer={offer} index={index} key={`${offer.id}:${index}`} />)}
          </div>
          <div className="redirect-note"><strong>Como o FlyPilot funciona:</strong> nós encontramos e classificamos a oportunidade. A compra continua fora do FlyPilot, no Google Flights, companhia aérea ou parceiro responsável pela oferta.</div>
        </section>
      )}
    </main>
  );
}
