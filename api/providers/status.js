export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const amadeusConfigured = Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  const amadeusMode = (process.env.AMADEUS_ENV || 'test').toLowerCase();
  const serpApiConfigured = Boolean(process.env.SERPAPI_KEY);
  const kayakConfigured = Boolean(process.env.KAYAK_API_KEY);
  const skyscannerConfigured = Boolean(process.env.SKYSCANNER_API_KEY);
  const ndcIds = String(process.env.NDC_PROVIDERS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const ndcProviders = ndcIds.map((id) => {
    const prefix = `NDC_${id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_`;
    const endpoint = process.env[`${prefix}ENDPOINT`];
    const airlineCode = process.env[`${prefix}AIRLINE_CODE`] || id.toUpperCase();
    const version = process.env[`${prefix}VERSION`] || '21.3';
    return {
      id: `ndc-${id}`,
      airlineCode,
      version,
      configured: Boolean(endpoint),
      live: Boolean(endpoint),
    };
  });

  res.status(200).json({
    providers: [
      {
        id: 'google-flights-serpapi',
        label: 'Google Flights via SerpApi',
        configured: serpApiConfigured,
        mode: serpApiConfigured ? 'live-third-party' : 'needs-serpapi-key',
        live: serpApiConfigured,
        role: 'price-booking-options-deals',
        env: ['SERPAPI_KEY'],
      },
      {
        id: 'ndc-direct',
        label: 'Companhias aéreas via IATA NDC',
        configured: ndcProviders.some((item) => item.configured),
        mode: ndcProviders.length ? 'direct-airline-ndc' : 'awaiting-airline-endpoint',
        live: ndcProviders.some((item) => item.live),
        role: 'official-direct-airline-shopping',
        configuredCount: ndcProviders.filter((item) => item.configured).length,
        airlines: ndcProviders,
        env: ['NDC_PROVIDERS', 'NDC_<ID>_ENDPOINT', 'NDC_<ID>_VERSION', 'NDC_<ID>_AIRLINE_CODE'],
      },
      {
        id: 'amadeus',
        label: 'Amadeus',
        configured: amadeusConfigured,
        mode: amadeusMode,
        live: amadeusConfigured && amadeusMode === 'production',
        role: 'pricing-source',
        env: ['AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET', 'AMADEUS_ENV'],
      },
      {
        id: 'kayak',
        label: 'KAYAK Flights API',
        configured: kayakConfigured,
        mode: kayakConfigured ? 'partner-api' : 'pending-partnership',
        live: kayakConfigured,
        role: 'multi-provider-price-and-referral-source',
        env: ['KAYAK_API_KEY'],
      },
      {
        id: 'skyscanner',
        label: 'Skyscanner Flights Live Prices',
        configured: skyscannerConfigured,
        mode: skyscannerConfigured ? 'partner-api' : 'pending-partnership',
        live: skyscannerConfigured,
        role: 'price-and-referral-source',
        env: ['SKYSCANNER_API_KEY'],
      },
    ],
  });
}
