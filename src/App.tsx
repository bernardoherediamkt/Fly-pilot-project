import { useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  Heart,
  Home,
  Menu,
  Plane,
  Search,
  Settings,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  X,
} from 'lucide-react';
import { mockDeals } from './data/mockDeals';

type Section = 'dashboard' | 'radar' | 'search' | 'alerts';

type AlertItem = {
  id: number;
  route: string;
  label: string;
  ceiling: number;
  active: boolean;
};

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
];

const suggestions = [
  'Praias em novembro até R$ 1.500',
  'Europa em janeiro',
  'Feriado de 7 de setembro',
  'Estados Unidos até R$ 2.000',
];

function savings(price: number, referencePrice: number) {
  return Math.round(((referencePrice - price) / referencePrice) * 100);
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Imperdível';
  if (score >= 85) return 'Excelente';
  return 'Muito boa';
}

export function App() {
  const [section, setSection] = useState<Section>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 1, route: 'GIG → ORL', label: 'Rio de Janeiro → Orlando', ceiling: 2200, active: true },
    { id: 2, route: 'GRU → LIS', label: 'São Paulo → Lisboa', ceiling: 2500, active: true },
    { id: 3, route: 'CNF → MIA', label: 'Belo Horizonte → Miami', ceiling: 1800, active: true },
  ]);

  const featuredDeals = useMemo(() => mockDeals.slice(0, 3), []);

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
    setSection('search');
    setMenuOpen(false);
  }

  function toggleFavorite(id: string) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAlert(id: number) {
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, active: !alert.active } : alert)),
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <Plane size={25} strokeWidth={2.4} />
          <strong>FlyPilot</strong>
          <button className="icon-button sidebar__close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${section === item.id ? 'nav-item--active' : ''}`}
                onClick={() => goTo(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button className="nav-item" onClick={() => setFavorites([])}>
            <Heart size={19} />
            <span>Favoritos</span>
          </button>
          <button className="nav-item">
            <Clock3 size={19} />
            <span>Histórico</span>
          </button>
          <button className="nav-item">
            <Settings size={19} />
            <span>Configurações</span>
          </button>
        </nav>

        <div className="premium-card">
          <div className="premium-card__title"><Sparkles size={17} /> Plano Premium</div>
          <p>Alertas ilimitados, filtros avançados e inteligência de preço.</p>
          <button>Conhecer planos</button>
        </div>

        <div className="profile-card">
          <div className="avatar">FP</div>
          <div>
            <strong>Conta FlyPilot</strong>
            <span>Plano demonstração</span>
          </div>
          <ChevronRight size={18} />
        </div>
      </aside>

      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <Menu size={22} />
          </button>
          <div className="topbar__brand-mobile"><Plane size={20} /> FlyPilot</div>
          <div className="topbar__actions">
            <button className="icon-button" aria-label="Notificações"><Bell size={19} /></button>
            <div className="avatar avatar--small">FP</div>
          </div>
        </header>

        {section === 'dashboard' && (
          <div className="page">
            <div className="page-heading page-heading--actions">
              <div>
                <h1>Olá, viajante.</h1>
                <p>Encontramos oportunidades que merecem sua atenção hoje.</p>
              </div>
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
                  {featuredDeals.map((deal, index) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      index={index}
                      favorite={favorites.includes(deal.id)}
                      onFavorite={() => toggleFavorite(deal.id)}
                    />
                  ))}
                </div>
              </section>

              <section className="panel">
                <PanelHeader title="Radar de Ofertas" action="Ver todas" onClick={() => goTo('radar')} />
                <div className="radar-list">
                  {mockDeals.map((deal) => (
                    <div className="radar-row" key={deal.id}>
                      <div className="route-icon"><Plane size={16} /></div>
                      <div className="radar-route">
                        <strong>{deal.origin} → {deal.destination}</strong>
                        <span>{deal.destinationName}</span>
                      </div>
                      <div className="radar-price"><strong>{money.format(deal.price)}</strong><span>{money.format(deal.referencePrice)}</span></div>
                      <div className="savings">{savings(deal.price, deal.referencePrice)}%</div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel panel--wide">
                <div className="section-title-row">
                  <div>
                    <div className="section-title"><span>Busca Inteligente</span><span className="ai-tag"><Sparkles size={13} /> IA</span></div>
                    <p>Descreva sua viagem em linguagem natural.</p>
                  </div>
                </div>
                <SearchComposer query={query} setQuery={setQuery} onSearch={runSearch} />
                <div className="suggestions">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion} onClick={() => runSearch(suggestion)}>{suggestion}</button>
                  ))}
                </div>
              </section>

              <section className="panel">
                <PanelHeader title="Meus Alertas" action="Gerenciar" onClick={() => goTo('alerts')} />
                <AlertList alerts={alerts} onToggle={toggleAlert} compact />
              </section>
            </div>
          </div>
        )}

        {section === 'radar' && (
          <div className="page">
            <div className="page-heading">
              <span className="eyeline">RADAR 24/7</span>
              <h1>Radar de Ofertas</h1>
              <p>Oportunidades priorizadas pelo FlyScore, economia e recência.</p>
            </div>
            <div className="filter-bar">
              <button className="filter-chip filter-chip--active">Todas</button>
              <button className="filter-chip">Nacionais</button>
              <button className="filter-chip">Internacionais</button>
              <button className="filter-chip">Sem escalas</button>
            </div>
            <section className="radar-board">
              {mockDeals.map((deal, index) => (
                <article className="radar-deal" key={deal.id}>
                  <div className={`destination-block destination-block--${index + 1}`}>
                    <span>{deal.destination}</span>
                    <strong>{deal.destinationName}</strong>
                  </div>
                  <div className="radar-deal__route"><span>{deal.origin}</span><Plane size={17} /><span>{deal.destination}</span></div>
                  <div>
                    <span className="metric-label">Preço atual</span>
                    <div className="big-price">{money.format(deal.price)}</div>
                    <span className="reference-price">média {money.format(deal.referencePrice)}</span>
                  </div>
                  <div>
                    <span className="metric-label">Economia</span>
                    <div className="radar-highlight">{savings(deal.price, deal.referencePrice)}%</div>
                    <span className="reference-price">abaixo da média</span>
                  </div>
                  <div>
                    <span className="metric-label">FlyScore</span>
                    <div className="score"><strong>{deal.flyScore}</strong>/100</div>
                    <span className="score-badge">{scoreLabel(deal.flyScore)}</span>
                  </div>
                  <button className="outline-button">Ver oportunidade</button>
                </article>
              ))}
            </section>
          </div>
        )}

        {section === 'search' && (
          <div className="page page--narrow">
            <div className="page-heading">
              <span className="eyeline">FLYPILOT AI</span>
              <h1>Para onde você quer ir?</h1>
              <p>Escreva do seu jeito. Você pode combinar origem, destino, datas, orçamento e flexibilidade.</p>
            </div>
            <section className="search-hero">
              <SearchComposer query={query} setQuery={setQuery} onSearch={runSearch} large />
              <div className="suggestions suggestions--centered">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => runSearch(suggestion)}>{suggestion}</button>
                ))}
              </div>
            </section>

            {searchedQuery && (
              <section className="search-results">
                <div className="assistant-note">
                  <div className="assistant-note__icon"><Sparkles size={19} /></div>
                  <div>
                    <strong>Entendi sua busca</strong>
                    <p>“{searchedQuery}”</p>
                    <span>Encontrei 3 oportunidades simuladas que combinam preço e flexibilidade. Na próxima fase, esses resultados virão das APIs de tarifas.</span>
                  </div>
                </div>
                <div className="deal-cards deal-cards--results">
                  {mockDeals.map((deal, index) => (
                    <DealCard key={deal.id} deal={deal} index={index} favorite={favorites.includes(deal.id)} onFavorite={() => toggleFavorite(deal.id)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {section === 'alerts' && (
          <div className="page page--narrow">
            <div className="page-heading page-heading--actions">
              <div>
                <span className="eyeline">MONITORAMENTO</span>
                <h1>Meus Alertas</h1>
                <p>Defina o preço que você aceita pagar e deixe o FlyPilot acompanhar.</p>
              </div>
              <button className="primary-button"><Bell size={17} /> Novo alerta</button>
            </div>
            <section className="panel alerts-panel">
              <AlertList alerts={alerts} onToggle={toggleAlert} />
            </section>
            <section className="how-it-works">
              <Sparkles size={22} />
              <div>
                <strong>Como o alerta inteligente vai funcionar</strong>
                <p>O FlyPilot acompanhará a rota, recalculará o FlyScore e avisará quando o preço entrar na faixa definida por você.</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, note, tone }: { icon: React.ReactNode; label: string; value: string; note: string; tone: string }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
    </article>
  );
}

function PanelHeader({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      <button onClick={onClick}>{action} <ChevronRight size={15} /></button>
    </div>
  );
}

function DealCard({ deal, index, favorite, onFavorite }: { deal: (typeof mockDeals)[number]; index: number; favorite: boolean; onFavorite: () => void }) {
  const discount = savings(deal.price, deal.referencePrice);
  return (
    <article className="deal-card">
      <div className={`deal-card__visual deal-card__visual--${index + 1}`}>
        <span className="score-badge score-badge--visual">{scoreLabel(deal.flyScore)}</span>
        <div><span>{deal.destination}</span><strong>{deal.destinationName}</strong></div>
      </div>
      <div className="deal-card__body">
        <div className="deal-card__route"><strong>{deal.origin} → {deal.destination}</strong><span>{deal.travelWindow}</span></div>
        <div className="deal-card__price-row"><strong>{money.format(deal.price)}</strong><span>{discount}% OFF</span></div>
        <div className="deal-card__average">Preço médio: {money.format(deal.referencePrice)}</div>
        <div className="deal-card__footer">
          <button className={`heart-button ${favorite ? 'heart-button--active' : ''}`} onClick={onFavorite} aria-label="Favoritar oportunidade"><Heart size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
          <button className="outline-button">Ver detalhes</button>
        </div>
      </div>
    </article>
  );
}

function SearchComposer({ query, setQuery, onSearch, large = false }: { query: string; setQuery: (value: string) => void; onSearch: (text?: string) => void; large?: boolean }) {
  return (
    <div className={`search-composer ${large ? 'search-composer--large' : ''}`}>
      <Search size={large ? 22 : 19} />
      <textarea
        rows={large ? 3 : 1}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ex: Quero sair do Rio em outubro e viajar para a América do Sul gastando até R$ 1.500."
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSearch();
          }
        }}
      />
      <button onClick={() => onSearch()} aria-label="Buscar"><Plane size={18} /></button>
    </div>
  );
}

function AlertList({ alerts, onToggle, compact = false }: { alerts: AlertItem[]; onToggle: (id: number) => void; compact?: boolean }) {
  return (
    <div className={`alerts-list ${compact ? 'alerts-list--compact' : ''}`}>
      {alerts.map((alert) => (
        <div className="alert-row" key={alert.id}>
          <div><strong>{alert.route}</strong><span>{alert.label}</span></div>
          <div className="alert-ceiling"><span>Teto</span><strong>{money.format(alert.ceiling)}</strong></div>
          <button className={`toggle ${alert.active ? 'toggle--on' : ''}`} onClick={() => onToggle(alert.id)} aria-label={alert.active ? 'Desativar alerta' : 'Ativar alerta'}><span /></button>
        </div>
      ))}
    </div>
  );
}
