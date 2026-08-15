const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function send(res, status, body) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(JSON_HEADERS)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

function normalizeOption(option, group) {
  const data = option?.together || option?.departing || option?.returning || option || {};
  return {
    group,
    seller: data.book_with || data.seller || data.name || 'Fornecedor',
    airline: Boolean(data.airline),
    airlineLogos: data.airline_logos || [],
    marketedAs: data.marketed_as || [],
    price: Number(data.price || 0) || null,
    localPrices: data.local_prices || [],
    optionTitle: data.option_title || null,
    extensions: data.extensions || [],
    baggagePrices: data.baggage_prices || [],
    bookingRequest: data.booking_request ? {
      url: data.booking_request.url || null,
      postData: data.booking_request.post_data || null,
    } : null,
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

  const { bookingToken, currency = 'BRL' } = req.query || {};
  if (!bookingToken) {
    return send(res, 400, {
      error: 'INVALID_REQUEST',
      message: 'bookingToken é obrigatório.',
    });
  }

  try {
    const params = new URLSearchParams({
      engine: 'google_flights',
      booking_token: String(bookingToken),
      currency: String(currency).toUpperCase(),
      hl: 'pt',
      gl: 'br',
      api_key: apiKey,
    });

    const response = await fetch(`https://serpapi.com/search.json?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok || payload?.error) {
      return send(res, response.ok ? 502 : response.status, {
        error: 'PROVIDER_ERROR',
        provider: 'google-flights-serpapi',
        details: payload?.error || payload,
      });
    }

    const bookingOptions = [];
    for (const option of payload.booking_options || []) {
      if (option?.together) bookingOptions.push(normalizeOption(option, 'together'));
      if (option?.departing) bookingOptions.push(normalizeOption(option, 'departing'));
      if (option?.returning) bookingOptions.push(normalizeOption(option, 'returning'));
      if (!option?.together && !option?.departing && !option?.returning) bookingOptions.push(normalizeOption(option, 'other'));
    }

    bookingOptions.sort((a, b) => (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER));

    return send(res, 200, {
      meta: {
        provider: 'google-flights-serpapi',
        fetchedAt: new Date().toISOString(),
        count: bookingOptions.length,
      },
      selectedFlights: payload.selected_flights || [],
      baggagePrices: payload.baggage_prices || null,
      bookingOptions,
    });
  } catch (error) {
    return send(res, 500, {
      error: 'BOOKING_OPTIONS_FAILED',
      provider: 'google-flights-serpapi',
      message: error instanceof Error ? error.message : 'Erro inesperado ao consultar vendedores.',
    });
  }
}
