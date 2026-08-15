import { listNdcProviders, searchNdcProvider } from '../providers/ndc.js';

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function send(res, status, body) {
  res.statusCode = status;
  for (const [key, value] of Object.entries(JSON_HEADERS)) res.setHeader(key, value);
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  const {
    origin,
    destination,
    departureDate,
    returnDate,
    adults = '1',
    provider,
  } = req.query || {};

  if (!origin || !destination || !departureDate) {
    return send(res, 400, {
      error: 'INVALID_SEARCH',
      message: 'origin, destination e departureDate são obrigatórios.',
    });
  }

  let providers = listNdcProviders().filter((item) => item.configured);
  if (provider) providers = providers.filter((item) => item.id === String(provider).toLowerCase());

  if (!providers.length) {
    return send(res, 503, {
      error: 'NDC_NOT_CONFIGURED',
      message: 'Nenhum endpoint NDC direto está configurado. Defina NDC_PROVIDERS e as variáveis NDC_<ID>_* na Vercel.',
      providers: listNdcProviders().map(({ apiKey, bearerToken, password, headersJson, ...safe }) => safe),
    });
  }

  const input = {
    origin: String(origin).toUpperCase(),
    destination: String(destination).toUpperCase(),
    departureDate: String(departureDate),
    returnDate: returnDate ? String(returnDate) : undefined,
    adults: Math.max(1, Number(adults) || 1),
  };

  const settled = await Promise.allSettled(providers.map((config) => searchNdcProvider(config, input)));
  const successfulProviders = [];
  const failures = [];
  const offers = [];

  settled.forEach((result, index) => {
    const config = providers[index];
    if (result.status === 'fulfilled') {
      successfulProviders.push(result.value.meta);
      offers.push(...result.value.offers);
    } else {
      failures.push({
        provider: `ndc-${config.id}`,
        label: config.label,
        message: result.reason?.message || 'Falha no provider NDC.',
      });
    }
  });

  offers.sort((a, b) => a.price - b.price);

  if (!offers.length && failures.length === providers.length) {
    return send(res, 502, {
      error: 'ALL_NDC_PROVIDERS_FAILED',
      failures,
    });
  }

  return send(res, 200, {
    meta: {
      provider: 'ndc-direct',
      live: true,
      officialDirect: true,
      fetchedAt: new Date().toISOString(),
      count: offers.length,
      successfulProviders: successfulProviders.map((item) => item.provider),
      failedProviders: failures.map((item) => item.provider),
      note: 'Tarifas consultadas diretamente em endpoints NDC configurados das companhias/provedores.',
    },
    providers: successfulProviders,
    failures,
    offers,
  });
}
