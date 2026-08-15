const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function send(res, status, body) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(JSON_HEADERS)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    return send(res, 503, {
      error: 'PROVIDER_NOT_CONFIGURED',
      provider: 'google-flights-deals-serpapi',
      message: 'Configure SERPAPI_KEY na Vercel.',
    });
  }

  const {
    origin,
    departureDate,
    returnDate,
    maxPrice,
    adults = '1',
    currency = 'BRL',
    nonStop = 'false',
    travelDuration,
    tripLength,
  } = req.query || {};

  if (!origin) {
    return send(res, 400, {
      error: 'INVALID_SEARCH',
      message: 'origin é obrigatório.',
    });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_flights_deals',
      departure_id: String(origin).toUpperCase(),
      adults: String(adults),
      currency: String(currency).toUpperCase(),
      hl: 'pt',
      gl: 'br',
      type: returnDate || travelDuration || tripLength ? '1' : '1',
      api_key: apiKey,
    });

    if (departureDate) params.set('outbound_date', String(departureDate));
    if (returnDate) params.set('return_date', String(returnDate));
    if (maxPrice) params.set('max_price', String(maxPrice));
    if (String(nonStop) === 'true') params.set('stops', '1');
    if (travelDuration) params.set('travel_duration', String(travelDuration));
    if (tripLength) params.set('trip_length', String(tripLength));

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok || payload?.error) {
      return send(res, response.ok ? 502 : response.status, {
        error: 'PROVIDER_ERROR',
        provider: 'google-flights-deals-serpapi',
        details: payload?.error || payload,
      });
    }

    const deals = (payload.deals || []).map((deal, index) => ({
      id: `google-deal:${deal.destination_id || deal.arrival_airport_code || index}:${deal.start_date || ''}`,
      provider: 'google-flights-deals-serpapi',
      providerLabel: 'Google Flights Deals',
      live: true,
      name: deal.name || deal.arrival_airport_code || 'Destino',
      country: deal.country || null,
      destinationId: deal.destination_id || null,
      origin: deal.departure_airport_code || String(origin).toUpperCase(),
      destination: deal.arrival_airport_code || null,
      price: Number(deal.price || 0),
      averagePrice: Number(deal.average_price || 0) || null,
      discountPercentage: Number(deal.discount_percentage || 0),
      startDate: deal.start_date || null,
      endDate: deal.end_date || null,
      flightDurationMinutes: deal.flight_duration ?? null,
      stops: deal.stops ?? null,
      airline: deal.airline || null,
      airlineCode: deal.airline_code || null,
      description: deal.description || null,
      highlights: deal.highlights || null,
      thumbnail: deal.thumbnail || null,
      googleFlightsUrl: deal.flight_link || null,
      serpApiFlightUrl: deal.serpapi_flight_link || null,
      flyScore: Math.max(50, Math.min(99, Math.round(72 + Number(deal.discount_percentage || 0) * 0.35 + (deal.stops === 0 ? 5 : 0)))),
    })).sort((a, b) => b.flyScore - a.flyScore);

    return send(res, 200, {
      meta: {
        provider: 'google-flights-deals-serpapi',
        live: true,
        fetchedAt: new Date().toISOString(),
        count: deals.length,
        googleFlightsDealsUrl: payload?.search_metadata?.google_flights_deals_url || null,
      },
      departure: payload.departure_informations || null,
      deals,
    });
  } catch (error) {
    return send(res, 500, {
      error: 'DEALS_SEARCH_FAILED',
      provider: 'google-flights-deals-serpapi',
      message: error instanceof Error ? error.message : 'Erro inesperado no Radar.',
    });
  }
}
