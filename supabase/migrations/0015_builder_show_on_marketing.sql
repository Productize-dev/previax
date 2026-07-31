-- Toggle builder visibility on the public marketing landing.
alter table public.builders
  add column if not exists show_on_marketing boolean not null default true;
