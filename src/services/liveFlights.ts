export type PriceInsights = {
  lowest_price?: number;
  price_level?: 'low' | 'typical' | 'high' | string;
  typical_price_range?: [number, number];
  price_history?: Array<[number, number]>;
};

export type LiveFlightOffer = {
  id: string;
  provider: string;
  providerLabel: string;
  sourceProvider?: string;
  source?: string;
  live: boolean;
  bucket?: string;
  origin: string;
  destination: string;
  departureAt: string | null;
  arrivalAt: string | null;
  returnDepartureAt?: string | null;
  returnArrivalAt?: string | null;
  airlineCode?: string;
  airline: string;
  airlineLogo?: string | null;
  flightNumbers: string[];
  price: number;
  currency: string;
  referencePrice: number | null;
  savingsVsSearchMedian?: number;
  savingsVsReference?: number;
  savingsVsCrossSourceMedian?: number;
  flyScore: number;
  metaFlyScore?: number;
  stops?: number;
  stopsOutbound?: number;
  stopsInbound?: number;
  totalDurationMinutes?: number | null;
  durationOutboundMinutes?: number | null;
  durationInboundMinutes?: number | null;
  seatsRemaining?: number | null;
  bookingUrl?: string | null;
  googleFlightsUrl?: string | null;
  bookingToken?: string | null;
  departureToken?: string | null;
  bookingType?: string;
};

export type LiveSearchResponse = {
  meta: {
    fetchedAt: string;
    configuredProviders: string[];
    successfulProviders: string[];
    failedProviders: string[];
    coverage: number;
    crossSourceMedian: number | null;
    disclaimer: string;
  };
  providers: Array<{
    provider: string;
    meta?: Record<string, unknown> | null;
    priceInsights?: PriceInsights | null;
  }>;
  failures: Array<{ provider: string; message: string }>;
  bestOffer: LiveFlightOffer | null;
  offers: LiveFlightOffer[];
};

export type LiveSearchInput = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  currency?: string;
  nonStop?: boolean;
  deepSearch?: boolean;
};

export async function searchLiveFlights(input: LiveSearchInput): Promise<LiveSearchResponse> {
  const params = new URLSearchParams({
    origin: input.origin.toUpperCase(),
    destination: input.destination.toUpperCase(),
    departureDate: input.departureDate,
    adults: String(input.adults ?? 1),
    currency: input.currency ?? 'BRL',
    nonStop: input.nonStop ? 'true' : 'false',
    deepSearch: input.deepSearch ? 'true' : 'false',
  });
  if (input.returnDate) params.set('returnDate', input.returnDate);

  const response = await fetch(`/api/flights/meta-search?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || payload?.details?.[0]?.detail || payload?.error || 'Não foi possível consultar tarifas ao vivo.';
    throw new Error(message);
  }
  return payload as LiveSearchResponse;
}

export function getPriceInsights(result: LiveSearchResponse): PriceInsights | null {
  for (const provider of result.providers || []) {
    if (provider.priceInsights) return provider.priceInsights;
  }
  return null;
}
