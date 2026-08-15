# FlyPilot — Arquitetura Técnica

## 1. Princípio central

Separar a experiência do usuário da fonte de inventário aéreo. O frontend nunca chama diretamente uma API de voos com segredo privado.

## 2. Arquitetura alvo

```text
Web App
  |
API Gateway / Backend
  |-- Auth / Users
  |-- Search Orchestrator
  |-- Deal Engine / FlyScore
  |-- Alert Service
  |-- Subscription Service
  |-- AI Intent Service
  |
  |-- Provider Adapter: Amadeus
  |-- Provider Adapter: Duffel
  |-- Provider Adapter: Skyscanner Partner
  |
PostgreSQL
Redis / Cache
Queue + Workers
Email/Push Provider
Observability
```

## 3. Frontend

React + Vite + TypeScript.

Responsabilidades:
- UI e navegação;
- estado do usuário;
- busca e filtros;
- renderização de oportunidades;
- gestão de alertas;
- assinatura;
- nunca armazenar chaves secretas.

## 4. Backend

Sugestão inicial: Node.js + Fastify.

Módulos:
- `auth`
- `users`
- `preferences`
- `search`
- `providers`
- `deals`
- `scores`
- `alerts`
- `subscriptions`
- `notifications`
- `ai`
- `analytics`

## 5. Provider Adapter

Interface comum:

```ts
interface FlightProvider {
  search(input: SearchInput): Promise<NormalizedFlightOffer[]>;
  refresh?(providerOfferId: string): Promise<NormalizedFlightOffer>;
  capabilities(): ProviderCapabilities;
}
```

Benefício: trocar ou combinar provedores sem reescrever o produto.

## 6. Busca

1. usuário envia intenção;
2. AI Intent Service devolve JSON estruturado;
3. validador normaliza aeroportos/datas/orçamento;
4. cache é consultado;
5. Search Orchestrator chama um ou mais providers;
6. normalizador converte respostas para schema interno;
7. Deal Engine calcula score;
8. resposta ordenada volta ao usuário;
9. preços são persistidos para histórico quando permitido pelos termos do provider.

## 7. Radar 24/7

Workers devem executar jobs de monitoramento.

Não pesquisar “todas as rotas do mundo” a cada ciclo. Isso seria caro e ineficiente.

Estratégia:
- priorizar aeroportos mais seguidos;
- rotas/destinos com demanda;
- buscas salvas;
- alertas ativos;
- janelas flexíveis;
- usar fontes indicativas/cache quando apropriado;
- fazer refresh live antes de exibir CTA de compra.

## 8. Cache

Chave sugerida:
`search:{origin}:{destination}:{date}:{return}:{pax}:{cabin}`

TTL depende do tipo da fonte:
- live search: minutos;
- indicative/inspiration: horas;
- aeroportos/metadados: dias/semanas.

Sempre exibir `checkedAt`.

## 9. Alert engine

Worker avalia condições:

```text
alert active?
  -> due for check?
    -> retrieve/refresh data
      -> threshold hit?
        -> deduplicate
          -> create event
            -> send notification
```

## 10. IA

Usos permitidos no MVP:
- intenção → filtros;
- resumo de oportunidade;
- comparação textual;
- explicar FlyScore;
- sugerir flexibilidade.

A IA não deve:
- inventar preços;
- afirmar disponibilidade sem provider;
- afirmar que preço futuro é garantido;
- emitir bilhete sem fluxo transacional autorizado.

## 11. Escalabilidade

Fase 1: monólito modular + workers separados.

Fase 2: separar search workers/notifications apenas quando métricas justificarem.

Evitar microserviços prematuros.

## 12. VPS atual / hospedagem

Para protótipo, um servidor pequeno pode hospedar frontend estático e backend leve, mas produção 24/7 com grande volume de consultas deverá considerar custos de API, jobs, banco, cache, monitoramento e tráfego. A arquitetura deve permitir migrar componentes individualmente.
