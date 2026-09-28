-- Explicit sales INSERT on communities.
-- The FOR ALL write policy's WITH CHECK already intended to allow this, but
-- browser inserts were still rejected (RLS 401). A dedicated INSERT policy
-- makes the allow-path unambiguous for authenticated sales drafts.

drop policy if exists "communities: sales insert" on public.communities;

create policy "communities: sales insert"
  on public.communities
  for insert
  to authenticated
  with check (
    public.is_sales()
    and submitted_by = auth.uid()
    and (owner_id is null or owner_id = auth.uid())
    and pipeline_status in (
      'draft',
      'awaiting_video',
      'video_review',
      'rejected'
    )
  );
