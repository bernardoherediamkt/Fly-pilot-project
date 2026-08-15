# FlyPilot

FlyPilot é uma plataforma de inteligência de viagens por assinatura. O produto combina radar de oportunidades, busca inteligente e alertas personalizados para ajudar viajantes e profissionais de turismo a identificar passagens aéreas com melhor relação entre preço, flexibilidade e conveniência.

## Estado do projeto

Versão atual: `v0.1.1-vercel-foundation`

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

## Vercel

Esta branch está preparada para deploy direto na **Vercel** a partir do repositório GitHub.

- `vite.config.ts`: base `/` para domínio de produção;
- `vercel.json`: preset Vite, build `npm run build`, saída `dist` e rewrite para SPA;
- `.nvmrc` + `package.json`: Node 22.x;
- `.vercelignore`: exclusões de deploy;
- workflow antigo de GitHub Pages removido.

Veja `docs/VERCEL_DEPLOY.md` para o passo a passo.

## Documentação

Comece por `docs/PRD.md`.


## Deploy oficial: Vercel

A hospedagem principal do FlyPilot passa a ser a **Vercel**. O repositório continua no GitHub, enquanto a Vercel cuida dos builds e deployments.

- Framework: Vite + React + TypeScript
- Build: `npm run build`
- Saída: `dist`
- Node: 22.x
- Configuração: `vercel.json`
- Guia: `docs/VERCEL_DEPLOY.md`

Fluxo recomendado: **GitHub → Vercel → URL de produção**.
