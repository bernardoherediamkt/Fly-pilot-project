# FlyPilot — Providers de busca aérea

## Objetivo

O FlyPilot é um metabuscador inteligente. Ele não emite passagem: consulta fontes de preço, normaliza resultados, calcula o FlyScore, compara alternativas e redireciona o usuário ao fornecedor responsável pela oferta.

## Provider 1 — Google Flights via SerpApi

Status: integração implementada; depende apenas de `SERPAPI_KEY` na Vercel.

Endpoints FlyPilot:

- `GET /api/flights/google` — Google Flights + Price Insights.
- `GET /api/flights/booking-options` — vendedores/opções de compra para um `bookingToken`.
- `GET /api/flights/deals` — Google Flights Deals para alimentar o Radar.

Variável:

- `SERPAPI_KEY`

Observação: SerpApi é um serviço terceiro que coleta e estrutura resultados do Google Flights; não é uma API oficial do Google.

## Provider 2 — Amadeus

Status: integração implementada em `/api/flights/search`.

Variáveis:

- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `AMADEUS_ENV=test|production`

Uso principal: segunda fonte independente de preço e disponibilidade. Em `test`, dados podem ser limitados/cacheados; em `production`, a busca usa o ambiente de produção.

## Provider 3 — KAYAK

Status: aguardando aprovação/chave de parceiro.

Variável reservada:

- `KAYAK_API_KEY`

Uso planejado: busca multi-provider com tarifas live e opções de booking/referral.

## Provider 4 — Skyscanner

Status: aguardando aprovação/chave de parceiro.

Variável reservada:

- `SKYSCANNER_API_KEY`

Uso planejado: Flights Live Prices + deeplinks/referrals.

## Próxima arquitetura

1. Consultar todos os providers configurados em paralelo.
2. Converter cada resposta para `NormalizedFlightOffer`.
3. Deduplicar o mesmo itinerário por rota, horários, companhia e números de voo.
4. Agrupar vendedores de um mesmo itinerário.
5. Comparar preço atual, faixa típica/histórica, escalas, duração e confiabilidade da fonte.
6. Calcular FlyScore.
7. Exibir a melhor oferta e todas as fontes disponíveis.
8. Redirecionar o usuário para o link/booking request da fonte externa.

## Regra de produto

Nunca afirmar “menor preço da internet”. Usar “melhor oferta encontrada entre as fontes consultadas”, pois a cobertura depende dos providers configurados e das regras de inventário de cada parceiro.
