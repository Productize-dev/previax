-- =====================================================================
-- Fase 6 — Señales de engagement + Top 10 automático + feed de actividad
--
--   1) track_community_event(): RPC pública (anon) que registra vistas,
--      guardados y clics en ofertas. Alimenta view_count/save_count y
--      activity_events (ventanas semana/mes para el ranking).
--   2) compute_top10(): recalcula los ranks 1-10 de un periodo a partir
--      de las señales, respetando overrides manuales (is_auto = false).
--      La llama el cron (/api/cron/top10) o el admin desde el dashboard.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tracking de señales (sitio público, usuarios anónimos)
-- ---------------------------------------------------------------------
create or replace function public.track_community_event(
  p_community_id text,
  p_event_type   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in (
    'community_viewed', 'community_saved', 'community_unsaved', 'offer_clicked'
  ) then
    raise exception 'Unsupported event type: %', p_event_type;
  end if;

  if not exists (select 1 from public.communities where id = p_community_id) then
    return;  -- comunidad borrada o id inválido: ignora silenciosamente
  end if;

  insert into public.activity_events (actor_id, type, entity_id)
  values (auth.uid(), p_event_type, p_community_id);

  if p_event_type = 'community_viewed' then
    update public.communities
       set view_count = view_count + 1
     where id = p_community_id;
  elsif p_event_type = 'community_saved' then
    update public.communities
       set save_count = save_count + 1
     where id = p_community_id;
  elsif p_event_type = 'community_unsaved' then
    update public.communities
       set save_count = greatest(save_count - 1, 0)
     where id = p_community_id;
  end if;
end;
$$;

revoke all on function public.track_community_event(text, text) from public;
grant execute on function public.track_community_event(text, text)
  to anon, authenticated, service_role;

-- Índice para agregaciones por comunidad + ventana temporal
create index if not exists activity_events_entity_created_idx
  on public.activity_events (entity_id, created_at desc);

-- ---------------------------------------------------------------------
-- 2) Top 10 automático
--    score = vistas·1 + guardados·3 + clics en oferta·2 (en la ventana).
--    'all-time' usa los contadores acumulados de communities.
--    Slots manuales (is_auto = false) conservan su rank; el cálculo
--    llena solo los ranks restantes.
-- ---------------------------------------------------------------------
create or replace function public.compute_top10(p_period top10_period)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window   interval;
  v_inserted integer := 0;
  v_rank     integer;
  v_row      record;
begin
  v_window := case p_period
    when 'week'  then interval '7 days'
    when 'month' then interval '30 days'
    else null
  end;

  -- Limpia solo los slots calculados; los manuales permanecen.
  delete from public.top10_communities
   where period = p_period and is_auto = true;

  v_rank := 1;

  for v_row in (
    with scores as (
      select
        c.id as community_id,
        case
          when v_window is null then
            c.view_count * 1 + c.save_count * 3
          else (
            select
              count(*) filter (where e.type = 'community_viewed') * 1
              + (count(*) filter (where e.type = 'community_saved')
                 - count(*) filter (where e.type = 'community_unsaved')) * 3
              + count(*) filter (where e.type = 'offer_clicked') * 2
            from public.activity_events e
            where e.entity_id = c.id
              and e.created_at >= now() - v_window
          )
        end as score
      from public.communities c
    )
    select community_id, score
    from scores
    where score > 0
      and community_id not in (
        select community_id from public.top10_communities
        where period = p_period  -- excluye overrides manuales ya colocados
      )
    order by score desc, community_id
    limit 10
  )
  loop
    -- Busca el siguiente rank libre (los manuales pueden ocupar cualquiera).
    while v_rank <= 10 and exists (
      select 1 from public.top10_communities
      where period = p_period and rank = v_rank
    ) loop
      v_rank := v_rank + 1;
    end loop;

    exit when v_rank > 10;

    insert into public.top10_communities (community_id, rank, period, is_auto)
    values (v_row.community_id, v_rank, p_period, true);

    v_inserted := v_inserted + 1;
    v_rank := v_rank + 1;
  end loop;

  return v_inserted;
end;
$$;

-- Solo el backend (service role) o un admin autenticado pueden recalcular.
revoke all on function public.compute_top10(top10_period) from public;
grant execute on function public.compute_top10(top10_period) to service_role;

create or replace function public.compute_top10_as_admin(p_period top10_period)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can recompute the Top 10';
  end if;
  return public.compute_top10(p_period);
end;
$$;

revoke all on function public.compute_top10_as_admin(top10_period) from public;
grant execute on function public.compute_top10_as_admin(top10_period)
  to authenticated;
