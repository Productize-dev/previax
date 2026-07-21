-- Per-section filters (which tags/cities/categories appear)
alter table public.homepage_sections
  add column if not exists config jsonb not null default '{}'::jsonb;

comment on column public.homepage_sections.config is
  'Per-section options, e.g. {"includeKeys":["gated","luxury"]} for filtered auto-rows';
