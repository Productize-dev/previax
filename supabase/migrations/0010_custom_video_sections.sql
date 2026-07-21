-- Custom homepage video rows (e.g. "By Previax")
-- Allow multiple sections with section_key = 'custom-videos'

alter table public.homepage_sections
  drop constraint if exists homepage_sections_section_key_key;

create unique index if not exists homepage_sections_builtin_key_uidx
  on public.homepage_sections (section_key)
  where section_key <> 'custom-videos';

create table if not exists public.homepage_section_videos (
  id            text primary key default (gen_random_uuid()::text),
  section_id    text not null references public.homepage_sections (id) on delete cascade,
  title         text not null,
  subtitle      text,
  youtube_url   text not null,
  thumbnail_url text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists homepage_section_videos_section_idx
  on public.homepage_section_videos (section_id, sort_order);

alter table public.homepage_section_videos enable row level security;

create policy "hp_section_videos: public read"
  on public.homepage_section_videos for select using (true);

create policy "hp_section_videos: admin write"
  on public.homepage_section_videos for all
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.homepage_section_videos to anon, authenticated;
grant all on public.homepage_section_videos to service_role;
