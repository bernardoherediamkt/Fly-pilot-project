export type LiveFlightOffer = {
  id: string;
  provider: string;
  providerLabel: string;
  live: boolean;
  origin: string;
  destination: string;
  departureAt: string | null;
  arrivalAt: string | null;
  returnDepartureAt: string | null;
  returnArrivalAt: string | null;
  airlineCode: string;
  airline: string;
  flightNumbers: string[];
  price: number;
  currency: string;
  referencePrice: number | null;
  savingsVsSearchMedian: number;
  flyScore: number;
  stopsOutbound: number;
  stopsInbound: number;
  durationOutboundMinutes: number | null;
  durationInboundMinutes: number | null;
  seatsRemaining: number | null;
  bookingUrl: string | null;
  bookingType: 'pricing-source' | 'referral';
};

export type LiveSearchResponse = {
  meta: {
    provider: string;
    mode: string;
    live: boolean;
    fetchedAt: string;
    count: number;
    note: string;
  };
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
};

export async function searchLiveFlights(input: LiveSearchInput): Promise<LiveSearchResponse> {
  const params = new URLSearchParams({
    origin: input.origin.toUpperCase(),
    destination: input.destination.toUpperCase(),
    departureDate: input.departureDate,
    adults: String(input.adults ?? 1),
    currency: input.currency ?? 'BRL',
    nonStop: input.nonStop ? 'true' : 'false',
  });
  if (input.returnDate) params.set('returnDate', input.returnDate);

  const response = await fetch(`/api/flights/search?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || payload?.details?.[0]?.detail || 'Não foi possível consultar tarifas ao vivo.';
    throw new Error(message);
  }
  return payload as LiveSearchResponse;
}
