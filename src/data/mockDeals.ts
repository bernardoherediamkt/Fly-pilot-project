export type MockDeal = {
  id: string;
  origin: string;
  destination: string;
  destinationName: string;
  price: number;
  currency: 'BRL';
  referencePrice: number;
  flyScore: number;
  stops: number;
  travelWindow: string;
  checkedAt: string;
};

export const mockDeals: MockDeal[] = [
  { id: 'd1', origin: 'GIG', destination: 'SCL', destinationName: 'Santiago', price: 897, currency: 'BRL', referencePrice: 1480, flyScore: 92, stops: 0, travelWindow: 'Out · 6 dias', checkedAt: 'agora' },
  { id: 'd2', origin: 'GRU', destination: 'EZE', destinationName: 'Buenos Aires', price: 642, currency: 'BRL', referencePrice: 1110, flyScore: 95, stops: 0, travelWindow: 'Set · 5 dias', checkedAt: 'há 4 min' },
  { id: 'd3', origin: 'BSB', destination: 'LIM', destinationName: 'Lima', price: 1039, currency: 'BRL', referencePrice: 1570, flyScore: 89, stops: 0, travelWindow: 'Nov · 6 dias', checkedAt: 'há 8 min' },
  { id: 'd4', origin: 'REC', destination: 'MIA', destinationName: 'Miami', price: 1273, currency: 'BRL', referencePrice: 1950, flyScore: 86, stops: 1, travelWindow: 'Fev · 8 dias', checkedAt: 'há 12 min' },
  { id: 'd5', origin: 'CNF', destination: 'LIS', destinationName: 'Lisboa', price: 2189, currency: 'BRL', referencePrice: 3150, flyScore: 84, stops: 1, travelWindow: 'Mar · 9 dias', checkedAt: 'há 16 min' }
];
