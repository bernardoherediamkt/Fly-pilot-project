import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: true,
  trimValues: true,
});

function envName(id, suffix) {
  return `NDC_${String(id).toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${suffix}`;
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value) {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if ('#text' in value) return String(value['#text']);
    if ('_text' in value) return String(value._text);
  }
  return null;
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function deepCollect(node, keyName, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((item) => deepCollect(item, keyName, out));
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === keyName) out.push(...asArray(value));
    deepCollect(value, keyName, out);
  }
  return out;
}

function deepFirst(node, keys) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepFirst(item, keys);
      if (found !== null) return found;
    }
    return null;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const value = text(node[key]);
      if (value !== null) return value;
    }
  }
  for (const value of Object.values(node)) {
    const found = deepFirst(value, keys);
    if (found !== null) return found;
  }
  return null;
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function namespaceFor(version) {
  const major = Number(String(version || '21.3').split('.')[0]);
  if (major >= 24) return 'http://www.iata.org/IATA/2015/00/2024.1/IATA_OffersAndOrdersMessage';
  return 'http://www.iata.org/IATA/2015/EASD/00/IATA_OffersAndOrdersMessage';
}

function providerIds() {
  return String(process.env.NDC_PROVIDERS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function listNdcProviders() {
  return providerIds().map((id) => {
    const endpoint = process.env[envName(id, 'ENDPOINT')] || '';
    const airlineCode = process.env[envName(id, 'AIRLINE_CODE')] || id.toUpperCase();
    const label = process.env[envName(id, 'LABEL')] || `${airlineCode} NDC`;
    const version = process.env[envName(id, 'VERSION')] || '21.3';
    const authType = (process.env[envName(id, 'AUTH_TYPE')] || 'api-key').toLowerCase();
    return {
      id,
      providerId: `ndc-${id}`,
      endpoint,
      airlineCode,
      label,
      version,
      authType,
      agencyId: process.env[envName(id, 'AGENCY_ID')] || 'FLYPILOT',
      agencyName: process.env[envName(id, 'AGENCY_NAME')] || 'FlyPilot',
      authHeader: process.env[envName(id, 'AUTH_HEADER')] || 'x-api-key',
      apiKey: process.env[envName(id, 'API_KEY')] || '',
      bearerToken: process.env[envName(id, 'BEARER_TOKEN')] || '',
      username: process.env[envName(id, 'USERNAME')] || '',
      password: process.env[envName(id, 'PASSWORD')] || '',
      bookingUrl: process.env[envName(id, 'BOOKING_URL')] || null,
      headersJson: process.env[envName(id, 'HEADERS_JSON')] || '',
      configured: Boolean(endpoint),
    };
  });
}

export function buildAirShoppingRequest(config, input) {
  const version = config.version || '21.3';
  const namespace = namespaceFor(version);
  const paxCount = Math.max(1, Number(input.adults || 1));
  const paxXml = Array.from({ length: paxCount }, (_, index) => `
      <Pax>
        <PaxID>PAX${index + 1}</PaxID>
        <PTC>ADT</PTC>
      </Pax>`).join('');

  const criteria = [
    { origin: input.origin, destination: input.destination, date: input.departureDate },
  ];
  if (input.returnDate) {
    criteria.push({ origin: input.destination, destination: input.origin, date: input.returnDate });
  }

  const originDestXml = criteria.map((item, index) => `
      <OriginDestCriteria>
        <DestArrivalCriteria>
          <IATA_LocationCode>${escapeXml(item.destination)}</IATA_LocationCode>
        </DestArrivalCriteria>
        <OriginDepCriteria>
          <Date>${escapeXml(item.date)}</Date>
          <IATA_LocationCode>${escapeXml(item.origin)}</IATA_LocationCode>
        </OriginDepCriteria>
        <OriginDestID>OD${index + 1}</OriginDestID>
      </OriginDestCriteria>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_AirShoppingRQ xmlns="${namespace}">
  <Party>
    <Sender>
      <TravelAgency>
        <AgencyID>${escapeXml(config.agencyId)}</AgencyID>
        <Name>${escapeXml(config.agencyName)}</Name>
      </TravelAgency>
    </Sender>
  </Party>
  <Request>
    <FlightRequest>
      <FlightRequestOriginDestinationsCriteria>${originDestXml}
      </FlightRequestOriginDestinationsCriteria>
    </FlightRequest>
    <Paxs>${paxXml}
    </Paxs>
  </Request>
</IATA_AirShoppingRQ>`;
}

function requestHeaders(config) {
  const headers = {
    'content-type': 'application/xml; charset=utf-8',
    accept: 'application/xml, text/xml, application/json',
  };

  if (config.authType === 'bearer' && config.bearerToken) {
    headers.authorization = `Bearer ${config.bearerToken}`;
  } else if (config.authType === 'basic' && (config.username || config.password)) {
    headers.authorization = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
  } else if (config.apiKey) {
    headers[config.authHeader] = config.apiKey;
  }

  if (config.headersJson) {
    try {
      Object.assign(headers, JSON.parse(config.headersJson));
    } catch {
      // Ignore malformed optional custom headers and let the provider response expose the issue.
    }
  }
  return headers;
}

function buildSegmentMap(root) {
  const segments = new Map();
  for (const segment of deepCollect(root, 'PaxSegment')) {
    const id = firstDefined(text(segment.PaxSegmentID), text(segment.SegmentKey), deepFirst(segment, ['PaxSegmentID', 'SegmentKey']));
    if (id) segments.set(String(id), segment);
  }
  return segments;
}

function buildJourneyMap(root) {
  const journeys = new Map();
  for (const journey of deepCollect(root, 'PaxJourney')) {
    const id = firstDefined(text(journey.PaxJourneyID), text(journey.JourneyKey), deepFirst(journey, ['PaxJourneyID', 'JourneyKey']));
    if (!id) continue;
    const refs = deepCollect(journey, 'PaxSegmentRefID').map(text).filter(Boolean);
    journeys.set(String(id), { journey, refs });
  }
  return journeys;
}

function extractOfferRefs(offer) {
  const journeyRefs = deepCollect(offer, 'PaxJourneyRefID').map(text).filter(Boolean);
  const segmentRefs = deepCollect(offer, 'PaxSegmentRefID').map(text).filter(Boolean);
  return { journeyRefs, segmentRefs };
}

function flattenOfferSegments(offer, journeyMap, segmentMap) {
  const { journeyRefs, segmentRefs } = extractOfferRefs(offer);
  const ids = [];
  for (const journeyId of journeyRefs) {
    const journey = journeyMap.get(String(journeyId));
    if (journey) ids.push(...journey.refs);
  }
  ids.push(...segmentRefs);
  const uniqueIds = [...new Set(ids.map(String))];
  const resolved = uniqueIds.map((id) => segmentMap.get(id)).filter(Boolean);
  if (resolved.length) return resolved;
  return deepCollect(offer, 'PaxSegment');
}

function segmentInfo(segment) {
  const dep = segment?.Dep || segment?.Departure || {};
  const arr = segment?.Arrival || segment?.Arr || {};
  const marketing = segment?.MarketingCarrierInfo || segment?.MarketingCarrier || {};
  return {
    origin: firstDefined(text(dep.IATA_LocationCode), deepFirst(dep, ['IATA_LocationCode', 'AirportCode'])),
    destination: firstDefined(text(arr.IATA_LocationCode), deepFirst(arr, ['IATA_LocationCode', 'AirportCode'])),
    departureAt: firstDefined(text(dep.AircraftScheduledDateTime), text(dep.ScheduledDateTime), deepFirst(dep, ['AircraftScheduledDateTime', 'ScheduledDateTime'])),
    arrivalAt: firstDefined(text(arr.AircraftScheduledDateTime), text(arr.ScheduledDateTime), deepFirst(arr, ['AircraftScheduledDateTime', 'ScheduledDateTime'])),
    airlineCode: firstDefined(text(marketing.CarrierDesigCode), deepFirst(segment, ['CarrierDesigCode', 'MarketingCarrierDesigCode'])),
    flightNumber: firstDefined(text(marketing.MarketingCarrierFlightNumberText), deepFirst(segment, ['MarketingCarrierFlightNumberText', 'FlightNumber'])),
  };
}

function priceInfo(offer) {
  const totalPrice = offer?.TotalPrice || offer?.OfferItem?.TotalPrice || null;
  const amount = Number(firstDefined(
    text(totalPrice?.TotalAmount),
    text(totalPrice?.BaseAmount),
    deepFirst(offer, ['TotalAmount', 'BaseAmount', 'Amount']),
  ) || 0);
  const currency = firstDefined(
    text(totalPrice?.CurCode),
    deepFirst(totalPrice, ['CurCode', 'CurrencyCode']),
    deepFirst(offer, ['CurCode', 'CurrencyCode']),
    'BRL',
  );
  return { amount, currency };
}

export function normalizeAirShoppingResponse(xml, config) {
  const parsed = parser.parse(xml);
  const root = parsed.IATA_AirShoppingRS || parsed.AirShoppingRS || parsed;
  const errors = deepCollect(root, 'Error');
  if (errors.length && !deepCollect(root, 'Offer').length) {
    const message = errors.map((err) => deepFirst(err, ['DescText', 'ErrorDescText', 'Message', 'Text']) || text(err)).filter(Boolean).join(' | ');
    throw new Error(message || 'O provedor NDC retornou um erro de shopping.');
  }

  const segmentMap = buildSegmentMap(root);
  const journeyMap = buildJourneyMap(root);
  const offers = deepCollect(root, 'Offer');

  return offers.map((offer, index) => {
    const price = priceInfo(offer);
    const segments = flattenOfferSegments(offer, journeyMap, segmentMap).map(segmentInfo).filter((item) => item.origin || item.destination);
    const first = segments[0] || {};
    const last = segments[segments.length - 1] || {};
    const ownerCode = firstDefined(text(offer.OwnerCode), deepFirst(offer, ['OwnerCode', 'AirlineDesigCode']), config.airlineCode);
    const offerId = firstDefined(text(offer.OfferID), deepFirst(offer, ['OfferID', 'OfferItemID']), `${config.id}-${index + 1}`);
    const flightNumbers = segments.map((segment) => [segment.airlineCode, segment.flightNumber].filter(Boolean).join('')).filter(Boolean);
    const totalStops = Math.max(0, segments.length - (segments.length > 1 && first.origin === last.destination ? 2 : 1));
    const directBonus = totalStops === 0 ? 8 : totalStops === 1 ? 3 : 0;
    const flyScore = Math.max(55, Math.min(96, 76 + directBonus));

    return {
      id: `ndc:${config.id}:${offerId}`,
      provider: `ndc-${config.id}`,
      sourceProvider: `ndc-${config.id}`,
      providerLabel: config.label,
      source: 'IATA NDC',
      officialDirect: true,
      live: true,
      ndcVersion: config.version,
      airlineCode: ownerCode || config.airlineCode,
      airline: config.label.replace(/\s+NDC$/i, ''),
      origin: first.origin || null,
      destination: last.destination || first.destination || null,
      departureAt: first.departureAt || null,
      arrivalAt: last.arrivalAt || first.arrivalAt || null,
      flightNumbers,
      price: price.amount,
      currency: price.currency || 'BRL',
      flyScore,
      stops: totalStops,
      bookingUrl: config.bookingUrl,
      bookingType: config.bookingUrl ? 'official-airline-redirect' : 'official-ndc-price',
      ndcOfferId: String(offerId),
    };
  }).filter((offer) => offer.price > 0);
}

export async function searchNdcProvider(config, input) {
  if (!config.endpoint) throw new Error(`${config.label}: endpoint NDC não configurado.`);
  const xml = buildAirShoppingRequest(config, input);
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: requestHeaders(config),
    body: xml,
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`${config.label}: HTTP ${response.status} ${raw.slice(0, 240)}`);
  }
  const offers = normalizeAirShoppingResponse(raw, config);
  return {
    meta: {
      provider: `ndc-${config.id}`,
      label: config.label,
      airlineCode: config.airlineCode,
      version: config.version,
      live: true,
      officialDirect: true,
      fetchedAt: new Date().toISOString(),
      count: offers.length,
    },
    offers,
  };
}
