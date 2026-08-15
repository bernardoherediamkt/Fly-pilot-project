# FlyPilot — Modelo de Dados v0.1

## users
- id
- email
- name
- role (`traveler`, `agent`, `admin`)
- created_at
- updated_at

## user_preferences
- user_id
- home_airports[]
- currency
- language
- default_cabin
- max_stops
- preferred_regions[]
- budget_profile

## searches
- id
- user_id
- raw_query
- normalized_query_json
- created_at
- provider_cost_estimate

## flight_offers
- id
- provider
- provider_offer_id
- origin
- destination
- departure_at
- return_at
- total_price
- currency
- stops
- carrier_codes[]
- checked_at
- expires_at
- raw_hash

## price_observations
- id
- route_key
- travel_date_key
- amount
- currency
- provider
- observed_at

## deals
- id
- flight_offer_id
- fly_score
- score_breakdown_json
- reference_price
- discount_percent
- status
- detected_at

## alerts
- id
- user_id
- name
- criteria_json
- enabled
- check_frequency
- last_checked_at
- next_check_at
- created_at

## alert_events
- id
- alert_id
- deal_id
- event_type
- payload_hash
- triggered_at
- notification_status

## subscriptions
- id
- user_id
- plan
- provider
- provider_customer_id
- provider_subscription_id
- status
- period_end

## agent_clients (fase Pro)
- id
- agent_user_id
- name
- email
- notes
- preferences_json
