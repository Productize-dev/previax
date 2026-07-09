-- =====================================================================
-- Previax — Fase 1 (TEMPORAL): escritura pública del catálogo
--
-- El dashboard todavía no tiene autenticación (llega en la Fase 2), y el
-- repositorio corre en el navegador con la anon key. Estas policies abren
-- la escritura del catálogo y la subida de imágenes para que la app
-- funcione end-to-end durante la Fase 1.
--
-- ⚠️ IMPORTANTE: la Fase 2 (auth + roles) DEBE eliminar estas policies
-- con el bloque "ROLLBACK" comentado al final de este archivo.
-- =====================================================================

create policy "phase1: public write" on public.builders             for all using (true) with check (true);
create policy "phase1: public write" on public.series               for all using (true) with check (true);
create policy "phase1: public write" on public.communities          for all using (true) with check (true);
create policy "phase1: public write" on public.homes                for all using (true) with check (true);
create policy "phase1: public write" on public.lenders              for all using (true) with check (true);
create policy "phase1: public write" on public.featured_items       for all using (true) with check (true);
create policy "phase1: public write" on public.featured_communities for all using (true) with check (true);
create policy "phase1: public write" on public.top10_communities    for all using (true) with check (true);
create policy "phase1: public write" on public.homepage_series      for all using (true) with check (true);
create policy "phase1: public write" on public.community_tag_labels for all using (true) with check (true);

create policy "phase1: public upload"
  on storage.objects for insert to anon
  with check (bucket_id = 'media');

-- =====================================================================
-- ROLLBACK (ejecutar en la Fase 2, al activar Supabase Auth):
--
-- drop policy "phase1: public write" on public.builders;
-- drop policy "phase1: public write" on public.series;
-- drop policy "phase1: public write" on public.communities;
-- drop policy "phase1: public write" on public.homes;
-- drop policy "phase1: public write" on public.lenders;
-- drop policy "phase1: public write" on public.featured_items;
-- drop policy "phase1: public write" on public.featured_communities;
-- drop policy "phase1: public write" on public.top10_communities;
-- drop policy "phase1: public write" on public.homepage_series;
-- drop policy "phase1: public write" on public.community_tag_labels;
-- drop policy "phase1: public upload" on storage.objects;
-- =====================================================================
