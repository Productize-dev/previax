-- =====================================================================
-- Previax — Fase 2: auth real.
--
-- 1) Elimina las policies TEMPORALES de la Fase 1 (escritura pública).
--    Desde ahora rige la RLS por propiedad/rol definida en 0001:
--      - builders/communities/lenders: escribe el owner (owner_id) o admin.
--      - series/homes: escribe el dueño del builder padre o admin.
--      - featured/featured_communities/top10/homepage_series/tag_labels:
--        solo admin.
--      - Lectura pública (SELECT) del catálogo intacta para el sitio.
--
-- 2) owner_id toma auth.uid() por defecto: cuando un builder/lender crea
--    un registro desde el dashboard, queda como dueño automáticamente y
--    satisface el WITH CHECK de su policy.
-- =====================================================================

drop policy "phase1: public write" on public.builders;
drop policy "phase1: public write" on public.series;
drop policy "phase1: public write" on public.communities;
drop policy "phase1: public write" on public.homes;
drop policy "phase1: public write" on public.lenders;
drop policy "phase1: public write" on public.featured_items;
drop policy "phase1: public write" on public.featured_communities;
drop policy "phase1: public write" on public.top10_communities;
drop policy "phase1: public write" on public.homepage_series;
drop policy "phase1: public write" on public.community_tag_labels;
drop policy "phase1: public upload" on storage.objects;

alter table public.builders    alter column owner_id set default auth.uid();
alter table public.communities alter column owner_id set default auth.uid();
alter table public.lenders     alter column owner_id set default auth.uid();

-- 3) Solo cuentas ACTIVAS escriben: un builder/lender 'pending' o
--    'rejected' no puede tocar el catálogo aunque sea owner.
create or replace function public.is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

drop policy "builders: owner or admin write" on public.builders;
create policy "builders: owner or admin write"
  on public.builders for all
  using ((owner_id = auth.uid() and public.is_active()) or public.is_admin())
  with check ((owner_id = auth.uid() and public.is_active()) or public.is_admin());

drop policy "series: owner or admin write" on public.series;
create policy "series: owner or admin write"
  on public.series for all
  using (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.builders b
      where b.id = series.builder_id and b.owner_id = auth.uid()
    ))
  )
  with check (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.builders b
      where b.id = series.builder_id and b.owner_id = auth.uid()
    ))
  );

drop policy "communities: owner or admin write" on public.communities;
create policy "communities: owner or admin write"
  on public.communities for all
  using ((owner_id = auth.uid() and public.is_active()) or public.is_admin())
  with check ((owner_id = auth.uid() and public.is_active()) or public.is_admin());

drop policy "homes: owner or admin write" on public.homes;
create policy "homes: owner or admin write"
  on public.homes for all
  using (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.series s
      join public.builders b on b.id = s.builder_id
      where s.id = homes.series_id and b.owner_id = auth.uid()
    ))
  )
  with check (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.series s
      join public.builders b on b.id = s.builder_id
      where s.id = homes.series_id and b.owner_id = auth.uid()
    ))
  );

drop policy "lenders: owner or admin write" on public.lenders;
create policy "lenders: owner or admin write"
  on public.lenders for all
  using ((owner_id = auth.uid() and public.is_active()) or public.is_admin())
  with check ((owner_id = auth.uid() and public.is_active()) or public.is_admin());

drop policy "offers: owner lender or admin write" on public.lender_offers;
create policy "offers: owner lender or admin write"
  on public.lender_offers for all
  using (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.lenders l
      where l.id = lender_offers.lender_id and l.owner_id = auth.uid()
    ))
  )
  with check (
    public.is_admin() or (public.is_active() and exists (
      select 1 from public.lenders l
      where l.id = lender_offers.lender_id and l.owner_id = auth.uid()
    ))
  );

-- 4) Anti-escalación: "profiles: self can update basic" permite UPDATE de
--    la propia fila, pero sin este trigger el usuario podría cambiarse
--    role/status a sí mismo (p. ej. hacerse admin). Solo un admin puede
--    modificar esos campos.
create or replace function public.protect_profile_role_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() null = service_role / SQL Editor (ya pasaron RLS o la
  -- omiten); un anon nunca llega aquí porque RLS le bloquea el UPDATE.
  if (new.role is distinct from old.role
      or new.status is distinct from old.status)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change role or status';
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_status
  before update on public.profiles
  for each row execute function public.protect_profile_role_status();

-- 5) El trigger de signup también guarda company_name (builders/lenders).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role user_role;
  new_status     user_status;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::user_role, 'buyer');

  if requested_role = 'admin' then
    requested_role := 'buyer';  -- bloquea auto-asignación de admin
  end if;

  new_status := case
    when requested_role in ('builder', 'lender') then 'pending'::user_status
    else 'active'::user_status
  end;

  insert into public.profiles (id, role, status, full_name, company_name, email)
  values (
    new.id,
    requested_role,
    new_status,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'company_name',
    new.email
  );
  return new;
end;
$$;

-- =====================================================================
-- CREAR EL PRIMER ADMIN (una vez, en el SQL Editor):
--
--   update public.profiles
--      set role = 'admin', status = 'active'
--    where email = 'tu-email@ejemplo.com';
--
-- (Requiere haberte registrado antes en /signup con ese email.)
-- =====================================================================
