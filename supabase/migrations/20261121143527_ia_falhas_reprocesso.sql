-- 21/11/2026: o que fazer quando a IA falha (Gemini fora, teto de gastos, JSON inválido).
-- 1. Nova tentativa automática a cada hora (pg_cron), no máximo 3 por relato.
-- 2. Bloqueia aprovar relato sem saída da IA (antes, aprovar não fazia nada no mapa, em silêncio).
-- 3. View relatos_com_problema para a moderação (só acessível pelo painel do Supabase).

-- 1. Nova tentativa automática
alter table public.relatos add column if not exists ia_tentativas smallint not null default 0;

create or replace function public.reprocessar_pendentes() returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare r record; n integer := 0;
begin
  -- Relato pendente, sem saída da IA, parado há mais de 10 min (com erro, nunca
  -- processado ou travado no meio). Até 5 por vez para não estourar o limite do Gemini.
  for r in
    select id from public.relatos
    where status_moderacao = 'pendente'
      and ia_json is null
      and ia_tentativas < 3
      and coalesce(processado_em, created_at) < now() - interval '10 minutes'
    order by created_at
    limit 5
  loop
    update public.relatos set ia_tentativas = ia_tentativas + 1 where id = r.id;
    perform public.reprocessar(r.id);
    n := n + 1;
  end loop;
  return n;
end; $$;
revoke execute on function public.reprocessar_pendentes() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('reprocessar-relatos', '0 * * * *', 'select public.reprocessar_pendentes()');

-- 2. Não aprovar relato que a IA não processou
create or replace function public.bloquear_aprovacao_sem_ia() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status_moderacao = 'aprovado' and old.status_moderacao is distinct from 'aprovado' and new.ia_json is null then
    raise exception 'Este relato ainda não foi processado pela IA. Espere a nova tentativa automática (a cada hora) ou rode select reprocessar(''%''); antes de aprovar.', new.id;
  end if;
  return new;
end; $$;
revoke execute on function public.bloquear_aprovacao_sem_ia() from public, anon, authenticated;
create trigger relato_aprovacao_exige_ia before update of status_moderacao on public.relatos
  for each row execute function public.bloquear_aprovacao_sem_ia();

-- 3. Relatos com problema (para abrir junto com a moderação)
create or replace view public.relatos_com_problema with (security_invoker = true) as
select r.id, r.created_at, r.origem,
  coalesce(l.nome, r.lugar_texto) as lugar,
  case
    when r.ia_tentativas >= 3 then 'esgotou as 3 tentativas automáticas'
    when r.ia_erro is not null then 'erro da IA (nova tentativa na próxima hora)'
    when r.processado_em is null then 'ainda não processado'
    else 'processamento travado'
  end as situacao,
  r.ia_tentativas, r.ia_erro, r.texto
from public.relatos r
left join public.lugares l on l.id = r.lugar_id
where r.status_moderacao = 'pendente' and r.ia_json is null
  and coalesce(r.processado_em, r.created_at) < now() - interval '2 minutes'
order by r.created_at;
revoke all on public.relatos_com_problema from anon, authenticated;
