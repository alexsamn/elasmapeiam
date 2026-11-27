-- Aplicado no projeto Supabase "elasmapeiam" em 16/11/2026 (via MCP).
-- Os dados fictícios (15 lugares) foram inseridos na mesma migração; veja o painel.

create table public.lugares (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('bicicletario','oficina')),
  bairro text not null,
  endereco text,
  lat double precision not null,
  lng double precision not null,
  criterios jsonb not null default '{}'::jsonb,
  status text not null default 'desconhecido' check (status in ('funcionando','fechado','quebrado','nao_existe_mais','desconhecido')),
  confirmacoes int not null default 0,
  ultima_confirmacao timestamptz,
  publicado boolean not null default true,
  ficticio boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.relatos (
  id uuid primary key default gen_random_uuid(),
  lugar_id uuid references public.lugares(id) on delete set null,
  lugar_texto text check (lugar_texto is null or char_length(lugar_texto) <= 120),
  texto text not null check (char_length(texto) between 10 and 1000),
  status_moderacao text not null default 'pendente' check (status_moderacao in ('pendente','aprovado','rejeitado','arquivado')),
  motivo_moderacao text,
  ia_json jsonb, ia_tipo text, relato_limpo text, precisa_revisao boolean, motivo_revisao text, ia_erro text,
  modelo text, prompt_versao text,
  origem text not null default 'app' check (origem in ('app','teste')),
  ip_hash text,
  created_at timestamptz not null default now(),
  processado_em timestamptz
);

create table public.execucoes_ia (
  id uuid primary key default gen_random_uuid(),
  relato_id uuid references public.relatos(id) on delete cascade,
  created_at timestamptz not null default now(),
  sucesso boolean not null, duracao_ms int, modelo text, prompt_versao text, erro text
);

alter table public.lugares enable row level security;
alter table public.relatos enable row level security;
alter table public.execucoes_ia enable row level security;
create policy "lugares publicados sao publicos" on public.lugares for select to anon, authenticated using (publicado = true);
revoke all on public.relatos from anon, authenticated;
revoke all on public.execucoes_ia from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.lugares from anon, authenticated;

-- Moderação: ao aprovar um relato ligado a um lugar, atualiza o lugar.
create or replace function public.aplicar_relato_aprovado() returns trigger
language plpgsql security definer set search_path = public as $$
declare novos jsonb := '{}'::jsonb; k text; v jsonb; novo_status text;
begin
  if new.status_moderacao = 'aprovado' and old.status_moderacao is distinct from 'aprovado'
     and new.lugar_id is not null and new.ia_json is not null then
    for k, v in select * from jsonb_each(coalesce(new.ia_json->'criterios', '{}'::jsonb)) loop
      if v is not null and v <> 'null'::jsonb and v <> '"nao_informado"'::jsonb and v <> '[]'::jsonb then
        novos := novos || jsonb_build_object(k, v);
      end if;
    end loop;
    novo_status := new.ia_json->>'status';
    update public.lugares set criterios = criterios || novos,
      status = case when novo_status in ('funcionando','fechado','quebrado','nao_existe_mais') then novo_status else status end,
      confirmacoes = confirmacoes + 1, ultima_confirmacao = new.created_at
    where id = new.lugar_id;
  end if;
  return new;
end; $$;
revoke execute on function public.aplicar_relato_aprovado() from public, anon, authenticated;
create trigger relato_aprovado after update of status_moderacao on public.relatos
  for each row execute function public.aplicar_relato_aprovado();

-- Automação: cada relato novo chama a função processar-relato (Gemini).
create extension if not exists pg_net with schema extensions;
create or replace function public.disparar_processamento() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(url := 'https://abgwjcmpohzihfjraqew.supabase.co/functions/v1/processar-relato',
    body := jsonb_build_object('relato_id', new.id), headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 30000);
  return new;
end; $$;
revoke execute on function public.disparar_processamento() from public, anon, authenticated;
create trigger relato_novo_processa after insert on public.relatos
  for each row execute function public.disparar_processamento();

create or replace function public.reprocessar(p_relato uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.relatos set processado_em = null, ia_erro = null where id = p_relato;
  perform net.http_post(url := 'https://abgwjcmpohzihfjraqew.supabase.co/functions/v1/processar-relato',
    body := jsonb_build_object('relato_id', p_relato), headers := '{"Content-Type":"application/json"}'::jsonb,
    timeout_milliseconds := 30000);
end; $$;
revoke execute on function public.reprocessar(uuid) from public, anon, authenticated;
