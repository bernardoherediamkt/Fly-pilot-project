const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function send(res, status, body) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(JSON_HEADERS)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

function envConfig() {
  const mode = (process.env.AMADEUS_ENV || 'test').toLowerCase();
  const baseUrl = mode === 'production' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com';
  return {
    mode,
    baseUrl,
    clientId: process.env.AMADEUS_CLIENT_ID,
    clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  };
}

async function getToken(config) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const response = await fetch(`${config.baseUrl}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload?.error_description || payload?.error || 'Falha ao autenticar no Amadeus');
  }
  return payload.access_token;
}

function minutesFromDuration(duration = '') {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;
  return (Number(match[1] || 0) * 60) + Number(match[2] || 0);
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function normalizeOffers(data = [], dictionaries = {}) {
  const prices = data.map((offer) => Number(offer?.price?.grandTotal || offer?.price?.total || 0)).filter(Boolean);
  const reference = median(prices);

  return data.map((offer) => {
    const slices = offer.itineraries || [];
    const outbound = slices[0];
    const inbound = slices[1];
    const segments = slices.flatMap((slice) => slice.segments || []);
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const carrierCode = offer.validatingAirlineCodes?.[0] || firstSegment?.carrierCode || '';
    const carrierName = dictionaries?.carriers?.[carrierCode] || carrierCode;
    const price = Number(offer?.price?.grandTotal || offer?.price?.total || 0);
    const stopsOutbound = Math.max(0, (outbound?.segments?.length || 1) - 1);
    const stopsInbound = inbound ? Math.max(0, (inbound?.segments?.length || 1) - 1) : 0;
    const totalStops = stopsOutbound + stopsInbound;
    const priceAdvantage = reference > 0 ? Math.max(-30, Math.min(40, ((reference - price) / reference) * 100)) : 0;
    const directBonus = totalStops === 0 ? 8 : totalStops === 1 ? 3 : 0;
    const flyScore = Math.max(55, Math.min(99, Math.round(72 + priceAdvantage * 0.55 + directBonus)));

    return {
      id: `amadeus:${offer.id}`,
      provider: 'amadeus',
      providerLabel: 'Amadeus / GDS',
      live: true,
      origin: firstSegment?.departure?.iataCode || '',
      destination: lastSegment?.arrival?.iataCode || '',
      departureAt: firstSegment?.departure?.at || null,
      arrivalAt: lastSegment?.arrival?.at || null,
      returnDepartureAt: inbound?.segments?.[0]?.departure?.at || null,
      returnArrivalAt: inbound?.segments?.[inbound.segments.length - 1]?.arrival?.at || null,
      airlineCode: carrierCode,
      airline: carrierName,
      flightNumbers: segments.map((segment) => `${segment.carrierCode}${segment.number}`),
      price,
      currency: offer?.price?.currency || 'BRL',
      referencePrice: reference ? Math.round(reference * 100) / 100 : null,
      savingsVsSearchMedian: reference > 0 ? Math.round(((reference - price) / reference) * 100) : 0,
      flyScore,
      stopsOutbound,
      stopsInbound,
      durationOutboundMinutes: minutesFromDuration(outbound?.duration),
      durationInboundMinutes: minutesFromDuration(inbound?.duration),
      seatsRemaining: offer.numberOfBookableSeats ?? null,
      bookingUrl: null,
      bookingType: 'pricing-source',
    };
  }).sort((a, b) => a.price - b.price);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const config = envConfig();
  if (!config.clientId || !config.clientSecret) {
    return send(res, 503, {
      error: 'PROVIDER_NOT_CONFIGURED',
      message: 'Configure AMADEUS_CLIENT_ID e AMADEUS_CLIENT_SECRET na Vercel.',
      provider: 'amadeus',
      mode: config.mode,
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
    max = '30',
  } = req.query || {};

  if (!origin || !destination || !departureDate) {
    return send(res, 400, {
      error: 'INVALID_SEARCH',
      message: 'origin, destination e departureDate são obrigatórios.',
    });
  }

  try {
    const token = await getToken(config);
    const params = new URLSearchParams({
      originLocationCode: String(origin).toUpperCase(),
      destinationLocationCode: String(destination).toUpperCase(),
      departureDate: String(departureDate),
      adults: String(adults),
      currencyCode: String(currency).toUpperCase(),
      nonStop: String(nonStop) === 'true' ? 'true' : 'false',
      max: String(Math.min(50, Math.max(1, Number(max) || 30))),
    });
    if (returnDate) params.set('returnDate', String(returnDate));

    const response = await fetch(`${config.baseUrl}/v2/shopping/flight-offers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();

    if (!response.ok) {
      return send(res, response.status, {
        error: 'PROVIDER_ERROR',
        provider: 'amadeus',
        details: payload?.errors || payload,
      });
    }

    const offers = normalizeOffers(payload.data || [], payload.dictionaries || {});
    return send(res, 200, {
      meta: {
        provider: 'amadeus',
        mode: config.mode,
        live: config.mode === 'production',
        fetchedAt: new Date().toISOString(),
        count: offers.length,
        note: config.mode === 'production'
          ? 'Dados consultados no ambiente de produção do Amadeus.'
          : 'Ambiente de teste: dados podem ser limitados ou cacheados.',
      },
      offers,
    });
  } catch (error) {
    return send(res, 500, {
      error: 'SEARCH_FAILED',
      provider: 'amadeus',
      message: error instanceof Error ? error.message : 'Erro inesperado na busca.',
    });
  }
}
