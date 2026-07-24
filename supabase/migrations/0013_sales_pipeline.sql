-- Community publishing pipeline + notifications (after sales role exists)

-- Pipeline status as text for simpler migrations
alter table public.communities
  add column if not exists pipeline_status text not null default 'live',
  add column if not exists submitted_by uuid references public.profiles (id) on delete set null,
  add column if not exists step1_completed_at timestamptz,
  add column if not exists step2_submitted_at timestamptz,
  add column if not exists admin_approved_at timestamptz,
  add column if not exists admin_approved_by uuid references public.profiles (id) on delete set null,
  add column if not exists builder_approved_at timestamptz,
  add column if not exists builder_deadline_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists rejection_reason text;

alter table public.communities
  drop constraint if exists communities_pipeline_status_check;

alter table public.communities
  add constraint communities_pipeline_status_check
  check (pipeline_status in (
    'draft',
    'awaiting_video',
    'video_review',
    'pending_admin',
    'pending_builder',
    'live',
    'rejected'
  ));

update public.communities
set pipeline_status = 'live'
where pipeline_status is null or pipeline_status = '';

create index if not exists communities_pipeline_status_idx
  on public.communities (pipeline_status);

create index if not exists communities_submitted_by_idx
  on public.communities (submitted_by);

-- Notifications
create table if not exists public.notifications (
  id           text primary key default (gen_random_uuid()::text),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  type         text not null,
  title        text not null,
  body         text not null,
  community_id text references public.communities (id) on delete set null,
  href         text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications: self read" on public.notifications;
create policy "notifications: self read"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "notifications: self update" on public.notifications;
create policy "notifications: self update"
  on public.notifications for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

create or replace function public.is_sales()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'sales' and status = 'active'
  );
$$;

create or replace function public.owns_builder(p_builder_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.builders
    where id = p_builder_id
      and owner_id = auth.uid()
      and public.is_active()
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role user_role;
  new_status user_status;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::user_role, 'buyer');

  if requested_role in ('admin', 'sales') then
    requested_role := 'buyer';
  end if;

  if requested_role in ('builder', 'lender') then
    new_status := 'pending';
  else
    new_status := 'active';
  end if;

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

drop policy if exists "communities: public read" on public.communities;

create policy "communities: public read"
  on public.communities for select
  using (
    (is_hidden = false and pipeline_status = 'live')
    or public.is_admin()
    or (owner_id = auth.uid() and public.is_active())
    or (submitted_by = auth.uid() and public.is_sales())
    or (
      pipeline_status = 'pending_builder'
      and public.is_active()
      and (
        public.owns_builder(builder_id)
        or exists (
          select 1
          from public.builders b
          where b.owner_id = auth.uid()
            and (
              b.id = communities.builder_id
              or communities.builder_ids @> jsonb_build_array(b.id)
            )
        )
      )
    )
  );

drop policy if exists "communities: owner or admin write" on public.communities;

create policy "communities: owner or admin write"
  on public.communities for all
  using (
    public.is_admin()
    or (owner_id = auth.uid() and public.is_active())
    or (
      public.is_sales()
      and submitted_by = auth.uid()
      and pipeline_status in (
        'draft',
        'awaiting_video',
        'video_review',
        'rejected'
      )
    )
    or (
      pipeline_status = 'pending_builder'
      and public.is_active()
      and (
        public.owns_builder(builder_id)
        or exists (
          select 1 from public.builders b
          where b.owner_id = auth.uid()
            and (
              b.id = communities.builder_id
              or communities.builder_ids @> jsonb_build_array(b.id)
            )
        )
      )
    )
  )
  with check (
    public.is_admin()
    or (owner_id = auth.uid() and public.is_active())
    or (public.is_sales() and submitted_by = auth.uid())
    or (
      pipeline_status = 'pending_builder'
      and public.is_active()
      and (
        public.owns_builder(builder_id)
        or exists (
          select 1 from public.builders b
          where b.owner_id = auth.uid()
            and (
              b.id = communities.builder_id
              or communities.builder_ids @> jsonb_build_array(b.id)
            )
        )
      )
    )
  );

create or replace function public.notify_admins(
  p_type text,
  p_title text,
  p_body text,
  p_community_id text default null,
  p_href text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, community_id, href)
  select p.id, p_type, p_title, p_body, p_community_id, p_href
  from public.profiles p
  where p.role = 'admin' and p.status = 'active';
end;
$$;

grant execute on function public.notify_admins(text, text, text, text, text)
  to authenticated, service_role;
grant execute on function public.is_sales() to authenticated, anon, service_role;
grant execute on function public.owns_builder(text) to authenticated, anon, service_role;
