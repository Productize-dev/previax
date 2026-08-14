-- Apartment rentals (relocator bridge): parallel rent catalog.
-- Additive only — does not alter communities/homes.

create type public.apartment_floor_plan_status as enum (
  'available',
  'waitlist',
  'leased'
);

create table public.apartment_communities (
  id                 text primary key default (gen_random_uuid()::text),
  owner_id           uuid references public.profiles (id) on delete set null,
  name               text not null,
  city               text not null,
  description        text not null default '',
  thumbnail_url      text not null default '',
  youtube_url        text not null default '',
  leasing_name       text not null default '',
  leasing_phone      text not null default '',
  leasing_email      text not null default '',
  leasing_photo_url  text not null default '',
  tagline            text,
  amenities          jsonb not null default '[]'::jsonb,
  latitude           double precision,
  longitude          double precision,
  media_gallery      jsonb not null default '[]'::jsonb,
  is_hidden          boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index apartment_communities_city_idx
  on public.apartment_communities (city);
create index apartment_communities_is_hidden_idx
  on public.apartment_communities (is_hidden);
create index apartment_communities_owner_idx
  on public.apartment_communities (owner_id);

create table public.apartment_floor_plans (
  id                       text primary key default (gen_random_uuid()::text),
  apartment_community_id   text not null
    references public.apartment_communities (id) on delete cascade,
  name                     text not null default '',
  rent                     numeric not null default 0,
  bedrooms                 integer not null default 0,
  bathrooms                numeric not null default 0,
  sqft                     integer not null default 0,
  image_urls               jsonb not null default '[]'::jsonb,
  description              text not null default '',
  status                   public.apartment_floor_plan_status not null default 'available',
  amenities                jsonb not null default '[]'::jsonb,
  highlights               jsonb not null default '[]'::jsonb,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index apartment_floor_plans_community_idx
  on public.apartment_floor_plans (apartment_community_id);

create trigger set_updated_at
  before update on public.apartment_communities
  for each row execute function public.set_updated_at();

create trigger set_updated_at
  before update on public.apartment_floor_plans
  for each row execute function public.set_updated_at();

alter table public.apartment_communities enable row level security;
alter table public.apartment_floor_plans enable row level security;

-- Public read when visible; admins see hidden rows for dashboard.
create policy "apartment_communities: public read"
  on public.apartment_communities for select
  using (is_hidden = false or public.is_admin());

create policy "apartment_communities: admin write"
  on public.apartment_communities for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "apartment_floor_plans: public read"
  on public.apartment_floor_plans for select
  using (
    public.is_admin()
    or exists (
      select 1
      from public.apartment_communities c
      where c.id = apartment_floor_plans.apartment_community_id
        and c.is_hidden = false
    )
  );

create policy "apartment_floor_plans: admin write"
  on public.apartment_floor_plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- Append rent homepage section for existing layouts (idempotent).
insert into public.homepage_sections (id, section_key, title, enabled, sort_order)
select 'hp-rent-apartments', 'rent-apartments', null, true, 155
where not exists (
  select 1 from public.homepage_sections where section_key = 'rent-apartments'
);

grant select on public.apartment_communities to anon, authenticated;
grant select on public.apartment_floor_plans to anon, authenticated;
grant all on public.apartment_communities to authenticated, service_role;
grant all on public.apartment_floor_plans to authenticated, service_role;
