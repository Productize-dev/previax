-- Hide/unhide communities from the public catalog while keeping them
-- editable for owners (builders) and admins in the dashboard.

alter table public.communities
  add column if not exists is_hidden boolean not null default false;

create index if not exists communities_is_hidden_idx
  on public.communities (is_hidden);

-- Public (anon / buyers) only see visible communities.
-- Owners and admins can still select hidden rows for the dashboard.
drop policy if exists "communities: public read" on public.communities;

create policy "communities: public read"
  on public.communities for select
  using (
    is_hidden = false
    or public.is_admin()
    or (owner_id = auth.uid() and public.is_active())
  );

-- Semantic search should never surface hidden communities.
create or replace function public.match_communities(
  query_embedding vector(1536),
  match_count int default 12,
  similarity_threshold float default 0.0
)
returns table (id text, similarity float)
language sql stable
set search_path = public
as $$
  select c.id, 1 - (c.embedding <=> query_embedding) as similarity
  from public.communities c
  where c.embedding is not null
    and c.is_hidden = false
    and 1 - (c.embedding <=> query_embedding) >= similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
