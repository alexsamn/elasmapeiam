-- 20/11/2026 (registrada no repositório em 21/11, copiada do histórico de migrações do Supabase):
-- estrutura para importar os lugares reais da lista da amiga e tirar os fictícios.

-- 1) Backup dos lugares fictícios e das ligações dos relatos (antes de apagar)
create table public.backup_lugares_ficticios as
  select l.*, now() as backup_em from public.lugares l where l.ficticio;
create table public.backup_relatos_lugar_ficticio as
  select r.id as relato_id, r.lugar_id, l.nome as lugar_nome, r.origem, now() as backup_em
  from public.relatos r join public.lugares l on l.id = r.lugar_id where l.ficticio;
alter table public.backup_lugares_ficticios enable row level security;
alter table public.backup_relatos_lugar_ficticio enable row level security;

-- 2) Tipo de vaga (null = ainda não informado)
alter table public.lugares add column tipo_vaga text
  check (tipo_vaga in ('bicicletario','estacionamento','paraciclo','sem_estrutura'));

-- 3) Origem 'importacao' (lista da amiga) e limite de texto maior só para ela
alter table public.relatos drop constraint relatos_origem_check;
alter table public.relatos add constraint relatos_origem_check
  check (origem in ('app','teste','importacao'));
alter table public.relatos drop constraint relatos_texto_check;
alter table public.relatos add constraint relatos_texto_check
  check ((char_length(texto) between 10 and 1000) or (origem = 'importacao' and char_length(texto) between 10 and 3000));

-- 4) Relato importado aprovado: só soma critérios. Sem data conhecida, não conta confirmação nem muda status.
create or replace function public.aplicar_relato_aprovado()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare
  novos jsonb := '{}'::jsonb;
  k text;
  v jsonb;
  novo_status text;
begin
  if new.status_moderacao = 'aprovado'
     and old.status_moderacao is distinct from 'aprovado'
     and new.lugar_id is not null
     and new.ia_json is not null then
    for k, v in select * from jsonb_each(coalesce(new.ia_json->'criterios', '{}'::jsonb)) loop
      if v is not null and v <> 'null'::jsonb and v <> '"nao_informado"'::jsonb and v <> '[]'::jsonb then
        novos := novos || jsonb_build_object(k, v);
      end if;
    end loop;
    if new.origem = 'importacao' then
      update public.lugares set criterios = criterios || novos where id = new.lugar_id;
    else
      novo_status := new.ia_json->>'status';
      update public.lugares
         set criterios = criterios || novos,
             status = case when novo_status in ('funcionando','fechado','quebrado','nao_existe_mais') then novo_status else status end,
             confirmacoes = confirmacoes + 1,
             ultima_confirmacao = new.created_at
       where id = new.lugar_id;
    end if;
  end if;
  return new;
end;
$function$;
