# Deploy do FlyPilot na Vercel

Esta versão do FlyPilot usa a Vercel como destino principal de publicação.

## Configuração esperada

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 22.x
- Root directory: raiz do repositório

## Deploy pelo GitHub

1. Faça push deste projeto para o repositório do FlyPilot no GitHub.
2. Na Vercel, escolha **Add New > Project**.
3. Importe o repositório do FlyPilot.
4. Confirme que o Framework Preset foi detectado como **Vite**.
5. Confirme o Build Command `npm run build` e Output Directory `dist`.
6. Clique em **Deploy**.

Depois que o projeto estiver conectado ao GitHub, novos pushes para a branch de produção geram novos deployments automaticamente. Branches e pull requests podem gerar Preview Deployments.

## SPA e rotas

O arquivo `vercel.json` contém um rewrite para `index.html`, preparando o frontend para rotas client-side quando o protótipo adotar React Router.

## Variáveis de ambiente futuras

Quando o FlyPilot começar a integrar provedores de voos, autenticação, banco de dados e IA, as chaves não devem ser colocadas no frontend nem commitadas no GitHub. Elas deverão ser cadastradas em **Project Settings > Environment Variables** na Vercel e acessadas por funções/backend.

## Próximas integrações previstas

- Auth
- banco de dados
- APIs de ofertas de voos
- camada de IA
- notificações e alertas
- billing/assinatura

Essas integrações ainda não fazem parte da v0.1 Foundation.
