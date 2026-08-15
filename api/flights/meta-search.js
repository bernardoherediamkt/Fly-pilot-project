const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function send(res, status, body) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(JSON_HEADERS)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function requestBase(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers.host;
  return `${proto}://${host}`;
}

function hasNdcProviderConfigured() {
  const ids = String(process.env.NDC_PROVIDERS || '')
    .split(',')
    .map((item) => item.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'))
    .filter(Boolean);
  return ids.some((id) => Boolean(process.env[`NDC_${id}_ENDPOINT`]));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = '1',
    currency = 'BRL',
    nonStop = 'false',
    deepSearch = 'false',
  } = req.query || {};

  if (!origin || !destination || !departureDate) {
    return send(res, 400, {
      error: 'INVALID_SEARCH',
      message: 'origin, destination e departureDate são obrigatórios.',
    });
  }

  const configured = [];
  if (process.env.SERPAPI_KEY) configured.push('google-flights-serpapi');
  if (process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET) configured.push('amadeus');
  if (hasNdcProviderConfigured()) configured.push('ndc-direct');

  if (!configured.length) {
    return send(res, 503, {
      error: 'NO_PROVIDER_CONFIGURED',
      message: 'Configure SERPAPI_KEY, Amadeus e/ou um endpoint NDC direto na Vercel.',
    });
  }

  const params = new URLSearchParams({
    origin: String(origin),
    destination: String(destination),
    departureDate: String(departureDate),
    adults: String(adults),
    currency: String(currency),
    nonStop: String(nonStop),
  });
  if (returnDate) params.set('returnDate', String(returnDate));

  const base = requestBase(req);
  const jobs = [];

  if (configured.includes('google-flights-serpapi')) {
    const googleParams = new URLSearchParams(params);
    googleParams.set('deepSearch', String(deepSearch));
    jobs.push({
      id: 'google-flights-serpapi',
      url: `${base}/api/flights/google?${googleParams.toString()}`,
    });
  }

  if (configured.includes('amadeus')) {
    jobs.push({
      id: 'amadeus',
      url: `${base}/api/flights/search?${params.toString()}`,
    });
  }

  if (configured.includes('ndc-direct')) {
    jobs.push({
      id: 'ndc-direct',
      url: `${base}/api/flights/ndc-search?${params.toString()}`,
    });
  }

  const results = await Promise.allSettled(jobs.map(async (job) => {
    const response = await fetch(job.url, { headers: { 'x-flypilot-internal': '1' } });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(`${job.id}: ${payload?.message || payload?.error || response.status}`);
    }
    return { id: job.id, payload };
  }));

  const providerResults = [];
  const failures = [];
  const offers = [];

  results.forEach((result, index) => {
    const job = jobs[index];
    if (result.status === 'fulfilled') {
      providerResults.push({
        provider: result.value.id,
        meta: result.value.payload.meta || null,
        priceInsights: result.value.payload.priceInsights || null,
        providers: result.value.payload.providers || null,
      });
      for (const offer of result.value.payload.offers || []) {
        offers.push({ ...offer, sourceProvider: offer.sourceProvider || result.value.id });
      }
    } else {
      failures.push({ provider: job.id, message: result.reason?.message || 'Provider failed' });
    }
  });

  const validPrices = offers.map((offer) => Number(offer.price || 0)).filter((price) => price > 0);
  const crossSourceMedian = median(validPrices);
  const ranked = offers.map((offer) => {
    const price = Number(offer.price || 0);
    const savingsVsCrossSourceMedian = crossSourceMedian > 0
      ? Math.round(((crossSourceMedian - price) / crossSourceMedian) * 100)
      : 0;
    const baseScore = Number(offer.flyScore || 75);
    const directOfficialBonus = offer.officialDirect ? 3 : 0;
    const metaFlyScore = Math.max(45, Math.min(99, Math.round(
      baseScore + directOfficialBonus + Math.max(-8, Math.min(8, savingsVsCrossSourceMedian * 0.3)),
    )));
    return {
      ...offer,
      savingsVsCrossSourceMedian,
      metaFlyScore,
    };
  }).sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    if (Boolean(a.officialDirect) !== Boolean(b.officialDirect)) return a.officialDirect ? -1 : 1;
    return b.metaFlyScore - a.metaFlyScore;
  });

  if (!ranked.length && failures.length) {
    return send(res, 502, {
      error: 'ALL_PROVIDERS_FAILED',
      providers: providerResults,
      failures,
    });
  }

  return send(res, 200, {
    meta: {
      fetchedAt: new Date().toISOString(),
      configuredProviders: configured,
      successfulProviders: providerResults.map((item) => item.provider),
      failedProviders: failures.map((item) => item.provider),
      coverage: providerResults.length,
      crossSourceMedian: crossSourceMedian || null,
      disclaimer: 'Melhor oferta encontrada entre as fontes consultadas pelo FlyPilot. Ofertas NDC diretas são identificadas separadamente.',
    },
    providers: providerResults,
    failures,
    bestOffer: ranked[0] || null,
    bestOfficialDirect: ranked.find((offer) => offer.officialDirect) || null,
    offers: ranked,
  });
}
