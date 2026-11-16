# Backend do ElasMapeiam (Supabase)

Projeto Supabase: `elasmapeiam` (região sa-east-1, São Paulo).

## Como o fluxo funciona

1. O formulário **Contribuir** chama a função `enviar-relato`.
2. `enviar-relato` valida o texto (10 a 1.000 caracteres), aplica o limite de envios por dia
   (hash HMAC do IP, nunca o IP puro) e grava em `relatos` com `status_moderacao = 'pendente'`.
3. A gravação dispara o gatilho `relato_novo_processa` no banco, que chama `processar-relato` (pg_net).
4. `processar-relato` chama o Gemini com o prompt versionado, valida o JSON, grava a saída no relato
   e registra a execução em `execucoes_ia` (prova da automação).
5. A moderadora muda `status_moderacao` para `aprovado` no editor de tabelas. O gatilho
   `relato_aprovado` atualiza o lugar (critérios, status, confirmações e data da última confirmação).

## Segurança

- RLS ligado nas 3 tabelas. Público só lê `lugares` publicados. `relatos` e `execucoes_ia` não têm
  nenhuma permissão pública: só as funções (service role) leem e gravam.
- A chave do Gemini fica só nos secrets das Edge Functions. Nunca no frontend, no `.env` ou no Git.

## Secrets das Edge Functions (Dashboard > Edge Functions > Secrets)

| Nome | Obrigatório | Valor |
| --- | --- | --- |
| `GEMINI_API_KEY` | sim | chave do Google AI Studio (projeto com faturamento ativo) |
| `GEMINI_MODEL` | não | padrão `gemini-3.1-flash-lite` |
| `PROMPT_VERSAO` | não | padrão `v1`; mude para `v2` na rodada 2 |
| `LIMITE_RELATOS_DIA` | não | padrão `5` |
| `ALLOWED_ORIGIN` | não | endereço do app publicado, para restringir o CORS |

## Reprocessar um relato (ex.: rodada 2 com o prompt v2)

```sql
select public.reprocessar('<id do relato>');
-- todos os casos de teste:
select public.reprocessar(id) from relatos where origem = 'teste';
```

## Prova da automação

```sql
select created_at, sucesso, duracao_ms, modelo, prompt_versao, erro
from execucoes_ia order by created_at desc;
```
