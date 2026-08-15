# FlyPilot — IATA NDC Direct Airline Adapter

## Objetivo

O FlyPilot usa NDC como uma fonte **direta de shopping da companhia aérea**. O FlyPilot não emite bilhetes nem processa pagamento nesta camada. A integração consulta `AirShoppingRQ/RS`, normaliza as ofertas e as envia ao MetaSearch junto com Google Flights/SerpApi e outros providers.

## O que o padrão resolve — e o que não resolve

NDC é um padrão de mensagens. Ele não é um endpoint público universal. Cada companhia/provedor define:

- URL do endpoint;
- versão/schema suportado;
- credenciais;
- autenticação;
- headers obrigatórios;
- requisitos de onboarding;
- eventuais extensões da mensagem.

O primeiro perfil do FlyPilot gera `IATA_AirShoppingRQ` no formato 21.3-style e o parser de resposta foi implementado de forma tolerante a diferenças comuns de `AirShoppingRS`. Quando uma companhia usar outro perfil ou extensões proprietárias, criamos uma variante específica sem alterar o formato interno do FlyPilot.

## Variáveis de ambiente

Cadastre os IDs dos providers:

```text
NDC_PROVIDERS=latam,gol
```

Para cada ID, use o prefixo `NDC_<ID>_`:

```text
NDC_LATAM_ENDPOINT=https://endpoint-fornecido-pela-companhia.example/airshopping
NDC_LATAM_AIRLINE_CODE=LA
NDC_LATAM_LABEL=LATAM NDC
NDC_LATAM_VERSION=21.3
NDC_LATAM_AGENCY_ID=FLYPILOT
NDC_LATAM_AGENCY_NAME=FlyPilot
```

### Autenticação por API key

```text
NDC_LATAM_AUTH_TYPE=api-key
NDC_LATAM_AUTH_HEADER=x-api-key
NDC_LATAM_API_KEY=...
```

### Bearer token

```text
NDC_LATAM_AUTH_TYPE=bearer
NDC_LATAM_BEARER_TOKEN=...
```

### Basic Auth

```text
NDC_LATAM_AUTH_TYPE=basic
NDC_LATAM_USERNAME=...
NDC_LATAM_PASSWORD=...
```

### Headers adicionais

Para headers específicos do contrato da companhia:

```text
NDC_LATAM_HEADERS_JSON={"X-Seller-ID":"...","X-Office-ID":"..."}
```

Nunca grave segredos no repositório. Use Environment Variables da Vercel/VPS.

### Redirecionamento oficial

NDC não garante um deeplink web para uma oferta. Se a companhia fornecer um URL de redirecionamento compatível, configure:

```text
NDC_LATAM_BOOKING_URL=https://www.companhia.example/
```

Sem esse campo, o FlyPilot ainda pode comparar o preço NDC como **preço oficial direto**, mas não deve afirmar que possui um deeplink exato da oferta.

## Endpoints FlyPilot

Busca apenas NDC:

```text
GET /api/flights/ndc-search?origin=GIG&destination=SCL&departureDate=2026-10-10&returnDate=2026-10-17
```

Busca em um provider NDC específico:

```text
GET /api/flights/ndc-search?provider=latam&origin=GIG&destination=SCL&departureDate=2026-10-10
```

MetaSearch:

```text
GET /api/flights/meta-search?origin=GIG&destination=SCL&departureDate=2026-10-10&returnDate=2026-10-17
```

Quando ao menos um endpoint NDC estiver configurado, o MetaSearch consulta a camada `ndc-direct` automaticamente.

## Ranking

Ofertas NDC recebem:

```text
officialDirect: true
source: IATA NDC
```

O MetaSearch mantém o menor preço como principal critério, adiciona um pequeno bônus de confiança ao FlyScore para ofertas oficiais diretas e também retorna:

```text
bestOfficialDirect
```

Isso permite à interface apresentar separadamente:

- menor preço encontrado;
- melhor preço direto na companhia;
- melhor custo-benefício.

## Próxima etapa para cada companhia

Quando obtivermos um endpoint real, precisamos validar com a documentação específica dela:

1. versão do schema;
2. namespace esperado;
3. estrutura de `Party/Sender`;
4. autenticação;
5. headers;
6. payload mínimo de AirShopping;
7. parsing de Offer/OfferItem/Journeys;
8. regras de deeplink/redirecionamento;
9. limites de uso e termos comerciais.

A arquitetura foi feita para que essas diferenças fiquem no adaptador do provider, e não contaminem o restante do FlyPilot.
