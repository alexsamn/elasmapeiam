-- 21/11/2026: avaliação estruturada (feedback das testadoras).
-- A pessoa responde "Dá pra parar a bike aqui?" (obrigatório), marca pílulas (opcional)
-- e pode escrever um texto (opcional). Só o texto passa pela IA.

-- 1. Novas colunas
alter table public.relatos add column if not exists situacao text
  check (situacao is null or situacao in ('sim','ressalvas','fechado','quebrado','nao_existe_mais'));
alter table public.relatos add column if not exists marcadores jsonb not null default '{}'::jsonb;

-- 2. Texto passa a ser opcional (mas o relato precisa ter texto ou situação)
alter table public.relatos alter column texto drop not null;
alter table public.relatos drop constraint if exists relatos_texto_check;
alter table public.relatos add constraint relatos_texto_check check (
  texto is null
  or (char_length(texto) between 10 and 1000)
  or (origem = 'importacao' and char_length(texto) between 10 and 3000));
alter table public.relatos add constraint relatos_texto_ou_situacao check (texto is not null or situacao is not null);

-- 3. IA só roda quando há texto
create or replace function public.disparar_processamento() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.texto is null then return new; end if;
  perform net.http_post(
    url := 'https://abgwjcmpohzihfjraqew.supabase.co/functions/v1/processar-relato',
    body := jsonb_build_object('relato_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-processar-token', public.token_processamento()),
    timeout_milliseconds := 30000);
  return new;
end; $$;

create or replace function public.reprocessar_pendentes() returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare r record; n integer := 0;
begin
  for r in
    select id from public.relatos
    where status_moderacao = 'pendente' and texto is not null and ia_json is null and ia_tentativas < 3
      and coalesce(processado_em, created_at) < now() - interval '10 minutes'
    order by created_at limit 5
  loop
    update public.relatos set ia_tentativas = ia_tentativas + 1 where id = r.id;
    perform public.reprocessar(r.id);
    n := n + 1;
  end loop;
  return n;
end; $$;

-- 4. Bloqueio da aprovação só vale para relato com texto ainda sem IA
create or replace function public.bloquear_aprovacao_sem_ia() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status_moderacao = 'aprovado' and old.status_moderacao is distinct from 'aprovado'
     and new.texto is not null and new.ia_json is null then
    raise exception 'Este relato ainda não foi processado pela IA. Espere a nova tentativa automática (a cada hora) ou rode select reprocessar(''%''); antes de aprovar.', new.id;
  end if;
  return new;
end; $$;

-- 5. Aprovar: critérios da IA + pílulas da pessoa (as pílulas valem mais);
--    status vem da resposta da pessoa; sem resposta, da IA.
create or replace function public.aplicar_relato_aprovado() returns trigger
language plpgsql security definer set search_path = public as $$
declare novos jsonb := '{}'::jsonb; k text; v jsonb; novo_status text;
begin
  if new.status_moderacao = 'aprovado' and old.status_moderacao is distinct from 'aprovado'
     and new.lugar_id is not null and (new.ia_json is not null or new.situacao is not null) then
    for k, v in select * from jsonb_each(coalesce(new.ia_json->'criterios', '{}'::jsonb)) loop
      if v is not null and v <> 'null'::jsonb and v <> '"nao_informado"'::jsonb and v <> '[]'::jsonb then
        novos := novos || jsonb_build_object(k, v);
      end if;
    end loop;
    novos := novos || coalesce(new.marcadores, '{}'::jsonb);
    if new.origem = 'importacao' then
      update public.lugares set criterios = criterios || novos where id = new.lugar_id;
    else
      novo_status := case
        when new.situacao in ('sim','ressalvas') then 'funcionando'
        when new.situacao in ('fechado','quebrado','nao_existe_mais') then new.situacao
        else new.ia_json->>'status' end;
      update public.lugares
         set criterios = criterios || novos,
             status = case when novo_status in ('funcionando','fechado','quebrado','nao_existe_mais') then novo_status else status end,
             confirmacoes = confirmacoes + 1,
             ultima_confirmacao = new.created_at
       where id = new.lugar_id;
    end if;
  end if;
  return new;
end; $$;

-- 6. Relatos com problema: só os que têm texto
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
where r.status_moderacao = 'pendente' and r.texto is not null and r.ia_json is null
  and coalesce(r.processado_em, r.created_at) < now() - interval '2 minutes'
order by r.created_at;
revoke all on public.relatos_com_problema from anon, authenticated;
