-- Homepage section layout (order, enable/disable, title overrides)
create table public.homepage_sections (
  id          text primary key default (gen_random_uuid()::text),
  section_key text not null unique,
  title       text,
  enabled     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

create policy "hp_sections: public read"
  on public.homepage_sections for select using (true);

create policy "hp_sections: admin write"
  on public.homepage_sections for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.homepage_sections (id, section_key, title, enabled, sort_order) values
  ('hp-hero',                 'hero',                 null, true,  0),
  ('hp-personalized',         'personalized',         null, true,  10),
  ('hp-my-list',              'my-list',              null, true,  20),
  ('hp-saved-homes',          'saved-homes',          null, true,  30),
  ('hp-liked-communities',    'liked-communities',    null, true,  40),
  ('hp-liked-homes',          'liked-homes',          null, true,  50),
  ('hp-trending',             'trending',             null, true,  60),
  ('hp-featured-communities', 'featured-communities', null, true,  70),
  ('hp-top-10',               'top-10',               null, true,  80),
  ('hp-listing-categories',   'listing-categories',   null, true,  90),
  ('hp-main-highlights',      'main-highlights',      null, true,  100),
  ('hp-community-tags',       'community-tags',       null, true,  110),
  ('hp-home-tags',            'home-tags',            null, true,  120),
  ('hp-lenders',              'lenders',              null, true,  130),
  ('hp-cities',               'cities',               null, true,  140),
  ('hp-all-communities',      'all-communities',      null, true,  150);

grant select on public.homepage_sections to anon, authenticated;
grant all on public.homepage_sections to service_role;
