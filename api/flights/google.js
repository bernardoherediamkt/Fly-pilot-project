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

function normalizeFlight(item, bucket, referencePrice, priceInsights, googleFlightsUrl) {
  const segments = item.flights || [];
  const first = segments[0] || {};
  const last = segments[segments.length - 1] || {};
  const price = Number(item.price || 0);
  const layovers = item.layovers || [];
  const stops = layovers.length;
  const typicalRange = priceInsights?.typical_price_range || [];
  const historicalReference = typicalRange.length === 2
    ? Math.round((Number(typicalRange[0]) + Number(typicalRange[1])) / 2)
    : referencePrice;
  const savings = historicalReference > 0
    ? Math.round(((historicalReference - price) / historicalReference) * 100)
    : 0;
  const directBonus = stops === 0 ? 8 : stops === 1 ? 3 : 0;
  const priceBonus = Math.max(-15, Math.min(25, savings * 0.45));
  const flyScore = Math.max(50, Math.min(99, Math.round(74 + directBonus + priceBonus)));

  return {
    id: `google:${item.booking_token || item.departure_token || `${first?.departure_airport?.id}-${last?.arrival_airport?.id}-${price}`}`,
    provider: 'google-flights-serpapi',
    providerLabel: 'Google Flights',
    source: 'SerpApi',
    live: true,
    bucket,
    origin: first?.departure_airport?.id || '',
    destination: last?.arrival_airport?.id || '',
    departureAt: first?.departure_airport?.time || null,
    arrivalAt: last?.arrival_airport?.time || null,
    airline: first?.airline || 'Companhia aérea',
    airlineLogo: item.airline_logo || first?.airline_logo || null,
    flightNumbers: segments.map((segment) => segment.flight_number).filter(Boolean),
    travelClass: first?.travel_class || null,
    price,
    currency: 'BRL',
    referencePrice: historicalReference || referencePrice || null,
    savingsVsReference: savings,
    flyScore,
    stops,
    totalDurationMinutes: item.total_duration ?? null,
    layovers,
    emissions: item.carbon_emissions || null,
    bookingToken: item.booking_token || null,
    departureToken: item.departure_token || null,
    googleFlightsUrl: googleFlightsUrl || null,
    bookingType: item.booking_token ? 'booking-options-available' : 'google-flights-redirect',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return send(res, 503, {
      error: 'PROVIDER_NOT_CONFIGURED',
      provider: 'google-flights-serpapi',
      message: 'Configure SERPAPI_KEY na Vercel.',
    });
  }

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

  try {
    const params = new URLSearchParams({
      engine: 'google_flights',
      departure_id: String(origin).toUpperCase(),
      arrival_id: String(destination).toUpperCase(),
      outbound_date: String(departureDate),
      adults: String(adults),
      currency: String(currency).toUpperCase(),
      hl: 'pt',
      gl: 'br',
      type: returnDate ? '1' : '2',
      sort_by: '2',
      api_key: apiKey,
    });

    if (returnDate) params.set('return_date', String(returnDate));
    if (String(nonStop) === 'true') params.set('stops', '1');
    if (String(deepSearch) === 'true') params.set('deep_search', 'true');

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok || payload?.error) {
      return send(res, response.ok ? 502 : response.status, {
        error: 'PROVIDER_ERROR',
        provider: 'google-flights-serpapi',
        details: payload?.error || payload,
      });
    }

    const raw = [
      ...(payload.best_flights || []).map((item) => ({ item, bucket: 'best' })),
      ...(payload.other_flights || []).map((item) => ({ item, bucket: 'other' })),
    ];
    const prices = raw.map(({ item }) => Number(item.price || 0)).filter(Boolean);
    const referencePrice = median(prices);
    const googleFlightsUrl = payload?.search_metadata?.google_flights_url || null;
    const offers = raw
      .map(({ item, bucket }) => normalizeFlight(item, bucket, referencePrice, payload.price_insights, googleFlightsUrl))
      .filter((offer) => offer.price > 0)
      .sort((a, b) => a.price - b.price);

    return send(res, 200, {
      meta: {
        provider: 'google-flights-serpapi',
        live: true,
        fetchedAt: new Date().toISOString(),
        count: offers.length,
        sourceStatus: payload?.search_metadata?.status || null,
        searchId: payload?.search_metadata?.id || null,
      },
      priceInsights: payload.price_insights || null,
      offers,
    });
  } catch (error) {
    return send(res, 500, {
      error: 'SEARCH_FAILED',
      provider: 'google-flights-serpapi',
      message: error instanceof Error ? error.message : 'Erro inesperado na busca.',
    });
  }
}
