-- Builder marketing video for landing "Meet the Builders" row.
alter table public.builders
  add column if not exists youtube_url text;
