-- 21/11/2026: transforma uma sugestão do "Sugerir lugar" em lugar no mapa.
-- Uso (editor SQL do Supabase), com as coordenadas copiadas do Google Maps:
--   select criar_lugar_da_sugestao('<id do relato>', 'Sesc Pinheiros', 'Pinheiros',
--     -23.5670, -46.6920, 'bicicletario', 'R. Paes Leme, 195');
-- Cria o lugar (publicado), liga o relato a ele e aplica a aprovação
-- (status, pílulas, critérios da IA, confirmação e data). Se algo falhar, nada é gravado.
create or replace function public.criar_lugar_da_sugestao(
  p_relato uuid, p_nome text, p_bairro text, p_lat double precision, p_lng double precision,
  p_tipo_vaga text default null, p_endereco text default null)
returns uuid language plpgsql set search_path = public as $$
declare r record; novo uuid;
begin
  select * into r from relatos where id = p_relato for update;
  if not found then raise exception 'Relato % não existe.', p_relato; end if;
  if r.lugar_id is not null then raise exception 'Este relato já está ligado a um lugar.'; end if;
  if r.status_moderacao in ('rejeitado', 'arquivado') then raise exception 'Este relato está %. Mude para pendente antes.', r.status_moderacao; end if;
  if coalesce(trim(p_nome), '') = '' or coalesce(trim(p_bairro), '') = '' then raise exception 'Informe o nome e o bairro do lugar.'; end if;
  if p_lat not between -24.01 and -23.35 or p_lng not between -46.83 and -46.36 then
    raise exception 'Coordenadas fora da cidade de São Paulo (lat %, lng %). Confira se não trocou a ordem.', p_lat, p_lng;
  end if;
  if p_tipo_vaga is not null and p_tipo_vaga not in ('bicicletario', 'estacionamento', 'paraciclo', 'sem_estrutura') then
    raise exception 'Tipo de vaga inválido: use bicicletario, estacionamento, paraciclo ou sem_estrutura.';
  end if;
  if exists (select 1 from lugares where lower(nome) = lower(trim(p_nome))) then
    raise exception 'Já existe um lugar chamado "%". Se for o mesmo, ligue o relato a ele (update relatos set lugar_id = ...) em vez de criar outro.', trim(p_nome);
  end if;

  insert into lugares (nome, tipo, bairro, endereco, lat, lng, tipo_vaga, publicado, ficticio)
  values (trim(p_nome), 'bicicletario', trim(p_bairro), nullif(trim(p_endereco), ''), p_lat, p_lng, p_tipo_vaga, true, false)
  returning id into novo;

  update relatos set lugar_id = novo, lugar_texto = null where id = p_relato;
  -- Já aprovado: volta a pendente e aprova de novo para aplicar ao lugar novo.
  if r.status_moderacao = 'aprovado' then update relatos set status_moderacao = 'pendente' where id = p_relato; end if;
  update relatos set status_moderacao = 'aprovado' where id = p_relato;
  return novo;
end; $$;
revoke execute on function public.criar_lugar_da_sugestao(uuid, text, text, double precision, double precision, text, text) from public, anon, authenticated;
