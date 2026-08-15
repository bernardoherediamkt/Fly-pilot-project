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
  airline: string;
  routeType: 'national' | 'international';
};

export const mockDeals: MockDeal[] = [
  { id: 'd1', origin: 'GIG', destination: 'SCL', destinationName: 'Santiago', price: 897, currency: 'BRL', referencePrice: 1480, flyScore: 92, stops: 0, travelWindow: 'Out · 6 dias', checkedAt: 'agora', airline: 'LATAM', routeType: 'international' },
  { id: 'd2', origin: 'GRU', destination: 'EZE', destinationName: 'Buenos Aires', price: 642, currency: 'BRL', referencePrice: 1110, flyScore: 95, stops: 0, travelWindow: 'Set · 5 dias', checkedAt: 'há 4 min', airline: 'GOL', routeType: 'international' },
  { id: 'd3', origin: 'BSB', destination: 'LIM', destinationName: 'Lima', price: 1039, currency: 'BRL', referencePrice: 1570, flyScore: 89, stops: 0, travelWindow: 'Nov · 6 dias', checkedAt: 'há 8 min', airline: 'Avianca', routeType: 'international' },
  { id: 'd4', origin: 'REC', destination: 'MIA', destinationName: 'Miami', price: 1273, currency: 'BRL', referencePrice: 1950, flyScore: 86, stops: 1, travelWindow: 'Fev · 8 dias', checkedAt: 'há 12 min', airline: 'American', routeType: 'international' },
  { id: 'd5', origin: 'CNF', destination: 'LIS', destinationName: 'Lisboa', price: 2189, currency: 'BRL', referencePrice: 3150, flyScore: 84, stops: 1, travelWindow: 'Mar · 9 dias', checkedAt: 'há 16 min', airline: 'TAP', routeType: 'international' },
  { id: 'd6', origin: 'SDU', destination: 'SSA', destinationName: 'Salvador', price: 489, currency: 'BRL', referencePrice: 780, flyScore: 90, stops: 0, travelWindow: 'Nov · 5 dias', checkedAt: 'há 19 min', airline: 'Azul', routeType: 'national' },
  { id: 'd7', origin: 'GRU', destination: 'REC', destinationName: 'Recife', price: 579, currency: 'BRL', referencePrice: 890, flyScore: 88, stops: 0, travelWindow: 'Out · 6 dias', checkedAt: 'há 23 min', airline: 'LATAM', routeType: 'national' },
  { id: 'd8', origin: 'BSB', destination: 'FOR', destinationName: 'Fortaleza', price: 527, currency: 'BRL', referencePrice: 810, flyScore: 87, stops: 0, travelWindow: 'Dez · 7 dias', checkedAt: 'há 27 min', airline: 'GOL', routeType: 'national' }
];
