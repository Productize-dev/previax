-- =====================================================================
-- Previax — Esquema inicial de Supabase (Postgres)
-- Generado a partir de src/lib/types.ts
--
-- Cómo usar:
--   1) Crea un proyecto en Supabase.
--   2) Pega este archivo en el SQL Editor y ejecútalo, o guárdalo en
--      supabase/migrations/0001_init.sql y corre `supabase db push`.
--   3) Crea el primer admin (ver bloque al final de este archivo).
--
-- Convenciones:
--   - Columnas en snake_case. El repositorio TS (supabase-repository.ts)
--     mapea a los tipos camelCase de src/lib/types.ts.
--   - Las listas embebidas (rooms, reviews, mediaGallery, schools,
--     nearbyPlaces, highlights, amenities, tags...) se guardan como jsonb
--     para reflejar 1:1 los tipos actuales de Home/Community.
--   - RLS activo en todas las tablas: lectura pública del catálogo,
--     escritura restringida por propiedad (owner) o por rol admin.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensiones
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "vector";      -- pgvector (búsqueda semántica, Fase 4)

-- ---------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------
create type user_role   as enum ('buyer', 'builder', 'lender', 'admin');
create type user_status as enum ('active', 'pending', 'rejected');
create type home_status as enum ('available', 'coming-soon', 'sold');
create type top10_period as enum ('all-time', 'week', 'month');

-- =====================================================================
-- PERFILES  (extiende auth.users)
-- =====================================================================
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         user_role   not null default 'buyer',
  status       user_status not null default 'active',
  full_name    text,
  company_name text,
  email        text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Helper: ¿el usuario actual es admin? (SECURITY DEFINER evita recursión en RLS)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: rol del usuario actual
create or replace function public.current_role_name()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- =====================================================================
-- BUILDERS
-- =====================================================================
create table public.builders (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references public.profiles (id) on delete set null,
  name        text not null,
  logo_url    text,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index builders_owner_idx on public.builders (owner_id);

-- =====================================================================
-- SERIES  (líneas de modelos de un builder)
-- =====================================================================
create table public.series (
  id            uuid primary key default gen_random_uuid(),
  builder_id    uuid not null references public.builders (id) on delete cascade,
  name          text not null,
  description   text,
  thumbnail_url text,
  youtube_url   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index series_builder_idx on public.series (builder_id);

-- =====================================================================
-- COMMUNITIES
-- =====================================================================
create table public.communities (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid references public.profiles (id) on delete set null,
  builder_id        uuid references public.builders (id) on delete set null,
  name              text not null,
  city              text not null,
  description       text not null default '',
  thumbnail_url     text not null default '',
  youtube_url       text not null default '',
  builder_name      text not null default '',
  is_multi_builder  boolean not null default false,
  builder_ids       jsonb  not null default '[]'::jsonb,  -- string[]
  builder_offers    text   not null default '',
  tags              jsonb  not null default '[]'::jsonb,  -- CommunityTag[]
  realtor_name      text   not null default '',
  realtor_phone     text   not null default '',
  realtor_email     text   not null default '',
  realtor_photo_url text   not null default '',
  amenities         jsonb  not null default '[]'::jsonb,
  lenders           jsonb  not null default '[]'::jsonb,  -- string[] (nombres legacy)
  main_highlight    text,
  school_district   text,
  commute_notes     text,
  hoa_range         text,
  offer_expires     text,
  latitude          double precision,
  longitude         double precision,
  tagline           text,
  lifestyle_notes   text,
  school_overview   text,
  schools           jsonb  not null default '[]'::jsonb,  -- SchoolInfo[]
  dining_overview   text,
  nearby_places     jsonb  not null default '[]'::jsonb,  -- NearbyPlace[]
  reviews           jsonb  not null default '[]'::jsonb,  -- CommunityReview[]
  media_gallery     jsonb  not null default '[]'::jsonb,  -- MediaItem[]
  -- Señales para Top 10 automático (Fase 6)
  view_count        integer not null default 0,
  save_count        integer not null default 0,
  -- Búsqueda semántica (Fase 4). Dimensión según el modelo de embeddings.
  embedding         vector(1536),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index communities_owner_idx   on public.communities (owner_id);
create index communities_builder_idx on public.communities (builder_id);
create index communities_city_idx    on public.communities (city);
-- Índice vectorial (ajusta lists según volumen de datos):
create index communities_embedding_idx
  on public.communities using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- =====================================================================
-- HOMES  (modelos de casa, pertenecen a una serie)
-- =====================================================================
create table public.homes (
  id                 uuid primary key default gen_random_uuid(),
  series_id          uuid not null references public.series (id) on delete cascade,
  community_id       uuid references public.communities (id) on delete cascade,
  price              numeric not null default 0,
  bedrooms           integer not null default 0,
  bathrooms          numeric not null default 0,
  sqft               integer not null default 0,
  model_name         text,
  address            text,
  image_urls         jsonb  not null default '[]'::jsonb,  -- string[]
  description        text   not null default '',
  youtube_url        text,
  status             home_status,
  tags               jsonb  not null default '[]'::jsonb,  -- HomeTag[]
  listing_categories jsonb  not null default '[]'::jsonb,  -- HomeListingCategory[]
  tagline            text,
  features_overview  text,
  highlights         jsonb  not null default '[]'::jsonb,  -- string[]
  rooms              jsonb  not null default '[]'::jsonb,  -- HomeRoom[]
  media_gallery      jsonb  not null default '[]'::jsonb,  -- MediaItem[]
  reviews            jsonb  not null default '[]'::jsonb,  -- HomeReview[]
  embedding          vector(1536),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index homes_series_idx    on public.homes (series_id);
create index homes_community_idx on public.homes (community_id);
create index homes_price_idx     on public.homes (price);
create index homes_beds_idx      on public.homes (bedrooms);

-- =====================================================================
-- LENDERS
-- =====================================================================
create table public.lenders (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references public.profiles (id) on delete set null,
  name        text not null,
  description text not null default '',
  image_url   text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index lenders_owner_idx on public.lenders (owner_id);

-- =====================================================================
-- LENDER OFFERS  (NUEVO — ofertas de financiamiento por comunidad, Fase 3)
-- =====================================================================
create table public.lender_offers (
  id           uuid primary key default gen_random_uuid(),
  lender_id    uuid not null references public.lenders (id) on delete cascade,
  community_id uuid references public.communities (id) on delete cascade,
  title        text not null,
  rate         text,           -- ej. "5.99% APR"
  terms        text,           -- ej. "30-year fixed"
  description  text not null default '',
  image_url    text,
  valid_until  text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index lender_offers_lender_idx    on public.lender_offers (lender_id);
create index lender_offers_community_idx on public.lender_offers (community_id);

-- =====================================================================
-- CURADURÍA (solo admin escribe)
-- =====================================================================

-- Carrusel del hero (FeaturedItem)
create table public.featured_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  subtitle     text not null default '',
  youtube_url  text not null default '',
  community_id uuid references public.communities (id) on delete set null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Row "Featured Communities" (FeaturedCommunityRow)
create table public.featured_communities (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- Top 10 (Top10CommunitySlot) — con periodo semana/mes (Fase 6)
create table public.top10_communities (
  id           uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  rank         integer not null check (rank between 1 and 10),
  period       top10_period not null default 'all-time',
  is_auto      boolean not null default false,  -- true = calculado, false = override manual
  created_at   timestamptz not null default now(),
  unique (rank, period)
);

-- Rows de series en el homepage (HomepageSeriesRow)
create table public.homepage_series (
  id         uuid primary key default gen_random_uuid(),
  series_id  uuid not null references public.series (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Etiquetas de tags de comunidad personalizadas (customCommunityTagLabels)
create table public.community_tag_labels (
  tag_key uuid primary key default gen_random_uuid(),
  slug    text not null unique,
  label   text not null
);

-- =====================================================================
-- ACTIVIDAD  (feed del admin + señales de personalización, Fases 4 y 6)
-- =====================================================================
create table public.activity_events (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles (id) on delete set null,
  type       text not null,        -- 'community_created', 'offer_published', 'account_approved', 'community_viewed', ...
  entity_id  uuid,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_events_type_idx    on public.activity_events (type);
create index activity_events_created_idx  on public.activity_events (created_at desc);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- 1) updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','builders','series','communities','homes',
    'lenders','lender_offers'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end$$;

-- 2) Crear profile automáticamente al registrarse un usuario.
--    El rol/estado se leen de raw_user_meta_data (enviados en signUp):
--      role: 'buyer' | 'builder' | 'lender'  (nunca 'admin' por signup público)
--    builder/lender arrancan 'pending' hasta aprobación de un admin.
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

  insert into public.profiles (id, role, status, full_name, email)
  values (
    new.id,
    requested_role,
    new_status,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles            enable row level security;
alter table public.builders            enable row level security;
alter table public.series              enable row level security;
alter table public.communities         enable row level security;
alter table public.homes               enable row level security;
alter table public.lenders             enable row level security;
alter table public.lender_offers       enable row level security;
alter table public.featured_items      enable row level security;
alter table public.featured_communities enable row level security;
alter table public.top10_communities   enable row level security;
alter table public.homepage_series     enable row level security;
alter table public.community_tag_labels enable row level security;
alter table public.activity_events     enable row level security;

-- ---------- PROFILES ----------
create policy "profiles: self or admin can read"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles: self can update basic"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles: admin can update any"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- CATÁLOGO PÚBLICO (lectura abierta) ----------
-- El sitio público muestra el catálogo sin login.
create policy "builders: public read"     on public.builders            for select using (true);
create policy "series: public read"        on public.series              for select using (true);
create policy "communities: public read"   on public.communities         for select using (true);
create policy "homes: public read"         on public.homes               for select using (true);
create policy "lenders: public read"       on public.lenders             for select using (true);
create policy "offers: public read"        on public.lender_offers       for select using (is_active or public.is_admin());
create policy "featured: public read"      on public.featured_items      for select using (true);
create policy "feat_comm: public read"     on public.featured_communities for select using (true);
create policy "top10: public read"         on public.top10_communities   for select using (true);
create policy "hp_series: public read"     on public.homepage_series     for select using (true);
create policy "tag_labels: public read"    on public.community_tag_labels for select using (true);

-- ---------- BUILDERS: dueño o admin escriben ----------
create policy "builders: owner or admin write"
  on public.builders for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- series pertenece a un builder del dueño (o admin)
create policy "series: owner or admin write"
  on public.series for all
  using (
    public.is_admin() or exists (
      select 1 from public.builders b
      where b.id = series.builder_id and b.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.builders b
      where b.id = series.builder_id and b.owner_id = auth.uid()
    )
  );

-- ---------- COMMUNITIES: dueño o admin ----------
create policy "communities: owner or admin write"
  on public.communities for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- ---------- HOMES: dueño de la serie o admin ----------
create policy "homes: owner or admin write"
  on public.homes for all
  using (
    public.is_admin() or exists (
      select 1 from public.series s
      join public.builders b on b.id = s.builder_id
      where s.id = homes.series_id and b.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.series s
      join public.builders b on b.id = s.builder_id
      where s.id = homes.series_id and b.owner_id = auth.uid()
    )
  );

-- ---------- LENDERS: dueño o admin ----------
create policy "lenders: owner or admin write"
  on public.lenders for all
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "offers: owner lender or admin write"
  on public.lender_offers for all
  using (
    public.is_admin() or exists (
      select 1 from public.lenders l
      where l.id = lender_offers.lender_id and l.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.lenders l
      where l.id = lender_offers.lender_id and l.owner_id = auth.uid()
    )
  );

-- ---------- CURADURÍA: solo admin escribe ----------
create policy "featured: admin write"   on public.featured_items      for all using (public.is_admin()) with check (public.is_admin());
create policy "feat_comm: admin write"  on public.featured_communities for all using (public.is_admin()) with check (public.is_admin());
create policy "top10: admin write"      on public.top10_communities   for all using (public.is_admin()) with check (public.is_admin());
create policy "hp_series: admin write"  on public.homepage_series     for all using (public.is_admin()) with check (public.is_admin());
create policy "tag_labels: admin write" on public.community_tag_labels for all using (public.is_admin()) with check (public.is_admin());

-- ---------- ACTIVIDAD ----------
create policy "activity: admin read" on public.activity_events for select using (public.is_admin());
create policy "activity: auth insert" on public.activity_events
  for insert to authenticated with check (true);

-- =====================================================================
-- BÚSQUEDA SEMÁNTICA — función de match (Fase 4)
-- Llamar vía RPC desde /api/ai/search con el embedding de la query.
-- =====================================================================
create or replace function public.match_communities(
  query_embedding vector(1536),
  match_count int default 12,
  similarity_threshold float default 0.0
)
returns table (id uuid, similarity float)
language sql stable as $$
  select c.id, 1 - (c.embedding <=> query_embedding) as similarity
  from public.communities c
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- =====================================================================
-- STORAGE — bucket público para imágenes (Fase 1)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media: public read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media: authenticated write"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "media: authenticated update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media');

create policy "media: owner or admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or public.is_admin()));

-- =====================================================================
-- CREAR EL PRIMER ADMIN
-- ---------------------------------------------------------------------
-- 1) Regístrate normalmente en la app (rol buyer) con tu email.
-- 2) Ejecuta esto UNA vez en el SQL Editor con tu email:
--
--    update public.profiles
--       set role = 'admin', status = 'active'
--     where email = 'foundermusic17@gmail.com';
--
-- =====================================================================
