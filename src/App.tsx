import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  Heart,
  Home,
  MapPin,
  Menu,
  Pencil,
  Plane,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react';
import { mockDeals, type MockDeal } from './data/mockDeals';
import './v03.css';

type Section = 'dashboard' | 'radar' | 'search' | 'alerts' | 'favorites' | 'history' | 'settings';
type RadarFilter = 'all' | 'national' | 'international' | 'nonstop';

type AlertItem = {
  id: number;
  origin: string;
  destination: string;
  label: string;
  ceiling: number;
  active: boolean;
};

type AlertDraft = {
  origin: string;
  destination: string;
  ceiling: string;
};

const defaultAlerts: AlertItem[] = [
  { id: 1, origin: 'GIG', destination: 'MIA', label: 'Rio de Janeiro → Miami', ceiling: 2200, active: true },
  { id: 2, origin: 'GRU', destination: 'LIS', label: 'São Paulo → Lisboa', ceiling: 2500, active: true },
  { id: 3, origin: 'CNF', destination: 'MIA', label: 'Belo Horizonte → Miami', ceiling: 1800, active: true },
];

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const navigation = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: Home },
  { id: 'radar' as const, label: 'Radar de Ofertas', icon: Compass },
  { id: 'search' as const, label: 'Busca Inteligente', icon: Bot },
  { id: 'alerts' as const, label: 'Meus Alertas', icon: Bell },
  { id: 'favorites' as const, label: 'Favoritos', icon: Heart },
  { id: 'history' as const, label: 'Histórico', icon: Clock3 },
  { id: 'settings' as const, label: 'Configurações', icon: Settings },
];

const suggestions = [
  'Praias em novembro até R$ 1.500',
  'Europa em janeiro',
  'América do Sul saindo do Rio até R$ 1.500',
  'Estados Unidos até R$ 2.000',
];

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function savings(price: number, referencePrice: number) {
  return Math.round(((referencePrice - price) / referencePrice) * 100);
}

function scoreLabel(score: number) {
  if (score >= 93) return 'Imperdível';
  if (score >= 88) return 'Excelente';
  return 'Muito boa';
}

function intelligentResults(text: string) {
  const normalized = text.toLowerCase();
  let deals = [...mockDeals];

  if (normalized.includes('rio')) deals = deals.filter((deal) => ['GIG', 'SDU'].includes(deal.origin));
  if (normalized.includes('são paulo') || normalized.includes('sao paulo')) deals = deals.filter((deal) => deal.origin === 'GRU');
  if (normalized.includes('brasília') || normalized.includes('brasilia')) deals = deals.filter((deal) => deal.origin === 'BSB');

  if (normalized.includes('américa do sul') || normalized.includes('america do sul')) {
    deals = deals.filter((deal) => ['SCL', 'EZE', 'LIM'].includes(deal.destination));
  }
  if (normalized.includes('europa') || normalized.includes('lisboa')) deals = deals.filter((deal) => deal.destination === 'LIS');
  if (normalized.includes('estados unidos') || normalized.includes('eua') || normalized.includes('miami')) {
    deals = deals.filter((deal) => deal.destination === 'MIA');
  }
  if (normalized.includes('praia') || normalized.includes('praias')) {
    deals = deals.filter((deal) => ['SSA', 'REC', 'FOR'].includes(deal.destination));
  }

  const numbers = [...normalized.replace(/\./g, '').matchAll(/\d+/g)]
    .map((match) => Number(match[0]))
    .filter((value) => value >= 300);
  if (numbers.length) {
    const budget = Math.max(...numbers);
    deals = deals.filter((deal) => deal.price <= budget);
  }

  if (!deals.length) {
    return [...mockDeals].sort((a, b) => b.flyScore - a.flyScore).slice(0, 4);
  }
  return deals.sort((a, b) => b.flyScore - a.flyScore).slice(0, 6);
}

export function App() {
  const [section, setSection] = useState<Section>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [radarFilter, setRadarFilter] = useState<RadarFilter>('all');
  const [radarText, setRadarText] = useState('');
  const [maxPrice, setMaxPrice] = useState(3500);
  const [minScore, setMinScore] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(() => readStored('flypilot:favorites', []));
  const [alerts, setAlerts] = useState<AlertItem[]>(() => readStored('flypilot:alerts', defaultAlerts));
  const [history, setHistory] = useState<string[]>(() => readStored('flypilot:history', []));
  const [selectedDeal, setSelectedDeal] = useState<MockDeal | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<number | null>(null);
  const [alertDraft, setAlertDraft] = useState<AlertDraft>({ origin: 'GIG', destination: 'SCL', ceiling: '1200' });
  const [preferredOrigin, setPreferredOrigin] = useState('GIG');
  const [defaultBudget, setDefaultBudget] = useState('2000');

  useEffect(() => localStorage.setItem('flypilot:favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('flypilot:alerts', JSON.stringify(alerts)), [alerts]);
  useEffect(() => localStorage.setItem('flypilot:history', JSON.stringify(history)), [history]);

  const featuredDeals = useMemo(() => mockDeals.slice(0, 3), []);
  const searchResults = useMemo(() => searchedQuery ? intelligentResults(searchedQuery) : [], [searchedQuery]);
  const favoriteDeals = useMemo(() => mockDeals.filter((deal) => favorites.includes(deal.id)), [favorites]);
  const filteredDeals = useMemo(() => {
    const term = radarText.trim().toLowerCase();
    return mockDeals.filter((deal) => {
      if (radarFilter === 'national' && deal.routeType !== 'national') return false;
      if (radarFilter === 'international' && deal.routeType !== 'international') return false;
      if (radarFilter === 'nonstop' && deal.stops !== 0) return false;
      if (deal.price > maxPrice || deal.flyScore < minScore) return false;
      if (term && !`${deal.origin} ${deal.destination} ${deal.destinationName} ${deal.airline}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [radarFilter, radarText, maxPrice, minScore]);

  function goTo(next: Section) {
    setSection(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function runSearch(text = query) {
    const normalized = text.trim();
    if (!normalized) return;
    setQuery(normalized);
    setSearchedQuery(normalized);
    setHistory((current) => [normalized, ...current.filter((item) => item !== normalized)].slice(0, 12));
    setSection('search');
    setMenuOpen(false);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAlert(id: number) {
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, active: !alert.active } : alert));
  }

  function deleteAlert(id: number) {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }

  function openAlertForm(deal?: MockDeal, alert?: AlertItem) {
    if (alert) {
      setEditingAlertId(alert.id);
      setAlertDraft({ origin: alert.origin, destination: alert.destination, ceiling: String(alert.ceiling) });
    } else {
      setEditingAlertId(null);
      setAlertDraft({
        origin: deal?.origin ?? preferredOrigin,
        destination: deal?.destination ?? 'SCL',
        ceiling: String(deal ? Math.ceil(deal.price * 1.05) : Number(defaultBudget) || 1500),
      });
    }
    setAlertModalOpen(true);
  }

  function saveAlert() {
    const ceiling = Number(alertDraft.ceiling.replace(/\D/g, ''));
    if (!alertDraft.origin.trim() || !alertDraft.destination.trim() || !ceiling) return;
    const destinationName = mockDeals.find((deal) => deal.destination === alertDraft.destination.toUpperCase())?.destinationName ?? alertDraft.destination.toUpperCase();
    if (editingAlertId) {
      setAlerts((current) => current.map((alert) => alert.id === editingAlertId ? {
        ...alert,
        origin: alertDraft.origin.toUpperCase(),
        destination: alertDraft.destination.toUpperCase(),
        label: `${alertDraft.origin.toUpperCase()} → ${destinationName}`,
        ceiling,
      } : alert));
    } else {
      setAlerts((current) => [{
        id: Date.now(),
        origin: alertDraft.origin.toUpperCase(),
        destination: alertDraft.destination.toUpperCase(),
        label: `${alertDraft.origin.toUpperCase()} → ${destinationName}`,
        ceiling,
        active: true,
      }, ...current]);
    }
    setAlertModalOpen(false);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <Plane size={25} strokeWidth={2.4} />
          <strong>FlyPilot</strong>
          <button className="icon-button sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`nav-item ${section === item.id ? 'nav-item--active' : ''}`} onClick={() => goTo(item.id)}>
                <Icon size={19} /><span>{item.label}</span>
                {item.id === 'favorites' && favorites.length > 0 && <span className="nav-count">{favorites.length}</span>}
              </button>
            );
          })}
        </nav>

        <div className="premium-card">
          <div className="premium-card__title"><Sparkles size={17} /> Plano Premium</div>
          <p>Alertas ilimitados, filtros avançados e inteligência de preço.</p>
          <button>Conhecer planos</button>
        </div>

        <div className="profile-card">
          <div className="avatar">FP</div>
          <div><strong>Conta FlyPilot</strong><span>Plano demonstração</span></div>
          <ChevronRight size={18} />
        </div>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={22} /></button>
          <div className="topbar__brand-mobile"><Plane size={20} /> FlyPilot</div>
          <div className="topbar__actions"><button className="icon-button" aria-label="Notificações"><Bell size={19} /></button><div className="avatar avatar--small">FP</div></div>
        </header>

        {section === 'dashboard' && (
          <div className="page">
            <div className="page-heading page-heading--actions">
              <div><h1>Olá, viajante.</h1><p>Encontramos oportunidades que merecem sua atenção hoje.</p></div>
              <button className="primary-button" onClick={() => goTo('search')}><Plane size={17} /> Buscar passagem</button>
            </div>

            <section className="stats-grid" aria-label="Resumo do radar">
              <StatCard icon={<Target />} label="Ofertas encontradas hoje" value="128" note="+23 desde ontem" tone="blue" />
              <StatCard icon={<CircleDollarSign />} label="Economia potencial" value="R$ 4.735" note="comparado ao preço médio" tone="green" />
              <StatCard icon={<TrendingDown />} label="Melhor economia" value="42%" note="em uma rota monitorada" tone="purple" />
              <StatCard icon={<Star />} label="FlyScore médio" value="87/100" note="excelentes oportunidades" tone="amber" />
            </section>

            <div className="dashboard-grid">
              <section className="panel panel--wide">
                <PanelHeader title="Ofertas em destaque" action="Ver radar" onClick={() => goTo('radar')} />
                <div className="deal-cards">
                  {featuredDeals.map((deal, index) => <DealCard key={deal.id} deal={deal} index={index} favorite={favorites.includes(deal.id)} onFavorite={() => toggleFavorite(deal.id)} onDetails={() => setSelectedDeal(deal)} />)}
                </div>
              </section>

              <section className="panel">
                <PanelHeader title="Radar de Ofertas" action="Ver todas" onClick={() => goTo('radar')} />
                <div className="radar-list">
                  {mockDeals.slice(0, 5).map((deal) => (
                    <button className="radar-row radar-row--button" key={deal.id} onClick={() => setSelectedDeal(deal)}>
                      <div className="route-icon"><Plane size={16} /></div>
                      <div className="radar-route"><strong>{deal.origin} → {deal.destination}</strong><span>{deal.destinationName}</span></div>
                      <div className="radar-price"><strong>{money.format(deal.price)}</strong><span>{money.format(deal.referencePrice)}</span></div>
                      <div className="savings">{savings(deal.price, deal.referencePrice)}%</div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel panel--wide">
                <div className="section-title-row"><div><div className="section-title"><span>Busca Inteligente</span><span className="ai-tag"><Sparkles size={13} /> IA</span></div><p>Descreva sua viagem em linguagem natural.</p></div></div>
                <SearchComposer query={query} setQuery={setQuery} onSearch={runSearch} />
                <div className="suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => runSearch(suggestion)}>{suggestion}</button>)}</div>
              </section>

              <section className="panel">
                <PanelHeader title="Meus Alertas" action="Gerenciar" onClick={() => goTo('alerts')} />
                <AlertList alerts={alerts.slice(0, 3)} onToggle={toggleAlert} compact />
              </section>
            </div>
          </div>
        )}

        {section === 'radar' && (
          <div className="page">
            <div className="page-heading"><span className="eyeline">RADAR 24/7</span><h1>Radar de Ofertas</h1><p>Filtre oportunidades por rota, preço, perfil e FlyScore.</p></div>
            <section className="radar-controls panel">
              <div className="filter-bar">
                {([['all', 'Todas'], ['national', 'Nacionais'], ['international', 'Internacionais'], ['nonstop', 'Sem escalas']] as [RadarFilter, string][]).map(([id, label]) => (
                  <button key={id} className={`filter-chip ${radarFilter === id ? 'filter-chip--active' : ''}`} onClick={() => setRadarFilter(id)}>{label}</button>
                ))}
              </div>
              <div className="radar-fields">
                <label><span>Rota, destino ou companhia</span><div className="input-with-icon"><Search size={16} /><input value={radarText} onChange={(event) => setRadarText(event.target.value)} placeholder="Ex: GIG, Lisboa, LATAM" /></div></label>
                <label><span>Preço máximo</span><select value={maxPrice} onChange={(event) => setMaxPrice(Number(event.target.value))}><option value={700}>Até R$ 700</option><option value={1200}>Até R$ 1.200</option><option value={2000}>Até R$ 2.000</option><option value={3500}>Até R$ 3.500</option></select></label>
                <label><span>FlyScore mínimo</span><select value={minScore} onChange={(event) => setMinScore(Number(event.target.value))}><option value={0}>Qualquer score</option><option value={85}>85+</option><option value={90}>90+</option></select></label>
              </div>
              <div className="results-count"><SlidersHorizontal size={15} /> {filteredDeals.length} oportunidades correspondem aos filtros</div>
            </section>

            <section className="radar-board">
              {filteredDeals.map((deal, index) => (
                <article className="radar-deal" key={deal.id}>
                  <div className={`destination-block destination-block--${(index % 5) + 1}`}><span>{deal.destination}</span><strong>{deal.destinationName}</strong></div>
                  <div className="radar-deal__route"><span>{deal.origin}</span><Plane size={17} /><span>{deal.destination}</span></div>
                  <div><span className="metric-label">Preço atual</span><div className="big-price">{money.format(deal.price)}</div><span className="reference-price">média {money.format(deal.referencePrice)}</span></div>
                  <div><span className="metric-label">Economia</span><div className="radar-highlight">{savings(deal.price, deal.referencePrice)}%</div><span className="reference-price">abaixo da média</span></div>
                  <div><span className="metric-label">FlyScore</span><div className="score"><strong>{deal.flyScore}</strong>/100</div><span className="score-badge">{scoreLabel(deal.flyScore)}</span></div>
                  <button className="outline-button" onClick={() => setSelectedDeal(deal)}>Ver oportunidade</button>
                </article>
              ))}
              {!filteredDeals.length && <EmptyState title="Nenhuma oferta com esses filtros" text="Aumente o preço máximo ou reduza o FlyScore mínimo para ampliar o radar." />}
            </section>
          </div>
        )}

        {section === 'search' && (
          <div className="page page--narrow">
            <div className="page-heading"><span className="eyeline">FLYPILOT AI · SIMULAÇÃO</span><h1>Para onde você quer ir?</h1><p>Combine origem, destino, datas e orçamento em uma frase. Nesta fase o FlyPilot interpreta a intenção usando nossa base demonstrativa.</p></div>
            <section className="search-hero">
              <SearchComposer query={query} setQuery={setQuery} onSearch={runSearch} large />
              <div className="suggestions suggestions--centered">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => runSearch(suggestion)}>{suggestion}</button>)}</div>
            </section>

            {searchedQuery && (
              <section className="search-results">
                <div className="assistant-note"><div className="assistant-note__icon"><Sparkles size={19} /></div><div><strong>Entendi sua busca</strong><p>“{searchedQuery}”</p><span>Priorizei preço, rota, orçamento e FlyScore. Foram encontradas {searchResults.length} oportunidades demonstrativas.</span></div></div>
                <div className="deal-cards deal-cards--results">{searchResults.map((deal, index) => <DealCard key={deal.id} deal={deal} index={index} favorite={favorites.includes(deal.id)} onFavorite={() => toggleFavorite(deal.id)} onDetails={() => setSelectedDeal(deal)} />)}</div>
              </section>
            )}
          </div>
        )}

        {section === 'alerts' && (
          <div className="page page--narrow">
            <div className="page-heading page-heading--actions"><div><span className="eyeline">MONITORAMENTO</span><h1>Meus Alertas</h1><p>Defina o teto de preço e mantenha suas rotas organizadas.</p></div><button className="primary-button" onClick={() => openAlertForm()}><Bell size={17} /> Novo alerta</button></div>
            <section className="panel alerts-panel"><AlertList alerts={alerts} onToggle={toggleAlert} onEdit={(alert) => openAlertForm(undefined, alert)} onDelete={deleteAlert} /></section>
            <section className="how-it-works"><Sparkles size={22} /><div><strong>Protótipo funcional</strong><p>Os alertas criados aqui ficam salvos neste navegador. Na etapa com backend, o monitoramento passará a rodar 24/7 no servidor.</p></div></section>
          </div>
        )}

        {section === 'favorites' && (
          <div className="page page--narrow">
            <div className="page-heading"><span className="eyeline">SALVOS</span><h1>Favoritos</h1><p>Oportunidades que você separou para comparar depois.</p></div>
            {favoriteDeals.length ? <div className="deal-cards deal-cards--results">{favoriteDeals.map((deal, index) => <DealCard key={deal.id} deal={deal} index={index} favorite onFavorite={() => toggleFavorite(deal.id)} onDetails={() => setSelectedDeal(deal)} />)}</div> : <EmptyState title="Nenhum favorito ainda" text="Use o coração nos cards para montar sua lista de oportunidades." />}
          </div>
        )}

        {section === 'history' && (
          <div className="page page--narrow">
            <div className="page-heading"><span className="eyeline">SUAS BUSCAS</span><h1>Histórico</h1><p>Retome rapidamente as buscas feitas no FlyPilot.</p></div>
            <section className="panel history-list">{history.length ? history.map((item) => <button key={item} onClick={() => runSearch(item)}><Clock3 size={17} /><span>{item}</span><ChevronRight size={17} /></button>) : <EmptyState title="Histórico vazio" text="Suas buscas inteligentes aparecerão aqui." />}</section>
          </div>
        )}

        {section === 'settings' && (
          <div className="page page--narrow">
            <div className="page-heading"><span className="eyeline">PREFERÊNCIAS</span><h1>Configurações</h1><p>Essas preferências serão usadas futuramente para personalizar o radar.</p></div>
            <section className="panel settings-form">
              <label><span>Aeroporto de origem preferido</span><input value={preferredOrigin} onChange={(event) => setPreferredOrigin(event.target.value.toUpperCase())} maxLength={3} /></label>
              <label><span>Orçamento padrão por passagem</span><input value={defaultBudget} onChange={(event) => setDefaultBudget(event.target.value.replace(/\D/g, ''))} inputMode="numeric" /></label>
              <div className="setting-note"><MapPin size={18} /><span>Na versão conectada, essas preferências alimentarão recomendações automáticas e alertas personalizados.</span></div>
            </section>
          </div>
        )}
      </main>

      {selectedDeal && <DealModal deal={selectedDeal} favorite={favorites.includes(selectedDeal.id)} onClose={() => setSelectedDeal(null)} onFavorite={() => toggleFavorite(selectedDeal.id)} onAlert={() => { openAlertForm(selectedDeal); setSelectedDeal(null); }} />}
      {alertModalOpen && <AlertModal draft={alertDraft} setDraft={setAlertDraft} editing={editingAlertId !== null} onClose={() => setAlertModalOpen(false)} onSave={saveAlert} />}
    </div>
  );
}

function StatCard({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: string }) {
  return <article className={`stat-card stat-card--${tone}`}><div className="stat-card__icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>;
}

function PanelHeader({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return <div className="panel-header"><h2>{title}</h2><button onClick={onClick}>{action} <ChevronRight size={15} /></button></div>;
}

function DealCard({ deal, index, favorite, onFavorite, onDetails }: { deal: MockDeal; index: number; favorite: boolean; onFavorite: () => void; onDetails: () => void }) {
  const discount = savings(deal.price, deal.referencePrice);
  return (
    <article className="deal-card">
      <div className={`deal-card__visual deal-card__visual--${(index % 5) + 1}`}><span className="score-badge score-badge--visual">{scoreLabel(deal.flyScore)}</span><div><span>{deal.destination}</span><strong>{deal.destinationName}</strong></div></div>
      <div className="deal-card__body">
        <div className="deal-card__route"><strong>{deal.origin} → {deal.destination}</strong><span>{deal.travelWindow}</span></div>
        <div className="deal-card__price-row"><strong>{money.format(deal.price)}</strong><span>{discount}% OFF</span></div>
        <div className="deal-card__average">Preço médio: {money.format(deal.referencePrice)} · {deal.airline}</div>
        <div className="deal-card__footer"><button className={`heart-button ${favorite ? 'heart-button--active' : ''}`} onClick={onFavorite} aria-label="Favoritar oportunidade"><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button><button className="outline-button" onClick={onDetails}>Ver detalhes</button></div>
      </div>
    </article>
  );
}

function SearchComposer({ query, setQuery, onSearch, large = false }: { query: string; setQuery: (value: string) => void; onSearch: (text?: string) => void; large?: boolean }) {
  return (
    <div className={`search-composer ${large ? 'search-composer--large' : ''}`}>
      <Search size={large ? 22 : 19} />
      <textarea rows={large ? 3 : 1} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex: Quero sair do Rio em outubro e viajar para a América do Sul gastando até R$ 1.500." onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSearch(); } }} />
      <button onClick={() => onSearch()} aria-label="Buscar"><Plane size={18} /></button>
    </div>
  );
}

function AlertList({ alerts, onToggle, onEdit, onDelete, compact = false }: { alerts: AlertItem[]; onToggle: (id: number) => void; onEdit?: (alert: AlertItem) => void; onDelete?: (id: number) => void; compact?: boolean }) {
  return (
    <div className={`alerts-list ${compact ? 'alerts-list--compact' : ''}`}>
      {alerts.map((alert) => (
        <div className="alert-row" key={alert.id}>
          <div><strong>{alert.origin} → {alert.destination}</strong><span>{alert.label}</span></div>
          <div className="alert-ceiling"><span>Teto</span><strong>{money.format(alert.ceiling)}</strong></div>
          <button className={`toggle ${alert.active ? 'toggle--on' : ''}`} onClick={() => onToggle(alert.id)} aria-label={alert.active ? 'Desativar alerta' : 'Ativar alerta'}><span /></button>
          {!compact && <div className="alert-actions"><button onClick={() => onEdit?.(alert)} aria-label="Editar alerta"><Pencil size={15} /></button><button onClick={() => onDelete?.(alert.id)} aria-label="Excluir alerta"><Trash2 size={15} /></button></div>}
        </div>
      ))}
      {!alerts.length && <EmptyState title="Nenhum alerta criado" text="Crie seu primeiro alerta e defina o preço máximo que deseja pagar." />}
    </div>
  );
}

function DealModal({ deal, favorite, onClose, onFavorite, onAlert }: { deal: MockDeal; favorite: boolean; onClose: () => void; onFavorite: () => void; onAlert: () => void }) {
  const discount = savings(deal.price, deal.referencePrice);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="deal-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <button className="modal-back" onClick={onClose}><ArrowLeft size={17} /> Voltar</button>
        <div className="deal-modal__hero"><span className="score-badge score-badge--visual">{scoreLabel(deal.flyScore)}</span><div><span>{deal.destination}</span><h2>{deal.destinationName}</h2><p>{deal.origin} → {deal.destination} · {deal.travelWindow} · {deal.airline}</p></div></div>
        <div className="deal-modal__metrics">
          <div><span>Preço atual</span><strong className="green-text">{money.format(deal.price)}</strong></div>
          <div><span>Preço médio</span><strong>{money.format(deal.referencePrice)}</strong></div>
          <div><span>Economia</span><strong className="green-text">{discount}%</strong></div>
          <div><span>FlyScore</span><strong>{deal.flyScore}/100</strong></div>
        </div>
        <div className="flyscore-explanation"><Sparkles size={20} /><div><strong>Por que o FlyPilot considera essa oportunidade {scoreLabel(deal.flyScore).toLowerCase()}?</strong><p>O preço está {discount}% abaixo da referência simulada desta rota. O FlyScore combina desconto, número de escalas, recência da consulta e relação com o preço médio.</p></div></div>
        <div className="modal-actions"><button className={`outline-button ${favorite ? 'favorite-active' : ''}`} onClick={onFavorite}><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /> {favorite ? 'Salvo' : 'Favoritar'}</button><button className="primary-button" onClick={onAlert}><Bell size={17} /> Criar alerta</button></div>
        <p className="prototype-disclaimer">Valores demonstrativos nesta fase do protótipo. A etapa seguinte conectará o FlyPilot a fornecedores reais de tarifas.</p>
      </section>
    </div>
  );
}

function AlertModal({ draft, setDraft, editing, onClose, onSave }: { draft: AlertDraft; setDraft: (draft: AlertDraft) => void; editing: boolean; onClose: () => void; onSave: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="alert-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <div className="modal-heading"><Bell size={21} /><div><h2>{editing ? 'Editar alerta' : 'Novo alerta'}</h2><p>Defina a rota e o teto de preço.</p></div></div>
        <div className="alert-form-grid">
          <label><span>Origem</span><input value={draft.origin} maxLength={3} onChange={(event) => setDraft({ ...draft, origin: event.target.value.toUpperCase() })} placeholder="GIG" /></label>
          <label><span>Destino</span><input value={draft.destination} maxLength={3} onChange={(event) => setDraft({ ...draft, destination: event.target.value.toUpperCase() })} placeholder="SCL" /></label>
          <label className="full-field"><span>Teto de preço</span><div className="currency-input"><span>R$</span><input value={draft.ceiling} inputMode="numeric" onChange={(event) => setDraft({ ...draft, ceiling: event.target.value.replace(/\D/g, '') })} placeholder="1500" /></div></label>
        </div>
        <div className="modal-actions"><button className="outline-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={onSave}>{editing ? 'Salvar alterações' : 'Criar alerta'}</button></div>
      </section>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><Compass size={28} /><strong>{title}</strong><p>{text}</p></div>;
}
