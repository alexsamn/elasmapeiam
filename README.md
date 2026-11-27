# ElasMapeiam 🚲

Mapa colaborativo de bicicletários em São Paulo. Para cada lugar, mostra **o último relato de quem pedalou até lá, com a data**, e responde a uma pergunta: **dá pra parar a bike aqui?**

Começou como Projeto Final do curso **IA Aplicada da {reprograma}** (apresentado em 18/11/2026). Agora está sendo preparado para o lançamento numa comunidade de ciclistas de SP.

**👉 Acesse: [elasmapeiam.vercel.app](https://elasmapeiam.vercel.app/)** (feito para celular; funciona no computador).

---

## O problema

Quem pedala em SP muitas vezes só descobre na porta se dá para deixar a bike. A informação até circula, mas envelhece: um bicicletário recomendado fecha, quebra ou muda de lugar, e ninguém atualiza.

**Evidências** (questionário próprio, 172 respostas, 15 e 16/11/2026, comunidades de ciclistas de SP):

| Achado | Resultado |
| --- | --- |
| Citaram "não sabia onde deixar a bike com segurança" entre os motivos para deixar de ir a algum lugar | 77 de 162 (48%), empatado com o clima |
| Encontraram o bicicletário fechado, quebrado ou extinto | 54 de 105 usuários de bicicletário (51%) |
| Prenderam a bike "onde acharam na hora" | 102 de 172 (59%) |

Também usei um questionário anterior (86 respostas, mar/2026) e a análise anonimizada de conversas de um grupo de WhatsApp de ciclistas, feita com o conhecimento das administradoras: 46 mensagens sobre bicicletário em 3,5 meses, 11 perguntas sobre onde parar a bike e pelo menos 3 sem resposta.

**Limites:** a amostra é de conveniência (recrutamento em grupos de ciclistas) e não representa todas as pessoas que pedalam em SP.

---

## Como funciona

1. No card de um bicicletário, a ciclista toca em **Contribuir** (o lugar já vem escolhido). Para um lugar que não está no mapa, usa **Sugerir lugar**.
2. Responde **"Dá pra parar a bike aqui?"**: sim, com ressalvas ou não (fechado, quebrado, não existe mais). Pode marcar características (coberto, tem vigia, câmera, cadastro na entrada, prende o quadro, costuma lotar, gratuito ou pago) e escrever um comentário. Só a resposta é obrigatória.
3. Se houver comentário, a IA (Gemini) extrai dele os **critérios** do lugar, o **status** e uma versão do texto **sem dados pessoais**.
4. Tudo entra como **pendente**. A moderação revisa e aprova.
5. Aprovado, o card mostra o status, os critérios e a **data da última confirmação**. Uma sugestão aprovada vira um lugar novo no mapa.

### Por que IA

O comentário livre é onde aparece o que não cabe num formulário: "mudou de lugar mas continua", "tem que levar cadeado", "pendurar pela roda estraga o aro". Sem IA, cada texto teria de ser lido e transformado em campos à mão. A IA faz a extração e tira os dados pessoais, mas nada vai para o mapa sem aprovação humana.

### Validação da IA

A extração foi avaliada com **20 relatos reais × 3 avaliadoras × 2 rodadas**, em 5 critérios (fidelidade, completude, status, tipo e utilidade). Entre as rodadas, o prompt passou da v1 para a v2.

| | Rodada 1 (prompt v1) | Rodada 2 (prompt v2) |
| --- | --- | --- |
| Aprovação total (3 avaliadoras) | 86% | 82% |
| Aprovação só das avaliadoras B e C | 87% | 90% |

- Meta de fidelidade (≥ 80% na rodada 2): atingida.
- Meta de zero reprovações em status: não atingida (2 casos, nas duas rodadas).
- Na rodada 2, uma avaliadora passou a reprovar perguntas e mensagens fora do escopo que na rodada 1 tinha aprovado, com a mesma saída da IA. Por isso aparecem os dois números. As notas não foram alteradas.

Também houve um teste do app com 5 ciclistas em 18/11/2026, que enviaram 9 relatos reais. O feedback delas gerou o botão Contribuir no card e a avaliação estruturada.

---

## Dados do mapa

São 33 lugares reais, vindos de uma lista do Google Maps feita por uma ciclista, que autorizou o uso. Os endereços foram revisados um a um. Nem todo lugar é bicicletário: o card informa o tipo de vaga (bicicletário, estacionamento, paraciclo).

---

## Stack

| Parte | Tecnologia |
| --- | --- |
| Frontend | TanStack Start, React, TypeScript, Tailwind CSS (PWA) |
| Mapa | Leaflet, tiles CARTO Positron (OpenStreetMap como reserva) |
| Busca de endereço | Nominatim (OpenStreetMap), limitada a SP |
| Banco e backend | Supabase (Postgres, RLS, Edge Functions, pg_net, pg_cron, Vault), região São Paulo |
| IA | Google Gemini (`gemini-3.1-flash-lite`), prompt versionado |
| Publicação | Vercel |
| Design system | ElasMapeiam Library (em `src/design-system/`) |

---

## Segurança e privacidade

- **RLS ativo** em todas as tabelas. O público só lê lugares publicados e relatos aprovados.
- **A chave do Gemini fica só nos secrets das Edge Functions.** Nunca no frontend, no `.env` ou no Git.
- `processar-relato` só aceita chamadas com token interno (guardado no Vault); sem ele, responde 401.
- **CORS fechado** no domínio publicado.
- **Prompt injection:** tags `<relato>` digitadas no comentário são neutralizadas antes de chegar à IA.
- **Limite de 5 envios por dia** por origem, com hash HMAC do IP (o IP puro nunca é salvo).
- Comentário de 10 a 1.000 caracteres; todo envio entra como pendente.
- **Falhas da IA:** até 3 tentativas imediatas (erros 429/500/503 e tempo esgotado) e nova tentativa automática de hora em hora. Um relato sem saída da IA não pode ser aprovado.
- **Custos sob controle:** teto de gastos do Gemini no Google Cloud e chave da CARTO restrita ao domínio do app.
- Faturamento ativo na API do Gemini, porque no plano gratuito o Google pode usar os textos enviados para melhorar os próprios produtos.
- O `.env.example` só tem chaves **públicas** (CARTO e a publishable key do Supabase), feitas para ficar no navegador.
- Nomes de estabelecimentos e pessoas citados na pesquisa foram anonimizados e não aparecem no repositório.

---

## Rodar localmente

Requisito: [Bun](https://bun.sh).

```sh
git clone https://github.com/alexsamn/elasmapeiam.git
cd elasmapeiam
cp .env.example .env.local
bun install
bun run dev
```

Outros comandos: `bun run build`, `bun run test`, `bun run lint`.

Para subir o próprio backend, siga [`supabase/README.md`](supabase/README.md) (migrações e secrets das Edge Functions).

O app precisa de navegador de 2023 em diante (Safari 16.4+, Chrome 111+).

---

## Status

- [x] Mapa com 33 lugares reais, busca de endereço e lista da área visível
- [x] Backend no Supabase com RLS
- [x] Avaliação estruturada ("Dá pra parar a bike aqui?") com extração pela IA
- [x] Validação humana da IA (2 rodadas)
- [x] Teste com ciclistas (18/11/2026)
- [x] Publicação na Vercel: [elasmapeiam.vercel.app](https://elasmapeiam.vercel.app/)
- [ ] Abrir para a comunidade (meta: até 02/12/2026)
- [ ] 30 ciclistas avaliando 30 bicicletários (meta: até 18/12/2026)

### Próximos passos

- Corrigir os erros que o prompt v2 ainda não resolveu e calibrar os critérios com as avaliadoras
- Painel de moderação
- Oficinas recomendadas (hoje marcadas como "em breve")
- Ícones diferentes para paraciclo e bicicletário
- Suporte a celulares mais antigos

---

## Autora

**Alexsandra Moura** · [LinkedIn](https://www.linkedin.com/in/alexsandramoura) · [Portfólio](https://alexsandramoura.com.br)
