# FlyPilot — Dados reais (v0.4)

## Objetivo

O FlyPilot não emite passagens. A plataforma pesquisa, normaliza, compara e ranqueia oportunidades; quando um provider oferecer deeplink autorizado, o usuário é encaminhado ao site externo responsável pela oferta.

## Primeiro provider: Amadeus Flight Offers Search

A API serverless está em `api/flights/search.js`.

### Variáveis na Vercel

Configure em **Project Settings → Environment Variables**:

- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `AMADEUS_ENV`

Valores de `AMADEUS_ENV`:

- `test`: usa `https://test.api.amadeus.com` e pode retornar dados limitados/cacheados.
- `production`: usa `https://api.amadeus.com` e consulta o ambiente de produção.

Nunca exponha a chave ou o secret em variáveis `VITE_*` ou no frontend.

## Teste

Depois do deploy, abra:

`/live`

A tela consulta:

`GET /api/flights/search?origin=GIG&destination=SCL&departureDate=YYYY-MM-DD&returnDate=YYYY-MM-DD`

## Arquitetura de providers

A resposta do backend é normalizada para o modelo FlyPilot. Cada provider deve informar:

- provider / providerLabel
- live
- rota e horários
- companhia aérea
- preço e moeda
- escalas
- FlyScore
- `bookingUrl` quando houver deeplink autorizado
- `bookingType`: `pricing-source` ou `referral`

## Próximos providers

1. Skyscanner Live Prices + referral/deeplink após aprovação de parceria.
2. KAYAK ou outro parceiro de metabusca somente se os termos permitirem agregação no FlyPilot.
3. Companhias aéreas/OTAs com APIs ou programas de afiliados que autorizem deeplink.
4. Google Flights como fonte externa de comparação/redirecionamento; não tratar como API pública de consumo sem parceria específica.

## Regra de produto

O FlyPilot deve distinguir claramente:

- preço ao vivo confirmado por provider;
- preço indicativo/cacheado;
- preço demonstrativo;
- oferta com deeplink rastreável;
- fonte usada apenas como referência de preço.
