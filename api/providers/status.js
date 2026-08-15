export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  const amadeusConfigured = Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  const amadeusMode = (process.env.AMADEUS_ENV || 'test').toLowerCase();

  res.status(200).json({
    providers: [
      {
        id: 'amadeus',
        label: 'Amadeus',
        configured: amadeusConfigured,
        mode: amadeusMode,
        live: amadeusConfigured && amadeusMode === 'production',
        role: 'pricing-source',
      },
      {
        id: 'skyscanner',
        label: 'Skyscanner',
        configured: false,
        mode: 'pending-partnership',
        live: false,
        role: 'price-and-referral-source',
      },
      {
        id: 'google-flights',
        label: 'Google Flights',
        configured: false,
        mode: 'external-redirect-only',
        live: false,
        role: 'external-comparison',
      },
    ],
  });
}
