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
  { id: 'd1', origin: 'GIG', destination: 'SCL', destinationName: 'Santiago', price: 1098, currency: 'BRL', referencePrice: 1680, flyScore: 91, stops: 0, travelWindow: 'Set–Out', checkedAt: 'agora' },
  { id: 'd2', origin: 'GRU', destination: 'EZE', destinationName: 'Buenos Aires', price: 842, currency: 'BRL', referencePrice: 1190, flyScore: 86, stops: 0, travelWindow: 'Ago–Nov', checkedAt: 'há 8 min' },
  { id: 'd3', origin: 'GRU', destination: 'LIS', destinationName: 'Lisboa', price: 3189, currency: 'BRL', referencePrice: 4290, flyScore: 82, stops: 1, travelWindow: 'Nov–Mar', checkedAt: 'há 12 min' }
];
