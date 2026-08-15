# FlyPilot

FlyPilot é uma plataforma de inteligência de viagens por assinatura. O produto combina radar de oportunidades, busca inteligente e alertas personalizados para ajudar viajantes e profissionais de turismo a identificar passagens aéreas com melhor relação entre preço, flexibilidade e conveniência.

## Estado do projeto

Versão inicial: `v0.1-foundation`

Esta entrega contém:
- PRD completo do MVP;
- arquitetura técnica;
- modelo de dados;
- contrato inicial de APIs;
- análise de concorrentes;
- roadmap de produto;
- scaffold React + Vite + TypeScript pronto para Codex/GitHub;
- dados simulados para o primeiro protótipo.

## MVP 1.0

1. Dashboard com oportunidades do dia
2. Radar de ofertas por aeroporto/orçamento
3. Busca inteligente por linguagem natural
4. Alertas personalizados
5. Conta e preferências
6. Planos de assinatura

## Stack proposta

- Frontend: React + Vite + TypeScript
- Estilo: CSS modular/tokens (primeira versão)
- Backend futuro: Node.js + Fastify ou NestJS
- Banco: PostgreSQL
- Cache/filas: Redis
- Workers: cron/queue workers para monitoramento
- Flight providers: camada abstrata para Amadeus / Duffel / Skyscanner Partner APIs
- IA: provider abstrato para interpretação de intenção e explicação de oportunidade
- Auth: Clerk/Supabase/Auth.js a decidir
- Billing: Stripe ou provedor local compatível com o mercado-alvo

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

O workflow em `.github/workflows/deploy-pages.yml` está preparado para publicar esta versão no GitHub Pages. O `vite.config.ts` usa caminhos relativos (`base: "./"`), adequados para um protótipo hospedado em subdiretório do GitHub Pages.

## Documentação

Comece por `docs/PRD.md`.
