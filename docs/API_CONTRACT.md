# FlyPilot — API Contract v0.1

Prefixo: `/api/v1`

## POST /search/interpret

Entrada:
```json
{
  "text": "Quero sair de São Paulo para algum lugar de praia em outubro por até 1500 reais"
}
```

Saída:
```json
{
  "origin": ["SAO"],
  "destination": null,
  "themes": ["beach"],
  "departureWindow": {"from": "2026-10-01", "to": "2026-10-31"},
  "maxPrice": 1500,
  "currency": "BRL",
  "tripType": "roundtrip",
  "adults": 1,
  "maxStops": null,
  "needsConfirmation": true
}
```

## POST /flights/search

Entrada:
```json
{
  "origins": ["GIG"],
  "destinations": ["SCL"],
  "departureDate": "2026-09-10",
  "returnDate": "2026-09-17",
  "adults": 1,
  "cabin": "economy",
  "maxStops": 1,
  "currency": "BRL"
}
```

Saída resumida:
```json
{
  "searchId": "srch_123",
  "checkedAt": "2026-08-14T23:00:00Z",
  "offers": []
}
```

## GET /deals

Parâmetros:
- origin
- maxPrice
- destinationRegion
- directOnly
- scoreMin
- page

## GET /deals/:id

Retorna oportunidade detalhada, score e explicação.

## POST /alerts

```json
{
  "name": "Chile setembro",
  "criteria": {
    "origins": ["RIO"],
    "destinations": ["SCL"],
    "maxPrice": 1200,
    "currency": "BRL"
  },
  "channels": ["email"]
}
```

## PATCH /alerts/:id

Ativa/desativa ou altera condições.

## GET /alerts

Lista alertas do usuário.

## GET /me/preferences

## PUT /me/preferences

## GET /plans

## POST /billing/checkout

Futuro: geração de sessão de assinatura no provedor de pagamentos.
