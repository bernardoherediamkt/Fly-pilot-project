# FlyPilot — Product Requirements Document (PRD)

Versão: 0.1  
Status: Foundation / MVP Definition

## 1. Visão do produto

FlyPilot é um copiloto inteligente de viagens focado em descobrir oportunidades aéreas e reduzir o esforço de pesquisa do usuário.

A proposta não é ser apenas mais um comparador de preços. O FlyPilot deve responder a duas necessidades centrais:

1. **Descoberta passiva:** “Mostre oportunidades realmente boas saindo dos aeroportos que me interessam, mesmo que eu ainda não tenha escolhido o destino.”
2. **Busca intencional:** “Quero viajar para determinado destino, período ou orçamento. Encontre as melhores combinações e me diga se vale a pena comprar agora.”

## 2. Problema

Pesquisar passagem barata exige abrir várias abas, repetir pesquisas, acompanhar alterações de preço e interpretar se uma tarifa está de fato abaixo do normal. Usuários também deixam de descobrir oportunidades por estarem presos a destinos previamente escolhidos.

Profissionais de turismo têm uma dor adicional: precisam monitorar várias rotas e clientes ao mesmo tempo e transformar oportunidades em recomendações rapidamente.

## 3. Público inicial

### Persona A — Viajante econômico
- quer viajar mais vezes;
- possui flexibilidade parcial de datas/destino;
- é sensível a preço;
- aceita receber oportunidades inesperadas;
- quer entender se uma tarifa é boa sem dominar o mercado aéreo.

### Persona B — Viajante planejador
- já sabe origem/destino;
- quer acompanhar uma viagem específica;
- quer alertas por teto de preço;
- valoriza “comprar agora x esperar”.

### Persona C — Agente/consultor de viagens
- monitora múltiplas origens, destinos e clientes;
- precisa criar alertas em escala;
- quer identificar oportunidades antes de concorrentes;
- precisa compartilhar uma oportunidade com cliente rapidamente.

## 4. Proposta de valor

**“As melhores oportunidades de viagem encontram você — e o FlyPilot explica quando realmente valem a pena.”**

## 5. Pilares do MVP

### 5.1 Radar de ofertas
Feed contínuo de oportunidades detectadas pelo sistema.

Cada oportunidade deverá conter:
- origem e destino;
- cidade/país;
- preço total em moeda local;
- preço de referência/histórico quando disponível;
- economia percentual estimada;
- faixa de datas em que a oportunidade aparece;
- companhia(s);
- escalas;
- bagagem quando disponível;
- data/hora da última verificação;
- score FlyPilot;
- CTA “ver detalhes”;
- CTA “criar alerta”;
- CTA “ir para reserva/parceiro”.

### 5.2 Busca inteligente
Entrada natural + formulário estruturado.

Exemplos:
- “Quero sair do Rio e ir para algum lugar de praia em outubro gastando até R$ 1.500.”
- “São Paulo para Santiago entre 10 e 20 de setembro, 2 adultos, no máximo 1 escala.”
- “Me mostre destinos internacionais por até R$ 2.000 ida e volta.”

A IA converte a intenção em filtros estruturados, mas o resultado de preço sempre deve vir de fonte de dados de viagem, nunca ser inventado pelo modelo.

### 5.3 Alertas
Usuário poderá criar alertas por:
- rota específica;
- destino aberto;
- teto de preço;
- faixa de datas;
- aeroporto(s) de saída;
- duração da viagem;
- cabine;
- máximo de escalas;
- percentual mínimo de queda;
- score mínimo de oportunidade.

Canais de v1:
- in-app;
- e-mail.

Evolução:
- push;
- WhatsApp;
- Telegram.

### 5.4 FlyScore
Índice de oportunidade de 0 a 100.

Primeira fórmula heurística:
- 40% desconto versus referência/histórico;
- 20% raridade da tarifa;
- 15% qualidade do itinerário;
- 10% flexibilidade de datas;
- 10% confiabilidade/frescura do preço;
- 5% conveniência da viagem.

Exibição sugerida:
- 90–100: Excepcional
- 80–89: Excelente
- 70–79: Muito boa
- 60–69: Boa
- abaixo de 60: comum / não destacar no radar principal

O score deve mostrar explicação, não só número.

### 5.5 “Comprar ou esperar”
No MVP, começar como recomendação heurística baseada em:
- distância até a viagem;
- diferença para preço de referência;
- velocidade recente da variação;
- disponibilidade/frescura do resultado;
- sazonalidade conhecida quando houver dados suficientes.

Importante: apresentar como estimativa, nunca garantia.

## 6. Dashboard

Primeira tela após login:
- saudação curta;
- campo de busca principal;
- seção “Melhores oportunidades agora”;
- filtros rápidos: Nacional / Internacional / Até R$ X / Direto / Fim de semana;
- alertas ativos;
- viagens acompanhadas;
- oportunidades recentes compatíveis com preferências;
- resumo de economia potencial.

## 7. Fluxos essenciais

### Fluxo 1 — Descobrir oportunidade
Login → aeroporto de origem → Radar → filtrar → abrir oportunidade → entender FlyScore → seguir para reserva.

### Fluxo 2 — Buscar viagem específica
Busca → IA interpreta → usuário confirma filtros → motor consulta provider → resultados → ranking → detalhe → alerta ou reserva.

### Fluxo 3 — Criar alerta
Busca/oportunidade → criar alerta → definir condição → confirmar canal → sistema monitora → condição atingida → notificação.

### Fluxo 4 — Agente
Dashboard profissional → múltiplos radares → oportunidade → adicionar nota/cliente → compartilhar link.

## 8. Assinatura

Modelo preliminar a testar:

### Explorer (gratuito)
- radar limitado;
- poucas buscas/dia;
- 1 alerta;
- delay em algumas oportunidades.

### Pilot (individual)
- radar completo;
- buscas ampliadas;
- múltiplos alertas;
- FlyScore + explicação;
- monitoramento prioritário.

### Pro (agentes)
- múltiplos perfis/clientes;
- mais alertas e rotas;
- compartilhamento profissional;
- histórico e organização de oportunidades;
- exportação/relatórios no futuro.

Preços serão validados após teste de interesse e custo real de APIs.

## 9. Diferenciais desejados

1. **Radar + busca + alerta no mesmo produto.**
2. **FlyScore explicável.**
3. **Busca conversacional que vira filtros reais.**
4. **Descoberta por orçamento, não só por destino.**
5. **Modo profissional para agentes.**
6. **Camada provider-agnostic:** não ficar dependente de uma única API.
7. **Explicação de oportunidade:** “por que este preço chamou atenção?”.
8. **Watchlist flexível:** origem + orçamento + tipo de viagem, sem exigir destino.

## 10. Fora do MVP

- emissão própria de bilhetes;
- hotéis;
- aluguel de carros;
- milhas/pontos com cotação automática;
- pacote dinâmico;
- marketplace de agentes;
- chat humano;
- app nativo;
- previsão por ML proprietária com alto volume histórico.

Esses itens entram em fases posteriores.

## 11. Métricas principais

North Star inicial: **oportunidades qualificadas abertas por usuário ativo por semana**.

Outras métricas:
- cadastro → primeiro alerta;
- cadastro → primeira busca;
- CTR oportunidade → parceiro;
- alertas acionados;
- taxa de retorno semanal;
- conversão free → pago;
- custo por busca API;
- receita média por usuário;
- economia potencial identificada;
- latência média de busca.

## 12. Requisitos não funcionais

- preços com timestamp explícito;
- nunca apresentar preço de IA sem fonte;
- tolerância a indisponibilidade de providers;
- cache para reduzir custo;
- observabilidade de workers;
- idempotência de alertas;
- segurança de segredos de API somente no backend;
- LGPD: consentimento, exclusão e minimização de dados;
- arquitetura preparada para filas e workers 24/7.

## 13. Critérios de sucesso do protótipo

O protótipo deve permitir demonstrar, com dados simulados:
- navegar no dashboard;
- visualizar cards de oportunidades;
- filtrar o radar;
- executar uma busca natural;
- converter a busca em filtros;
- visualizar resultados classificados;
- criar/desativar alertas;
- abrir tela de assinatura;
- alternar visão consumidor/agente futuramente.

## 14. Decisões para a próxima rodada

- mercado inicial e aeroportos prioritários;
- provider de dados do primeiro piloto;
- preço da assinatura;
- regra comercial de afiliados/reserva;
- canal de alerta prioritário;
- identidade visual final;
- marca e domínio.
