# ElasMapeiam 🚲

> **Nome provisório.** O app passou a ser para toda a comunidade ciclista, então o nome está em revisão.

Mapa colaborativo de bicicletários em São Paulo que mostra **se o lugar ainda funciona** e **quando isso foi confirmado pela última vez**, a partir de relatos de quem pedala.

Projeto Final do curso **IA Aplicada da {reprograma}** (novembro de 2026).

> ⚠️ **Demonstração.** Os 15 lugares do mapa (Pinheiros e Vila Madalena) são **fictícios**. Nenhum dado pessoal real está no código ou no banco.

---

## O problema

Quem pedala em SP não sabe, antes de sair de casa, se vai ter onde deixar a bike com segurança. A informação existe, mas fica velha: um bicicletário recomendado fecha, quebra ou some, e ninguém atualiza.

**Evidências** (questionário próprio, 144 respostas, 15 e 16/11/2026, comunidades de ciclistas de SP):

| Achado | Resultado |
| --- | --- |
| Deixaram de ir a algum lugar porque não sabiam onde deixar a bike com segurança | 63 de 134 (47%), 2º motivo depois do clima |
| Encontraram o bicicletário fechado, quebrado ou extinto | 42 de 87 usuários de bicicletário (48%) |
| Prenderam a bike "onde acharam na hora" | 86 de 144 (60%) |

Complementos: um questionário anterior (86 respostas, mar/2026) e a análise anonimizada de conversas de um grupo de WhatsApp de ciclistas, feita com o conhecimento das administradoras.

**Limites:** amostra de conveniência (recrutamento em grupos de ciclistas), não representa todas as pessoas que pedalam em SP.

---

## Como funciona

1. A ciclista abre **Contribuir**, escolhe o lugar e conta como foi, em texto livre.
2. O relato é salvo como **pendente**.
3. A IA (Gemini) lê o texto e extrai **critérios** (coberto, vigia, câmera, cadastro, prende o quadro, custo, lotação etc.), o **status** do lugar e uma versão do relato **sem dados pessoais**.
4. Uma moderadora revisa e aprova.
5. O card do lugar é atualizado: critérios, status e "Confirmado por N ciclistas · última em dd/mm/aaaa".

### Por que IA

Sem IA, cada relato livre teria de ser lido e transformado em campos à mão. A IA faz a extração e a remoção de dados pessoais; a moderação humana continua obrigatória antes de qualquer coisa ir para o mapa.

A qualidade da extração está sendo avaliada com **20 casos reais × 3 avaliadoras × 2 rodadas** (critérios: fidelidade, completude, status, tipo e utilidade).

---

## Stack

| Parte | Tecnologia |
| --- | --- |
| Frontend | TanStack Start, React, TypeScript, Tailwind CSS |
| Mapa | Leaflet + OpenStreetMap (tiles CARTO) |
| Banco e backend | Supabase (Postgres, RLS, Edge Functions, pg_net, Vault) — região São Paulo |
| IA | Google Gemini (`gemini-3.1-flash-lite`), prompt versionado |
| Publicação | Vercel |
| Design system | ElasMapeiam Library (em `src/design-system/`) |

O protótipo começou no Lovable; o código agora é mantido fora dele, neste repositório.

```
src/
  routes/        index (mapa) e contribuir (envio de relato)
  components/    mapa e componentes de tela
  design-system/ ElasMapeiam Library (tokens, componentes, marcadores)
  data/          lugares (Supabase) e dados fictícios de reserva
supabase/
  functions/     enviar-relato, processar-relato, _shared (prompts, http)
  migrations/    schema, RLS e gatilhos
  README.md      detalhes do backend e consultas úteis
```

Detalhes do fluxo de backend em [`supabase/README.md`](supabase/README.md).

---

## Segurança e privacidade

- **RLS ativo** nas 3 tabelas. O público só lê `lugares` publicados; `relatos` e `execucoes_ia` não têm nenhum acesso público.
- **Chave do Gemini só nos secrets das Edge Functions.** Nunca no frontend, no `.env` ou no Git.
- `processar-relato` só aceita chamadas com token interno (guardado no Vault); sem ele, responde 401.
- **Prompt injection:** tags `<relato>` digitadas pelo usuário são neutralizadas antes de chegar à IA.
- **Limite de 5 relatos por dia** por origem, usando hash HMAC do IP (o IP puro nunca é salvo).
- Texto de 10 a 1.000 caracteres; todo relato entra como pendente.
- O `.env.example` contém apenas chaves **públicas** (CARTO e a publishable key do Supabase), feitas para ficar no navegador.
- Faturamento ativo na API do Gemini, porque no plano gratuito o Google pode usar os textos enviados para melhorar os próprios produtos.
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

Para subir o próprio backend, siga [`supabase/README.md`](supabase/README.md) (migrações + secrets das Edge Functions).

---

## Status

- [x] Mapa com filtros, clusters e cards (dados fictícios)
- [x] Backend no Supabase com RLS
- [x] Fluxo Contribuir + extração com Gemini + registro de execuções
- [x] Publicação na Vercel
- [ ] Validação humana da IA (rodadas 1 e 2)
- [ ] Teste com ciclistas
- [ ] Restringir CORS das funções ao domínio publicado
- [ ] Novo nome do app

### Próximos passos (roadmap)

- Login e cadastro de novos lugares
- Painel de moderação
- Oficinas recomendadas e alertas de roubo por área (sem ponto exato), hoje marcados como "em breve"
- Indicador de lotação por relato

---

## Autora

**Alexsandra Moura** — [LinkedIn](https://www.linkedin.com/in/alexsandramoura) · [Portfólio](https://alexsandramoura.com.br)
