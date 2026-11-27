-- Aplicado em 16/11/2026. processar-relato só aceita chamadas com o header
-- x-processar-token. O valor fica no Vault (secret "processar_token"), nunca no Git.
-- Criação do secret (rodar uma vez, com um valor aleatório gerado na hora):
--   select vault.create_secret('<valor aleatório>', 'processar_token');

create or replace function public.token_processamento() returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'processar_token' limit 1;
$$;
revoke execute on function public.token_processamento() from public, anon, authenticated;

create or replace function public.disparar_processamento() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform net.http_post(
    url := 'https://abgwjcmpohzihfjraqew.supabase.co/functions/v1/processar-relato',
    body := jsonb_build_object('relato_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-processar-token', public.token_processamento()),
    timeout_milliseconds := 30000);
  return new;
end; $$;

create or replace function public.reprocessar(p_relato uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.relatos set processado_em = null, ia_erro = null where id = p_relato;
  perform net.http_post(
    url := 'https://abgwjcmpohzihfjraqew.supabase.co/functions/v1/processar-relato',
    body := jsonb_build_object('relato_id', p_relato),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-processar-token', public.token_processamento()),
    timeout_milliseconds := 30000);
end; $$;
