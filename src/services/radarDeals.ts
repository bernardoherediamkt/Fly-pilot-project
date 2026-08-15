export type RadarDeal = {
  id: string;
  provider: string;
  providerLabel: string;
  live: boolean;
  name: string;
  country: string | null;
  destinationId: string | null;
  origin: string;
  destination: string | null;
  price: number;
  averagePrice: number | null;
  discountPercentage: number;
  startDate: string | null;
  endDate: string | null;
  flightDurationMinutes: number | null;
  stops: number | null;
  airline: string | null;
  airlineCode: string | null;
  description: string | null;
  highlights: string[] | string | null;
  thumbnail: string | null;
  googleFlightsUrl: string | null;
  serpApiFlightUrl: string | null;
  flyScore: number;
};

export type RadarDealsResponse = {
  meta: {
    provider: string;
    live: boolean;
    fetchedAt: string;
    count: number;
    googleFlightsDealsUrl: string | null;
  };
  departure: unknown;
  deals: RadarDeal[];
};

export type RadarDealsInput = {
  origin: string;
  maxPrice?: number;
  nonStop?: boolean;
  currency?: string;
};

export async function searchRadarDeals(input: RadarDealsInput): Promise<RadarDealsResponse> {
  const params = new URLSearchParams({
    origin: input.origin.toUpperCase(),
    currency: input.currency ?? 'BRL',
    nonStop: input.nonStop ? 'true' : 'false',
  });
  if (input.maxPrice) params.set('maxPrice', String(input.maxPrice));

  const response = await fetch(`/api/flights/deals?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || payload?.details || payload?.error || 'Não foi possível atualizar o Radar.';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return payload as RadarDealsResponse;
}
